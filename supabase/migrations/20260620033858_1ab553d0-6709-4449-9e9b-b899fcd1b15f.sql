CREATE OR REPLACE FUNCTION public.fn_validar_cierre_ot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_pendiente numeric;
  v_sc_total int;
  v_sc_convertidas int;
  v_oc_total int;
  v_oc_completadas int;
BEGIN
  -- a) Pago completo: si hay documentos de venta para la OT, ninguno puede tener saldo > 0
  SELECT COALESCE(SUM(saldo), 0)
    INTO v_saldo_pendiente
  FROM public.documentos_venta
  WHERE ot_id = NEW.ot_id;

  IF v_saldo_pendiente > 0 THEN
    RAISE EXCEPTION 'No se puede cerrar la OT: pago pendiente (saldo % por cobrar en documentos de venta)', v_saldo_pendiente
      USING ERRCODE = 'check_violation';
  END IF;

  -- b) Compra a proveedor resuelta
  SELECT count(*) INTO v_sc_total
  FROM public.solicitudes_compra sc
  JOIN public.cotizaciones c ON c.id = sc.cotizacion_id
  WHERE c.ot_id = NEW.ot_id;

  IF v_sc_total > 0 THEN
    SELECT count(*) INTO v_sc_convertidas
    FROM public.solicitudes_compra sc
    JOIN public.cotizaciones c ON c.id = sc.cotizacion_id
    WHERE c.ot_id = NEW.ot_id
      AND sc.estado = 'convertida_oc';

    IF v_sc_convertidas < v_sc_total THEN
      RAISE EXCEPTION 'No se puede cerrar la OT: compra a proveedor pendiente (% de % solicitudes de compra aún sin convertir a OC)',
        v_sc_total - v_sc_convertidas, v_sc_total
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT count(DISTINCT oc.id), count(DISTINCT oc.id) FILTER (WHERE oc.estado = 'completada')
      INTO v_oc_total, v_oc_completadas
    FROM public.ordenes_compra oc
    JOIN public.oc_solicitudes_compra link ON link.orden_compra_id = oc.id
    JOIN public.solicitudes_compra sc ON sc.id = link.solicitud_compra_id
    JOIN public.cotizaciones c ON c.id = sc.cotizacion_id
    WHERE c.ot_id = NEW.ot_id;

    IF v_oc_total = 0 OR v_oc_completadas < v_oc_total THEN
      RAISE EXCEPTION 'No se puede cerrar la OT: compra a proveedor pendiente (% de % órdenes de compra no están completadas)',
        v_oc_total - v_oc_completadas, v_oc_total
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_cierre_ot ON public.cierres_ot;
CREATE TRIGGER trg_validar_cierre_ot
BEFORE INSERT ON public.cierres_ot
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_cierre_ot();