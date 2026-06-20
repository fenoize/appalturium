
-- 1. RLS policy: técnico asignado puede actualizar su OT
CREATE POLICY "Personal asignado puede actualizar estado de su OT"
ON public.ordenes_servicio
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = ordenes_servicio.id
      AND asignaciones_ot.personal_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = ordenes_servicio.id
      AND asignaciones_ot.personal_id = auth.uid()
  )
);

-- 2. Trigger: restringir a personal no-admin/supervisor a modificar solo el campo estado
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

  -- Para cualquier otro rol (ej. técnico), solo se permite cambiar estado (y updated_at)
  IF NEW.numero            IS DISTINCT FROM OLD.numero
     OR NEW.cliente_id     IS DISTINCT FROM OLD.cliente_id
     OR NEW.ubicacion_id   IS DISTINCT FROM OLD.ubicacion_id
     OR NEW.tipo_trabajo   IS DISTINCT FROM OLD.tipo_trabajo
     OR NEW.descripcion    IS DISTINCT FROM OLD.descripcion
     OR NEW.prioridad      IS DISTINCT FROM OLD.prioridad
     OR NEW.fecha_programada_inicio IS DISTINCT FROM OLD.fecha_programada_inicio
     OR NEW.fecha_programada_fin    IS DISTINCT FROM OLD.fecha_programada_fin
     OR NEW.costos_estimado IS DISTINCT FROM OLD.costos_estimado
     OR NEW.costos_real     IS DISTINCT FROM OLD.costos_real
     OR NEW.solicitud_cotizacion_id IS DISTINCT FROM OLD.solicitud_cotizacion_id
     OR NEW.equipo_id       IS DISTINCT FROM OLD.equipo_id
     OR NEW.tarea_id        IS DISTINCT FROM OLD.tarea_id
     OR NEW.proyecto_id     IS DISTINCT FROM OLD.proyecto_id
     OR NEW.created_by      IS DISTINCT FROM OLD.created_by
     OR NEW.created_at      IS DISTINCT FROM OLD.created_at
     OR NEW.id              IS DISTINCT FROM OLD.id
  THEN
    RAISE EXCEPTION 'Solo administradores o supervisores pueden modificar campos de la OT distintos a estado'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restringir_update_ot_solo_estado ON public.ordenes_servicio;
CREATE TRIGGER trg_restringir_update_ot_solo_estado
BEFORE UPDATE ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.fn_restringir_update_ot_solo_estado();
