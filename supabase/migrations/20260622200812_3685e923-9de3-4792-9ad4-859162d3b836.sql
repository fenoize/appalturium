
-- 1. Eliminar trigger/función anterior de sync por pago_id manual
DROP TRIGGER IF EXISTS trg_sync_estado_cuota ON public.plan_pagos;
DROP FUNCTION IF EXISTS public.sync_estado_cuota_desde_pago() CASCADE;

-- 2. Nueva función: recalcula estado de cuotas a partir del saldo del documento (FIFO)
CREATE OR REPLACE FUNCTION public.sync_cuotas_desde_documento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pagado numeric;
  v_acum numeric := 0;
  v_cuota RECORD;
BEGIN
  v_pagado := NEW.total - NEW.saldo;

  FOR v_cuota IN
    SELECT * FROM public.plan_pagos
    WHERE documento_venta_id = NEW.id
    ORDER BY numero_cuota ASC
  LOOP
    v_acum := v_acum + v_cuota.monto_esperado;
    IF v_acum <= v_pagado + 0.01 THEN
      UPDATE public.plan_pagos SET estado = 'pagada', pago_id = NULL
        WHERE id = v_cuota.id AND estado <> 'pagada';
    ELSE
      UPDATE public.plan_pagos SET estado = 'pendiente', pago_id = NULL
        WHERE id = v_cuota.id AND estado = 'pagada';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cuotas_desde_documento ON public.documentos_venta;
CREATE TRIGGER trg_sync_cuotas_desde_documento
  AFTER UPDATE OF saldo ON public.documentos_venta
  FOR EACH ROW
  WHEN (NEW.saldo IS DISTINCT FROM OLD.saldo)
  EXECUTE FUNCTION public.sync_cuotas_desde_documento();

-- 3. Restaurar saldo del documento al eliminar un pago
CREATE OR REPLACE FUNCTION public.restaurar_saldo_documento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documentos_venta
  SET saldo = saldo + OLD.monto,
      updated_at = now()
  WHERE id = OLD.documento_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_restaurar_saldo_documento ON public.pagos;
CREATE TRIGGER trigger_restaurar_saldo_documento
  AFTER DELETE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.restaurar_saldo_documento();
