CREATE OR REPLACE FUNCTION public.fn_presentar_opcion(p_opcion_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cot_id uuid;
BEGIN
  SELECT cotizacion_id INTO v_cot_id
  FROM public.cotizacion_opciones
  WHERE id = p_opcion_id;

  IF v_cot_id IS NULL THEN
    RAISE EXCEPTION 'Opción % no encontrada', p_opcion_id;
  END IF;

  UPDATE public.cotizacion_opciones
  SET estado = 'presentada',
      presentada_ts = now()
  WHERE id = p_opcion_id;

  UPDATE public.cotizaciones
  SET opcion_actual_id = p_opcion_id,
      updated_at = now()
  WHERE id = v_cot_id;

  RETURN v_cot_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.fn_presentar_opcion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_presentar_opcion(uuid) TO service_role;