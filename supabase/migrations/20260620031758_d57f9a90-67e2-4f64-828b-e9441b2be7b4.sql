CREATE OR REPLACE FUNCTION public.fn_restringir_update_ot_solo_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Si no hay usuario autenticado (operación de sistema/trigger interno), permitir
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins y supervisores pueden modificar cualquier campo
  IF public.has_role(v_uid, 'admin'::app_role)
     OR public.has_role(v_uid, 'supervisor'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Para cualquier otro rol (ej. técnico), solo se permite cambiar estado y updated_at
  IF NEW.adjuntos                   IS DISTINCT FROM OLD.adjuntos
     OR NEW.cliente_id             IS DISTINCT FROM OLD.cliente_id
     OR NEW.costos_estimado         IS DISTINCT FROM OLD.costos_estimado
     OR NEW.costos_real             IS DISTINCT FROM OLD.costos_real
     OR NEW.created_at              IS DISTINCT FROM OLD.created_at
     OR NEW.created_by_user_id      IS DISTINCT FROM OLD.created_by_user_id
     OR NEW.descripcion             IS DISTINCT FROM OLD.descripcion
     OR NEW.equipo_id               IS DISTINCT FROM OLD.equipo_id
     OR NEW.fase_id                 IS DISTINCT FROM OLD.fase_id
     OR NEW.fecha_programada_fin    IS DISTINCT FROM OLD.fecha_programada_fin
     OR NEW.fecha_programada_inicio IS DISTINCT FROM OLD.fecha_programada_inicio
     OR NEW.id                      IS DISTINCT FROM OLD.id
     OR NEW.numero                  IS DISTINCT FROM OLD.numero
     OR NEW.prioridad               IS DISTINCT FROM OLD.prioridad
     OR NEW.proyecto_id             IS DISTINCT FROM OLD.proyecto_id
     OR NEW.solicitud_cotizacion_id IS DISTINCT FROM OLD.solicitud_cotizacion_id
     OR NEW.tarea_id                IS DISTINCT FROM OLD.tarea_id
     OR NEW.tipo_trabajo            IS DISTINCT FROM OLD.tipo_trabajo
     OR NEW.trabajo_id              IS DISTINCT FROM OLD.trabajo_id
     OR NEW.ubicacion_id            IS DISTINCT FROM OLD.ubicacion_id
  THEN
    RAISE EXCEPTION 'Solo administradores o supervisores pueden modificar campos de la OT distintos a estado'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;