DO $$
DECLARE
  v_cliente uuid := '79262618-2bb2-4c73-bb68-5e82b5acdbd7';
  v_ot_ids uuid[];
  v_doc_ids uuid[];
  v_cot_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_ot_ids FROM ordenes_servicio WHERE cliente_id = v_cliente;
  SELECT array_agg(id) INTO v_doc_ids FROM documentos_venta WHERE ot_id = ANY(COALESCE(v_ot_ids,'{}'::uuid[]));
  SELECT array_agg(id) INTO v_cot_ids FROM cotizaciones WHERE cliente_id = v_cliente;

  IF v_doc_ids IS NOT NULL THEN
    DELETE FROM pagos WHERE documento_id = ANY(v_doc_ids);
    DELETE FROM documentos_venta WHERE id = ANY(v_doc_ids);
  END IF;

  IF v_cot_ids IS NOT NULL THEN
    DELETE FROM cotizacion_items WHERE cotizacion_id = ANY(v_cot_ids);
    DELETE FROM cotizaciones WHERE id = ANY(v_cot_ids);
  END IF;

  IF v_ot_ids IS NOT NULL THEN
    DELETE FROM informes_finales WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM asignaciones_ot WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM ot_estado_logs WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM comunicaciones WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM presupuestos WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM notificaciones_log WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM tiempos_reales WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM cotizaciones WHERE ot_id = ANY(v_ot_ids);
    DELETE FROM ordenes_servicio WHERE id = ANY(v_ot_ids);
  END IF;

  DELETE FROM trabajos WHERE cliente_id = v_cliente;
  DELETE FROM contactos WHERE cliente_id = v_cliente;
  DELETE FROM ubicaciones WHERE cliente_id = v_cliente;
  DELETE FROM clientes_documentos WHERE cliente_id = v_cliente;
  DELETE FROM clientes WHERE id = v_cliente;

  DELETE FROM movimientos_inventario WHERE item_id IN (SELECT id FROM inventario WHERE codigo ILIKE 'DEMO-%' OR nombre ILIKE '%Demo%');
  DELETE FROM inventario WHERE codigo ILIKE 'DEMO-%' OR nombre ILIKE '%Demo%';
  DELETE FROM servicios WHERE codigo ILIKE 'SRV-DEMO%' OR nombre ILIKE '%Demo%';
END $$;