CREATE OR REPLACE FUNCTION public.fn_aceptar_opcion(p_opcion_id uuid, p_num_cuotas integer DEFAULT 1, p_montos numeric[] DEFAULT NULL::numeric[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_opcion RECORD;
  v_cot RECORD;
  v_sc_id uuid;
  v_cliente_id uuid;
  v_ubicacion_id uuid;
  v_ot_id uuid;
  v_ot_numero text;
  v_doc_id uuid;
  v_sc_compra_id uuid;
  v_doc_numero text;
  v_montos numeric[];
  v_suma numeric := 0;
  i int;
  v_total_cuota numeric;
BEGIN
  SELECT * INTO v_opcion FROM public.cotizacion_opciones WHERE id = p_opcion_id;
  IF v_opcion IS NULL THEN RAISE EXCEPTION 'Opción no encontrada'; END IF;

  SELECT * INTO v_cot FROM public.cotizaciones WHERE id = v_opcion.cotizacion_id;
  IF v_cot IS NULL THEN RAISE EXCEPTION 'Cotización no encontrada'; END IF;

  v_sc_id := v_cot.solicitud_cotizacion_id;
  v_cliente_id := v_cot.cliente_id;

  IF v_sc_id IS NOT NULL THEN
    SELECT ubicacion_id INTO v_ubicacion_id
    FROM public.solicitudes_cotizacion WHERE id = v_sc_id;
  END IF;

  -- Fallback: primera ubicación del cliente
  IF v_ubicacion_id IS NULL THEN
    SELECT id INTO v_ubicacion_id
    FROM public.ubicaciones
    WHERE cliente_id = v_cliente_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_ubicacion_id IS NULL THEN
    RAISE EXCEPTION 'El cliente no tiene ubicaciones registradas. Debe crear al menos una ubicación antes de aceptar la cotización.';
  END IF;

  IF p_num_cuotas NOT IN (1,2) THEN RAISE EXCEPTION 'num_cuotas debe ser 1 o 2'; END IF;
  IF p_montos IS NULL OR array_length(p_montos,1) <> p_num_cuotas THEN
    IF p_num_cuotas = 1 THEN
      v_montos := ARRAY[v_opcion.total];
    ELSE
      RAISE EXCEPTION 'Debe entregar los montos de las 2 cuotas';
    END IF;
  ELSE
    v_montos := p_montos;
  END IF;

  FOR i IN 1..array_length(v_montos,1) LOOP
    v_suma := v_suma + v_montos[i];
  END LOOP;
  IF abs(v_suma - v_opcion.total) > 0.01 THEN
    RAISE EXCEPTION 'La suma de cuotas (%) no coincide con el total de la opción (%)', v_suma, v_opcion.total;
  END IF;

  UPDATE public.cotizacion_opciones
  SET estado = 'aceptada', aceptada_ts = now()
  WHERE id = p_opcion_id;

  UPDATE public.cotizacion_opciones
  SET estado = 'descartada'
  WHERE cotizacion_id = v_cot.id AND id <> p_opcion_id AND estado <> 'aceptada';

  UPDATE public.cotizaciones
  SET estado = 'aceptada', opcion_actual_id = p_opcion_id, updated_at = now()
  WHERE id = v_cot.id;

  IF v_sc_id IS NOT NULL THEN
    UPDATE public.solicitudes_cotizacion
    SET estado = 'aceptada_con_cotizacion', updated_at = now()
    WHERE id = v_sc_id;
  END IF;

  -- Crear OT
  v_ot_numero := public.generar_numero_ot();
  INSERT INTO public.ordenes_servicio
    (numero, cliente_id, ubicacion_id, solicitud_cotizacion_id, estado,
     tipo_trabajo, descripcion, created_by_user_id)
  VALUES
    (v_ot_numero, v_cliente_id, v_ubicacion_id, v_sc_id, 'pendiente',
     'cotizacion',
     'OT generada desde aceptación de cotización ' || v_cot.numero,
     COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid))
  RETURNING id INTO v_ot_id;

  UPDATE public.cotizaciones SET ot_id = v_ot_id WHERE id = v_cot.id;

  v_doc_numero := public.generar_numero_documento('factura'::tipo_documento_venta);
  INSERT INTO public.documentos_venta
    (ot_id, tipo, numero, fecha, total, saldo, moneda)
  VALUES
    (v_ot_id, 'factura', v_doc_numero, CURRENT_DATE, v_opcion.total, v_opcion.total, v_cot.moneda)
  RETURNING id INTO v_doc_id;

  FOR i IN 1..array_length(v_montos,1) LOOP
    v_total_cuota := v_montos[i];
    INSERT INTO public.plan_pagos
      (documento_venta_id, numero_cuota, monto_esperado, fecha_esperada, estado)
    VALUES
      (v_doc_id, i, v_total_cuota,
       CASE WHEN i = 1 THEN CURRENT_DATE + INTERVAL '15 days'
            ELSE CURRENT_DATE + INTERVAL '45 days' END,
       'pendiente');
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.cotizacion_items
    WHERE cotizacion_id = v_cot.id
      AND tipo = 'producto'
      AND item_inventario_id IS NOT NULL
  ) THEN
    INSERT INTO public.solicitudes_compra
      (cotizacion_id, cotizacion_opcion_id, cliente_id, estado, notas)
    VALUES
      (v_cot.id, p_opcion_id, v_cliente_id, 'pendiente',
       'SC generada automáticamente al aceptar opción ' || v_opcion.etiqueta)
    RETURNING id INTO v_sc_compra_id;

    INSERT INTO public.items_solicitud_compra
      (solicitud_compra_id, item_inventario_id, cantidad, costo_unitario_estimado)
    SELECT v_sc_compra_id, ci.item_inventario_id, ci.cantidad, ci.precio_unitario
    FROM public.cotizacion_items ci
    WHERE ci.cotizacion_id = v_cot.id
      AND ci.tipo = 'producto'
      AND ci.item_inventario_id IS NOT NULL;
  END IF;

  RETURN jsonb_build_object(
    'ot_id', v_ot_id,
    'documento_venta_id', v_doc_id,
    'solicitud_compra_id', v_sc_compra_id,
    'cotizacion_id', v_cot.id
  );
END;
$function$;