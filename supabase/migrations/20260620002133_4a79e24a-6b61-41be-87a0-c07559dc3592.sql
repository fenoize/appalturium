DROP TRIGGER IF EXISTS trg_sync_estado_cuota ON public.plan_pagos;

CREATE TRIGGER trg_sync_estado_cuota
BEFORE INSERT OR UPDATE ON public.plan_pagos
FOR EACH ROW
EXECUTE FUNCTION public.sync_estado_cuota_desde_pago();