CREATE OR REPLACE FUNCTION public.trg_presupuesto_aprobado_genera_opciones()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cot_id uuid;
BEGIN
  IF NEW.estado = 'aprobado'
     AND (OLD.estado IS DISTINCT FROM NEW.estado)
     AND (NEW.solicitud_cotizacion_id IS NOT NULL OR NEW.cotizacion_id IS NOT NULL) THEN

    IF NEW.cotizacion_id IS NOT NULL THEN
      v_cot_id := NEW.cotizacion_id;
    ELSE
      SELECT id INTO v_cot_id
      FROM public.cotizaciones
      WHERE solicitud_cotizacion_id = NEW.solicitud_cotizacion_id
      ORDER BY created_at DESC LIMIT 1;
    END IF;

    IF v_cot_id IS NOT NULL THEN
      PERFORM public.fn_generar_opciones_cotizacion(v_cot_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;