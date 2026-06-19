
-- Sequence + function for SC number
CREATE SEQUENCE IF NOT EXISTS public.solicitud_compra_numero_seq START 1;

CREATE OR REPLACE FUNCTION public.generar_numero_solicitud_compra()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  secuencia TEXT;
BEGIN
  secuencia := LPAD(nextval('public.solicitud_compra_numero_seq')::TEXT, 5, '0');
  RETURN 'SC-' || secuencia;
END;
$$;

-- 1) solicitudes_compra
CREATE TABLE public.solicitudes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id),
  cotizacion_opcion_id uuid NOT NULL REFERENCES public.cotizacion_opciones(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','revisada','convertida_oc','cancelada')),
  revisado_por uuid REFERENCES auth.users(id),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes_compra TO authenticated;
GRANT ALL ON public.solicitudes_compra TO service_role;
GRANT USAGE ON SEQUENCE public.solicitud_compra_numero_seq TO authenticated, service_role;

ALTER TABLE public.solicitudes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver solicitudes_compra"
  ON public.solicitudes_compra FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden crear solicitudes_compra"
  ON public.solicitudes_compra FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar solicitudes_compra"
  ON public.solicitudes_compra FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden eliminar solicitudes_compra"
  ON public.solicitudes_compra FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.auto_generar_numero_solicitud_compra()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := public.generar_numero_solicitud_compra();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_numero_solicitud_compra
  BEFORE INSERT ON public.solicitudes_compra
  FOR EACH ROW EXECUTE FUNCTION public.auto_generar_numero_solicitud_compra();

CREATE TRIGGER trg_solicitudes_compra_updated_at
  BEFORE UPDATE ON public.solicitudes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) items_solicitud_compra
CREATE TABLE public.items_solicitud_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_compra_id uuid NOT NULL REFERENCES public.solicitudes_compra(id) ON DELETE CASCADE,
  item_inventario_id uuid NOT NULL REFERENCES public.inventario(id),
  cantidad numeric NOT NULL CHECK (cantidad > 0),
  costo_unitario_estimado numeric,
  proveedor_sugerido_id uuid REFERENCES public.proveedores(id),
  cantidad_en_oc numeric NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.items_solicitud_compra TO authenticated;
GRANT ALL ON public.items_solicitud_compra TO service_role;

ALTER TABLE public.items_solicitud_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver items_sc"
  ON public.items_solicitud_compra FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden crear items_sc"
  ON public.items_solicitud_compra FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar items_sc"
  ON public.items_solicitud_compra FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden eliminar items_sc"
  ON public.items_solicitud_compra FOR DELETE USING (auth.uid() IS NOT NULL);

-- 3) oc_solicitudes_compra
CREATE TABLE public.oc_solicitudes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  solicitud_compra_id uuid NOT NULL REFERENCES public.solicitudes_compra(id) ON DELETE CASCADE,
  UNIQUE (orden_compra_id, solicitud_compra_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oc_solicitudes_compra TO authenticated;
GRANT ALL ON public.oc_solicitudes_compra TO service_role;

ALTER TABLE public.oc_solicitudes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver oc_sc"
  ON public.oc_solicitudes_compra FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden crear oc_sc"
  ON public.oc_solicitudes_compra FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden actualizar oc_sc"
  ON public.oc_solicitudes_compra FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios autenticados pueden eliminar oc_sc"
  ON public.oc_solicitudes_compra FOR DELETE USING (auth.uid() IS NOT NULL);
