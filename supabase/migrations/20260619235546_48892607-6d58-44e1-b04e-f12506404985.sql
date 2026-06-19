
-- =====================================================================
-- 1. fn_generar_opciones_cotizacion + trigger en presupuestos
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_obtener_iva_pct()
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  raw jsonb;
  val numeric;
BEGIN
  SELECT descripcion::jsonb INTO raw
  FROM public.parametros_sistema
  WHERE categoria = 'tax_config' AND key = 'iva' AND activo = true
  LIMIT 1;

  IF raw IS NULL THEN RETURN 0.19; END IF;

  BEGIN
    val := (raw->>'value')::numeric;
  EXCEPTION WHEN OTHERS THEN
    val := NULL;
  END;

  IF val IS NULL OR val <= 0 THEN RETURN 0.19; END IF;
  IF val > 1 THEN RETURN val / 100; END IF;
  RETURN val;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_generar_opciones_cotizacion(p_cotizacion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sc_id uuid;
  v_presupuesto RECORD;
  v_iva numeric;
  v_existe int;
  v_margenes numeric[] := ARRAY[30, 20, 15];
  v_etiquetas text[] := ARRAY['A','B','C'];
  v_subtotal numeric;
  v_impuestos numeric;
  v_total numeric;
  i int;
BEGIN
  SELECT solicitud_cotizacion_id INTO v_sc_id
  FROM public.cotizaciones WHERE id = p_cotizacion_id;

  -- Buscar el presupuesto aprobado vinculado a la SC o a la cotización directamente
  SELECT * INTO v_presupuesto
  FROM public.presupuestos
  WHERE estado = 'aprobado'
    AND (
      (v_sc_id IS NOT NULL AND solicitud_cotizacion_id = v_sc_id)
      OR cotizacion_id = p_cotizacion_id
    )
  ORDER BY aprobado_ts DESC NULLS LAST, updated_at DESC
  LIMIT 1;

  IF v_presupuesto IS NULL THEN
    RAISE NOTICE 'No hay presupuesto aprobado para cotización %', p_cotizacion_id;
    RETURN;
  END IF;

  SELECT count(*) INTO v_existe
  FROM public.cotizacion_opciones WHERE cotizacion_id = p_cotizacion_id;

  IF v_existe > 0 THEN RETURN; END IF;

  v_iva := public.fn_obtener_iva_pct();

  FOR i IN 1..3 LOOP
    v_subtotal := COALESCE(v_presupuesto.costo_total, 0) * (1 + v_margenes[i] / 100);
    v_impuestos := round(v_subtotal * v_iva, 2);
    v_total := v_subtotal + v_impuestos;

    INSERT INTO public.cotizacion_opciones
      (cotizacion_id, etiqueta, orden, margen_pct, costo_base, impuestos, total, estado)
    VALUES
      (p_cotizacion_id, v_etiquetas[i], i, v_margenes[i],
       COALESCE(v_presupuesto.costo_total, 0), v_impuestos, v_total, 'pendiente');
  END LOOP;

  -- Marcar SC como cotizada
  IF v_sc_id IS NOT NULL THEN
    UPDATE public.solicitudes_cotizacion
    SET estado = 'cotizada', updated_at = now()
    WHERE id = v_sc_id AND estado <> 'aceptada';
  END IF;
END;
$$;

-- Trigger al aprobar presupuesto con SC
CREATE OR REPLACE FUNCTION public.trg_presupuesto_aprobado_genera_opciones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cot_id uuid;
BEGIN
  IF NEW.estado = 'aprobado' AND (OLD.estado IS DISTINCT FROM NEW.estado)
     AND NEW.solicitud_cotizacion_id IS NOT NULL THEN

    -- Buscar la cotización ligada a esta SC; si hay varias, tomar la más reciente
    SELECT id INTO v_cot_id
    FROM public.cotizaciones
    WHERE solicitud_cotizacion_id = NEW.solicitud_cotizacion_id
    ORDER BY created_at DESC LIMIT 1;

    IF v_cot_id IS NOT NULL THEN
      PERFORM public.fn_generar_opciones_cotizacion(v_cot_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_presupuesto_aprobado_opciones ON public.presupuestos;
CREATE TRIGGER trg_presupuesto_aprobado_opciones
AFTER UPDATE ON public.presupuestos
FOR EACH ROW EXECUTE FUNCTION public.trg_presupuesto_aprobado_genera_opciones();

-- =====================================================================
-- 2. fn_aceptar_opcion(opcion_id, num_cuotas, montos[])
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_aceptar_opcion(
  p_opcion_id uuid,
  p_num_cuotas int DEFAULT 1,
  p_montos numeric[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_opcion RECORD;
  v_cot RECORD;
  v_sc_id uuid;
  v_cliente_id uuid;
  v_ubicacion_id uuid;
  v_ot_id uuid;
  v_doc_id uuid;
  v_sc_compra_id uuid;
  v_oc_numero text;
  v_doc_numero text;
  v_montos numeric[];
  v_suma numeric := 0;
  i int;
  v_total_cuota numeric;
BEGIN
  -- Cargar opcion
  SELECT * INTO v_opcion FROM public.cotizacion_opciones WHERE id = p_opcion_id;
  IF v_opcion IS NULL THEN RAISE EXCEPTION 'Opción no encontrada'; END IF;

  -- Cargar cotizacion
  SELECT * INTO v_cot FROM public.cotizaciones WHERE id = v_opcion.cotizacion_id;
  IF v_cot IS NULL THEN RAISE EXCEPTION 'Cotización no encontrada'; END IF;

  v_sc_id := v_cot.solicitud_cotizacion_id;
  v_cliente_id := v_cot.cliente_id;

  -- Ubicación: tomarla de la SC si existe
  IF v_sc_id IS NOT NULL THEN
    SELECT ubicacion_id INTO v_ubicacion_id
    FROM public.solicitudes_cotizacion WHERE id = v_sc_id;
  END IF;

  -- Validar cuotas
  IF p_num_cuotas NOT IN (1,2) THEN RAISE EXCEPTION 'num_cuotas debe ser 1 o 2'; END IF;
  IF p_montos IS NULL OR array_length(p_montos,1) <> p_num_cuotas THEN
    -- default: una sola cuota = total
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

  -- Marcar opciones
  UPDATE public.cotizacion_opciones
  SET estado = 'aceptada', aceptada_ts = now()
  WHERE id = p_opcion_id;

  UPDATE public.cotizacion_opciones
  SET estado = 'descartada'
  WHERE cotizacion_id = v_opcion.cotizacion_id
    AND id <> p_opcion_id
    AND estado NOT IN ('aceptada','rechazada');

  UPDATE public.cotizaciones
  SET estado = 'aceptada', aceptada_ts = now(), opcion_actual_id = p_opcion_id, updated_at = now()
  WHERE id = v_cot.id;

  IF v_sc_id IS NOT NULL THEN
    UPDATE public.solicitudes_cotizacion
    SET estado = 'aceptada', updated_at = now()
    WHERE id = v_sc_id;
  END IF;

  -- Crear OT en estado pendiente
  INSERT INTO public.ordenes_servicio
    (cliente_id, ubicacion_id, solicitud_cotizacion_id, estado, descripcion, created_by)
  VALUES
    (v_cliente_id, v_ubicacion_id, v_sc_id, 'pendiente',
     'OT generada desde aceptación de cotización ' || v_cot.numero, auth.uid())
  RETURNING id INTO v_ot_id;

  -- Linkear OT a la cotización
  UPDATE public.cotizaciones SET ot_id = v_ot_id WHERE id = v_cot.id;

  -- Crear documento_venta (factura)
  v_doc_numero := public.generar_numero_documento('factura'::tipo_documento_venta);
  INSERT INTO public.documentos_venta
    (ot_id, tipo, numero, fecha, total, saldo, moneda)
  VALUES
    (v_ot_id, 'factura', v_doc_numero, CURRENT_DATE, v_opcion.total, v_opcion.total, v_cot.moneda)
  RETURNING id INTO v_doc_id;

  -- Crear cuotas
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

  -- Crear Solicitud de Compra con items tipo 'producto'
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
    SELECT
      v_sc_compra_id,
      ci.item_inventario_id,
      ci.cantidad,
      ci.precio_unitario
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
$$;

GRANT EXECUTE ON FUNCTION public.fn_aceptar_opcion(uuid, int, numeric[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_generar_opciones_cotizacion(uuid) TO authenticated;

-- =====================================================================
-- 3. fn_convertir_sc_a_oc(sc_ids[], proveedor_id) + validación de pago
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_convertir_sc_a_oc(
  p_sc_ids uuid[],
  p_proveedor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_oc_id uuid;
  v_numero text;
  v_subtotal numeric := 0;
  v_impuestos numeric;
  v_total numeric;
  v_iva numeric;
  v_user uuid := auth.uid();
  v_count_sc int;
  v_count_pagadas int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF p_sc_ids IS NULL OR array_length(p_sc_ids,1) = 0 THEN
    RAISE EXCEPTION 'Debe entregar al menos 1 SC';
  END IF;
  IF p_proveedor_id IS NULL THEN
    RAISE EXCEPTION 'Debe entregar el proveedor';
  END IF;

  -- Validación: al menos UNA cuota de cualquier SC del lote debe estar pagada
  -- Cadena: solicitudes_compra.cotizacion_id -> cotizaciones.ot_id -> documentos_venta.ot_id -> plan_pagos
  SELECT count(*) INTO v_count_sc FROM public.solicitudes_compra WHERE id = ANY(p_sc_ids);
  IF v_count_sc <> array_length(p_sc_ids,1) THEN
    RAISE EXCEPTION 'Alguna SC no existe';
  END IF;

  SELECT count(*) INTO v_count_pagadas
  FROM public.solicitudes_compra sc
  JOIN public.cotizaciones c ON c.id = sc.cotizacion_id
  JOIN public.documentos_venta dv ON dv.ot_id = c.ot_id
  JOIN public.plan_pagos pp ON pp.documento_venta_id = dv.id
  WHERE sc.id = ANY(p_sc_ids)
    AND pp.estado = 'pagada';

  IF v_count_pagadas = 0 THEN
    RAISE EXCEPTION 'No se puede generar la OC: ninguna cuota del plan de pago asociado está pagada';
  END IF;

  v_iva := public.fn_obtener_iva_pct();

  -- Crear OC
  v_numero := public.generar_numero_oc();
  INSERT INTO public.ordenes_compra (numero, proveedor_id, created_by, subtotal, impuestos, total)
  VALUES (v_numero, p_proveedor_id, v_user, 0, 0, 0)
  RETURNING id INTO v_oc_id;

  -- Agregar items sumando cantidades por item_inventario_id, promediando precios
  WITH agg AS (
    SELECT
      isc.item_inventario_id AS item_id,
      sum(isc.cantidad) AS cantidad,
      avg(COALESCE(isc.costo_unitario_estimado, 0)) AS precio
    FROM public.items_solicitud_compra isc
    WHERE isc.solicitud_compra_id = ANY(p_sc_ids)
    GROUP BY isc.item_inventario_id
  )
  INSERT INTO public.items_orden_compra
    (orden_id, item_id, cantidad_solicitada, precio_unitario, subtotal)
  SELECT v_oc_id, item_id, cantidad, precio, cantidad * precio
  FROM agg;

  SELECT COALESCE(sum(subtotal),0) INTO v_subtotal
  FROM public.items_orden_compra WHERE orden_id = v_oc_id;
  v_impuestos := round(v_subtotal * v_iva, 2);
  v_total := v_subtotal + v_impuestos;

  UPDATE public.ordenes_compra
  SET subtotal = v_subtotal, impuestos = v_impuestos, total = v_total
  WHERE id = v_oc_id;

  -- Puente
  INSERT INTO public.oc_solicitudes_compra (orden_compra_id, solicitud_compra_id)
  SELECT v_oc_id, unnest(p_sc_ids);

  -- Marcar SCs como convertidas
  UPDATE public.solicitudes_compra
  SET estado = 'convertida_oc', updated_at = now()
  WHERE id = ANY(p_sc_ids);

  RETURN v_oc_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_convertir_sc_a_oc(uuid[], uuid) TO authenticated;

-- =====================================================================
-- 4. Trigger de respaldo en oc_solicitudes_compra para validar pago
-- (si alguien intenta crear la fila directamente sin usar fn_convertir_sc_a_oc)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_validar_pago_antes_oc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pagadas int;
BEGIN
  SELECT count(*) INTO v_pagadas
  FROM public.solicitudes_compra sc
  JOIN public.cotizaciones c ON c.id = sc.cotizacion_id
  JOIN public.documentos_venta dv ON dv.ot_id = c.ot_id
  JOIN public.plan_pagos pp ON pp.documento_venta_id = dv.id
  WHERE sc.id = NEW.solicitud_compra_id
    AND pp.estado = 'pagada';

  IF v_pagadas = 0 THEN
    RAISE EXCEPTION 'No se puede asociar SC % a una OC: ninguna cuota del plan de pago está pagada', NEW.solicitud_compra_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_pago_antes_oc ON public.oc_solicitudes_compra;
CREATE TRIGGER trg_validar_pago_antes_oc
BEFORE INSERT ON public.oc_solicitudes_compra
FOR EACH ROW EXECUTE FUNCTION public.fn_validar_pago_antes_oc();
