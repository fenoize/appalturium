
-- Agregar 'equipo' al enum de tipo_item_inventario
ALTER TYPE public.tipo_item_inventario ADD VALUE IF NOT EXISTS 'equipo';

-- Crear enum para estado de equipo
CREATE TYPE public.estado_equipo AS ENUM ('en_bodega', 'asignado_tecnico', 'instalado', 'en_mantenimiento', 'dado_de_baja');

-- Crear enum para tipo de intervención
CREATE TYPE public.tipo_intervencion_equipo AS ENUM ('instalacion', 'mantenimiento_preventivo', 'mantenimiento_correctivo', 'cambio_equipo', 'retiro');

-- Tabla principal de equipos (ficha del equipo)
CREATE TABLE public.equipos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_qr VARCHAR(50) NOT NULL UNIQUE,
  item_inventario_id UUID REFERENCES public.inventario(id),
  numero_serie VARCHAR(100),
  modelo VARCHAR(200),
  marca VARCHAR(200),
  descripcion TEXT,
  fecha_compra DATE,
  fecha_garantia_fin DATE,
  proveedor_id UUID REFERENCES public.proveedores(id),
  costo_adquisicion NUMERIC(12,2),
  estado public.estado_equipo NOT NULL DEFAULT 'en_bodega',
  ubicacion_actual VARCHAR(300),
  tecnico_asignado_id UUID REFERENCES public.personal_fichas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  ubicacion_cliente_id UUID REFERENCES public.ubicaciones(id),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

-- Tabla de movimientos del equipo (historial de ubicaciones/asignaciones)
CREATE TABLE public.equipos_movimientos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'compra', 'almacenamiento', 'asignacion_tecnico', 'instalacion_cliente', 'retiro'
  fecha TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ubicacion_origen VARCHAR(300),
  ubicacion_destino VARCHAR(300),
  tecnico_id UUID REFERENCES public.personal_fichas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  ot_id UUID REFERENCES public.ordenes_servicio(id),
  notas TEXT,
  registrado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de intervenciones del equipo
CREATE TABLE public.equipos_intervenciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  tipo public.tipo_intervencion_equipo NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tecnico_id UUID REFERENCES public.personal_fichas(id),
  ot_id UUID REFERENCES public.ordenes_servicio(id),
  descripcion TEXT NOT NULL,
  observaciones TEXT,
  estado_antes VARCHAR(100),
  estado_despues VARCHAR(100),
  evidencias_urls JSONB,
  registrado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de materiales asociados al equipo (pack)
CREATE TABLE public.equipos_materiales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  item_inventario_id UUID NOT NULL REFERENCES public.inventario(id),
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  notas TEXT,
  fecha_asociacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_equipos_codigo_qr ON public.equipos(codigo_qr);
CREATE INDEX idx_equipos_estado ON public.equipos(estado);
CREATE INDEX idx_equipos_cliente ON public.equipos(cliente_id);
CREATE INDEX idx_equipos_tecnico ON public.equipos(tecnico_asignado_id);
CREATE INDEX idx_equipos_movimientos_equipo ON public.equipos_movimientos(equipo_id);
CREATE INDEX idx_equipos_intervenciones_equipo ON public.equipos_intervenciones(equipo_id);
CREATE INDEX idx_equipos_materiales_equipo ON public.equipos_materiales(equipo_id);

-- Función para generar código QR único
CREATE OR REPLACE FUNCTION public.generar_codigo_equipo()
RETURNS TEXT AS $$
DECLARE
  nuevo_codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    nuevo_codigo := 'EQ-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.equipos WHERE codigo_qr = nuevo_codigo) INTO existe;
    IF NOT existe THEN
      RETURN nuevo_codigo;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_equipos_updated_at
BEFORE UPDATE ON public.equipos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipos_materiales_updated_at
BEFORE UPDATE ON public.equipos_materiales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos_intervenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos_materiales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para equipos
CREATE POLICY "Usuarios autenticados pueden ver equipos"
ON public.equipos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear equipos"
ON public.equipos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar equipos"
ON public.equipos FOR UPDATE
TO authenticated
USING (true);

-- Políticas RLS para movimientos
CREATE POLICY "Usuarios autenticados pueden ver movimientos"
ON public.equipos_movimientos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear movimientos"
ON public.equipos_movimientos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS para intervenciones
CREATE POLICY "Usuarios autenticados pueden ver intervenciones"
ON public.equipos_intervenciones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear intervenciones"
ON public.equipos_intervenciones FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS para materiales
CREATE POLICY "Usuarios autenticados pueden ver materiales"
ON public.equipos_materiales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar materiales"
ON public.equipos_materiales FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Política pública para lectura de equipo por código QR (técnicos en campo)
CREATE POLICY "Lectura pública por código QR"
ON public.equipos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Lectura pública movimientos por equipo"
ON public.equipos_movimientos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Lectura pública intervenciones por equipo"
ON public.equipos_intervenciones FOR SELECT
TO anon
USING (true);
