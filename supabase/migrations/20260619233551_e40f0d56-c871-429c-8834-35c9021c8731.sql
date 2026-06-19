
-- Sequence + function for SOL number
CREATE SEQUENCE IF NOT EXISTS public.solicitud_cotizacion_numero_seq START 1;

CREATE OR REPLACE FUNCTION public.generar_numero_solicitud_cotizacion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  secuencia TEXT;
BEGIN
  secuencia := LPAD(nextval('public.solicitud_cotizacion_numero_seq')::TEXT, 5, '0');
  RETURN 'SOL-' || secuencia;
END;
$$;

-- Table
CREATE TABLE public.solicitudes_cotizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  ubicacion_id uuid REFERENCES public.ubicaciones(id),
  ejecutivo_id uuid NOT NULL REFERENCES auth.users(id),
  tipo_servicio text,
  descripcion_necesidad text NOT NULL,
  detalle_requerimiento jsonb NOT NULL DEFAULT '{}'::jsonb,
  fecha_visita_tecnica timestamptz,
  archivos_adjuntos jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva','en_presupuesto','cotizada','negociacion','aceptada','cerrada_sin_acuerdo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes_cotizacion TO authenticated;
GRANT ALL ON public.solicitudes_cotizacion TO service_role;
GRANT USAGE ON SEQUENCE public.solicitud_cotizacion_numero_seq TO authenticated, service_role;

ALTER TABLE public.solicitudes_cotizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver solicitudes"
  ON public.solicitudes_cotizacion FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear solicitudes"
  ON public.solicitudes_cotizacion FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar solicitudes"
  ON public.solicitudes_cotizacion FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar solicitudes"
  ON public.solicitudes_cotizacion FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Auto-number trigger
CREATE OR REPLACE FUNCTION public.auto_generar_numero_solicitud()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := public.generar_numero_solicitud_cotizacion();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_numero_solicitud
  BEFORE INSERT ON public.solicitudes_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.auto_generar_numero_solicitud();

CREATE TRIGGER trg_solicitudes_updated_at
  BEFORE UPDATE ON public.solicitudes_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Presupuestos: add solicitud_cotizacion_id + unique index per solicitud
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS solicitud_cotizacion_id uuid REFERENCES public.solicitudes_cotizacion(id);

CREATE UNIQUE INDEX IF NOT EXISTS presupuestos_solicitud_unique
  ON public.presupuestos(solicitud_cotizacion_id)
  WHERE solicitud_cotizacion_id IS NOT NULL;
