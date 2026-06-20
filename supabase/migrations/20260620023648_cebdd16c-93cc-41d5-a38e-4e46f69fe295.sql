
CREATE OR REPLACE FUNCTION public.fn_validar_transicion_estado_ot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_valido boolean := false;
BEGIN
  IF OLD.estado IS NOT DISTINCT FROM NEW.estado THEN
    RETURN NEW;
  END IF;

  -- Si el estado anterior es NULL (recién insertado), permitir cualquier valor inicial
  IF OLD.estado IS NULL THEN
    RETURN NEW;
  END IF;

  v_valido := CASE OLD.estado
    WHEN 'pendiente' THEN NEW.estado IN ('en_curso', 'cancelado')
    WHEN 'en_curso'  THEN NEW.estado IN ('en_pausa', 'finalizado', 'cancelado')
    WHEN 'en_pausa'  THEN NEW.estado IN ('en_curso', 'cancelado')
    WHEN 'finalizado' THEN false
    WHEN 'cancelado'  THEN false
    ELSE false
  END;

  IF NOT v_valido THEN
    RAISE EXCEPTION 'Transición de estado no permitida: % → %', OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_transicion_estado_ot ON public.ordenes_servicio;

CREATE TRIGGER trg_validar_transicion_estado_ot
BEFORE UPDATE OF estado ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_transicion_estado_ot();
