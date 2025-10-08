-- Crear enum para estado de la aplicación del personal
CREATE TYPE public.estado_app AS ENUM ('offline', 'online', 'en_ruta', 'en_proceso');

-- Tabla para tracking de ubicación del personal
CREATE TABLE public.personal_ubicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat NUMERIC(10, 8) NOT NULL,
  lng NUMERIC(11, 8) NOT NULL,
  precision_m NUMERIC(10, 2),
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado_app estado_app NOT NULL DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX idx_personal_ubicacion_personal_id ON public.personal_ubicacion(personal_id);
CREATE INDEX idx_personal_ubicacion_captured_at ON public.personal_ubicacion(captured_at DESC);
CREATE INDEX idx_personal_ubicacion_estado_app ON public.personal_ubicacion(estado_app);

-- Tabla opcional para rutas diarias (planificación)
CREATE TABLE public.rutas_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  paradas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(personal_id, fecha)
);

-- Índices para rutas_dia
CREATE INDEX idx_rutas_dia_personal_id ON public.rutas_dia(personal_id);
CREATE INDEX idx_rutas_dia_fecha ON public.rutas_dia(fecha);

-- Función para calcular distancia Haversine entre dos puntos (en km)
CREATE OR REPLACE FUNCTION public.calcular_distancia_haversine(
  lat1 NUMERIC,
  lng1 NUMERIC,
  lat2 NUMERIC,
  lng2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  radio_tierra NUMERIC := 6371; -- Radio de la Tierra en km
  dlat NUMERIC;
  dlng NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN radio_tierra * c;
END;
$$;

-- Función para obtener la última ubicación de un personal
CREATE OR REPLACE FUNCTION public.obtener_ultima_ubicacion(
  _personal_id UUID
)
RETURNS TABLE (
  lat NUMERIC,
  lng NUMERIC,
  precision_m NUMERIC,
  captured_at TIMESTAMP WITH TIME ZONE,
  estado_app estado_app
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lat, lng, precision_m, captured_at, estado_app
  FROM public.personal_ubicacion
  WHERE personal_id = _personal_id
  ORDER BY captured_at DESC
  LIMIT 1;
$$;

-- Función para limpiar ubicaciones antiguas (mantener últimas N por personal)
CREATE OR REPLACE FUNCTION public.limpiar_ubicaciones_antiguas(
  _limite INTEGER DEFAULT 100
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.personal_ubicacion
  WHERE id IN (
    SELECT id
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY personal_id ORDER BY captured_at DESC) as rn
      FROM public.personal_ubicacion
    ) sub
    WHERE rn > _limite
  );
END;
$$;

-- Trigger para actualizar updated_at en rutas_dia
CREATE TRIGGER update_rutas_dia_updated_at
  BEFORE UPDATE ON public.rutas_dia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para personal_ubicacion
ALTER TABLE public.personal_ubicacion ENABLE ROW LEVEL SECURITY;

-- Admins y supervisors pueden ver todas las ubicaciones
CREATE POLICY "Admins y supervisors pueden ver todas las ubicaciones"
  ON public.personal_ubicacion
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Personal puede ver su propia ubicación
CREATE POLICY "Personal puede ver su propia ubicación"
  ON public.personal_ubicacion
  FOR SELECT
  USING (personal_id = auth.uid());

-- Personal puede insertar su propia ubicación
CREATE POLICY "Personal puede insertar su propia ubicación"
  ON public.personal_ubicacion
  FOR INSERT
  WITH CHECK (personal_id = auth.uid());

-- Admins y supervisors pueden insertar ubicaciones
CREATE POLICY "Admins y supervisors pueden insertar ubicaciones"
  ON public.personal_ubicacion
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- RLS para rutas_dia
ALTER TABLE public.rutas_dia ENABLE ROW LEVEL SECURITY;

-- Admins y supervisors pueden gestionar todas las rutas
CREATE POLICY "Admins y supervisors pueden gestionar rutas"
  ON public.rutas_dia
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Personal puede ver sus propias rutas
CREATE POLICY "Personal pueden ver sus rutas"
  ON public.rutas_dia
  FOR SELECT
  USING (personal_id = auth.uid());