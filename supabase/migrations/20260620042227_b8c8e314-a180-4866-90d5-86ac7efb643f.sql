CREATE OR REPLACE FUNCTION public.fn_cerrar_ot_con_documento(
  p_ot_id uuid,
  p_revisado_por uuid,
  p_conforme boolean,
  p_cobro_final numeric,
  p_observaciones text,
  p_tipo_documento tipo_documento_venta,
  p_moneda tipo_moneda DEFAULT 'CLP'::tipo_moneda,
  p_metodo_pago metodo_pago DEFAULT 'transferencia'::metodo_pago,
  p_ot_numero text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_doc_id uuid;
  v_cierre_id uuid;
  v_numero text;
  v_hoy date := CURRENT_DATE;
BEGIN
  IF p_ot_id IS NULL THEN
    RAISE EXCEPTION 'p_ot_id es requerido';
  END IF;
  IF p_revisado_por IS NULL THEN
    RAISE EXCEPTION 'p_revisado_por es requerido';
  END IF;
  IF p_cobro_final IS NULL OR p_cobro_final <= 0 THEN
    RAISE EXCEPTION 'p_cobro_final debe ser mayor a 0 para generar documento de venta';
  END IF;

  v_numero := public.generar_numero_documento(p_tipo_documento);
  INSERT INTO public.documentos_venta (ot_id, tipo, numero, fecha, total, saldo, moneda)
  VALUES (p_ot_id, p_tipo_documento, v_numero, v_hoy, p_cobro_final, p_cobro_final, p_moneda)
  RETURNING id INTO v_doc_id;

  INSERT INTO public.pagos (documento_id, fecha, monto, metodo, referencia, notas, registrado_por_user_id)
  VALUES (
    v_doc_id, v_hoy, p_cobro_final, p_metodo_pago,
    'Cobro al cierre OT ' || COALESCE(p_ot_numero, p_ot_id::text),
    'Pago registrado automáticamente al cerrar la OT',
    p_revisado_por
  );

  INSERT INTO public.cierres_ot (ot_id, revisado_por, conforme, cobro_final, observaciones, documento_venta_id)
  VALUES (p_ot_id, p_revisado_por, p_conforme, p_cobro_final, p_observaciones, v_doc_id)
  RETURNING id INTO v_cierre_id;

  RETURN jsonb_build_object(
    'cierre_id', v_cierre_id,
    'documento_venta_id', v_doc_id,
    'documento_numero', v_numero
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.fn_cerrar_ot_con_documento(uuid, uuid, boolean, numeric, text, tipo_documento_venta, tipo_moneda, metodo_pago, text) TO authenticated;