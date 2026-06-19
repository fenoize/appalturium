
-- 1. Add columns to informes_finales
ALTER TABLE public.informes_finales
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id),
  ADD COLUMN IF NOT EXISTS equipo_id uuid REFERENCES public.equipos(id),
  ADD COLUMN IF NOT EXISTS especificaciones_equipo jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill cliente_id and equipo_id from the OT
UPDATE public.informes_finales f
SET cliente_id = o.cliente_id,
    equipo_id  = COALESCE(f.equipo_id, o.equipo_id)
FROM public.ordenes_servicio o
WHERE o.id = f.ot_id
  AND (f.cliente_id IS NULL OR f.equipo_id IS NULL);

-- Normalize evidencias_urls (array form → {antes:[], despues:[]})
UPDATE public.informes_finales
SET evidencias_urls = jsonb_build_object(
  'antes',   '[]'::jsonb,
  'despues', COALESCE(evidencias_urls, '[]'::jsonb)
)
WHERE jsonb_typeof(evidencias_urls) = 'array';

UPDATE public.informes_finales
SET evidencias_urls = '{"antes": [], "despues": []}'::jsonb
WHERE evidencias_urls IS NULL OR jsonb_typeof(evidencias_urls) <> 'object';

-- Ensure both keys exist on object form
UPDATE public.informes_finales
SET evidencias_urls = jsonb_build_object(
  'antes',   COALESCE(evidencias_urls->'antes',   '[]'::jsonb),
  'despues', COALESCE(evidencias_urls->'despues', '[]'::jsonb)
)
WHERE jsonb_typeof(evidencias_urls) = 'object';

-- Auto-fill cliente_id and equipo_id from OT on insert/update
CREATE OR REPLACE FUNCTION public.completar_informe_desde_ot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cli uuid;
  v_eq  uuid;
BEGIN
  IF NEW.ot_id IS NOT NULL THEN
    SELECT cliente_id, equipo_id INTO v_cli, v_eq
    FROM public.ordenes_servicio WHERE id = NEW.ot_id;

    IF NEW.cliente_id IS NULL THEN
      NEW.cliente_id := v_cli;
    END IF;
    IF NEW.equipo_id IS NULL THEN
      NEW.equipo_id := v_eq;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_completar_informe_desde_ot ON public.informes_finales;
CREATE TRIGGER trg_completar_informe_desde_ot
BEFORE INSERT OR UPDATE ON public.informes_finales
FOR EACH ROW EXECUTE FUNCTION public.completar_informe_desde_ot();

-- 2. cierres_ot table
CREATE TABLE IF NOT EXISTS public.cierres_ot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id uuid UNIQUE NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  revisado_por uuid NOT NULL REFERENCES auth.users(id),
  fecha_revision timestamptz NOT NULL DEFAULT now(),
  conforme boolean,
  cobro_final numeric,
  documento_venta_id uuid REFERENCES public.documentos_venta(id),
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cierres_ot TO authenticated;
GRANT ALL ON public.cierres_ot TO service_role;

ALTER TABLE public.cierres_ot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y supervisores ven cierres_ot"
ON public.cierres_ot FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Admins y supervisores crean cierres_ot"
ON public.cierres_ot FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Admins y supervisores editan cierres_ot"
ON public.cierres_ot FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Admins y supervisores eliminan cierres_ot"
ON public.cierres_ot FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

CREATE TRIGGER trg_update_cierres_ot_updated_at
BEFORE UPDATE ON public.cierres_ot
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
