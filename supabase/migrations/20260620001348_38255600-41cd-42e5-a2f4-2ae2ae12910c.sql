-- Drop old broken trigger and function on pagos
DROP TRIGGER IF EXISTS trg_actualizar_estado_cuota ON public.pagos;
DROP TRIGGER IF EXISTS actualizar_estado_cuota_trigger ON public.pagos;
DROP FUNCTION IF EXISTS public.actualizar_estado_cuota() CASCADE;

-- New trigger on plan_pagos to keep estado in sync with pago_id
CREATE OR REPLACE FUNCTION public.sync_estado_cuota_desde_pago()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pago_id IS NOT NULL THEN
    NEW.estado := 'pagada';
  ELSIF NEW.pago_id IS NULL AND TG_OP = 'UPDATE' AND OLD.estado = 'pagada' THEN
    NEW.estado := 'pendiente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_estado_cuota ON public.plan_pagos;
CREATE TRIGGER trg_sync_estado_cuota
  BEFORE INSERT OR UPDATE ON public.plan_pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_estado_cuota_desde_pago();