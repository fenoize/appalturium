-- Crear enum para estados de cotización
CREATE TYPE public.estado_cotizacion AS ENUM (
  'borrador',
  'en_revision',
  'aceptada',
  'rechazada',
  'asignada_ot'
);

-- Tabla principal de cotizaciones
CREATE TABLE public.cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id),
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  validez_dias INTEGER NOT NULL DEFAULT 30,
  estado public.estado_cotizacion NOT NULL DEFAULT 'borrador',
  moneda public.tipo_moneda NOT NULL DEFAULT 'CLP',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notas TEXT,
  condiciones TEXT,
  token_acceso TEXT UNIQUE,
  aceptada_por_nombre TEXT,
  aceptada_por_email TEXT,
  aceptada_ts TIMESTAMPTZ,
  rechazada_ts TIMESTAMPTZ,
  rechazo_motivo TEXT,
  ot_id UUID REFERENCES public.ordenes_servicio(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ítems de la cotización (productos y servicios)
CREATE TABLE public.cotizacion_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('producto', 'servicio', 'personalizado')),
  item_inventario_id UUID REFERENCES public.inventario(id),
  servicio_id UUID REFERENCES public.servicios(id),
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

-- Políticas para cotizaciones (usuarios autenticados pueden todo)
CREATE POLICY "Usuarios autenticados pueden ver cotizaciones"
ON public.cotizaciones FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear cotizaciones"
ON public.cotizaciones FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar cotizaciones"
ON public.cotizaciones FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar cotizaciones"
ON public.cotizaciones FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Políticas para items de cotización
CREATE POLICY "Usuarios autenticados pueden ver items"
ON public.cotizacion_items FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear items"
ON public.cotizacion_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar items"
ON public.cotizacion_items FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar items"
ON public.cotizacion_items FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Política especial para acceso público con token (clientes sin login)
CREATE POLICY "Acceso público con token válido"
ON public.cotizaciones FOR SELECT
USING (token_acceso IS NOT NULL AND token_acceso = current_setting('app.cotizacion_token', true));

CREATE POLICY "Actualizar cotización con token válido"
ON public.cotizaciones FOR UPDATE
USING (token_acceso IS NOT NULL AND token_acceso = current_setting('app.cotizacion_token', true));

-- Función para generar número de cotización
CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  anio TEXT;
  secuencia TEXT;
  contador INTEGER;
BEGIN
  anio := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COUNT(*) + 1 INTO contador
  FROM public.cotizaciones
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
  secuencia := LPAD(contador::TEXT, 6, '0');
  RETURN 'COT-' || anio || '-' || secuencia;
END;
$function$;

-- Trigger para updated_at
CREATE TRIGGER update_cotizaciones_updated_at
BEFORE UPDATE ON public.cotizaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_cotizaciones_cliente_id ON public.cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX idx_cotizaciones_token ON public.cotizaciones(token_acceso);
CREATE INDEX idx_cotizacion_items_cotizacion_id ON public.cotizacion_items(cotizacion_id);