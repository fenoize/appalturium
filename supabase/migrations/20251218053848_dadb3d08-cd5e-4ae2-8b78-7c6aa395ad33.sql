-- Función para actualizar el progreso de un proyecto basado en sus tareas
CREATE OR REPLACE FUNCTION public.update_project_progress(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_progress INTEGER;
BEGIN
  -- Si el proyecto_id es nulo, no hacer nada
  IF p_project_id IS NULL THEN
    RETURN;
  END IF;

  -- Contar tareas totales y completadas del proyecto
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE estado = 'completada')
  INTO v_total, v_completed
  FROM public.tareas
  WHERE proyecto_id = p_project_id;

  -- Calcular progreso: si no hay tareas, progreso = 0
  IF v_total = 0 THEN
    v_progress := 0;
  ELSE
    v_progress := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100);
  END IF;

  -- Actualizar el campo progreso en proyectos
  UPDATE public.proyectos
  SET progreso = v_progress,
      updated_at = now()
  WHERE id = p_project_id;
END;
$$;

-- Función trigger para manejar cambios en tareas
CREATE OR REPLACE FUNCTION public.trigger_update_project_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: actualizar el proyecto de la nueva tarea
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_project_progress(NEW.proyecto_id);
    RETURN NEW;
  
  -- DELETE: actualizar el proyecto de la tarea eliminada
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_project_progress(OLD.proyecto_id);
    RETURN OLD;
  
  -- UPDATE: manejar cambio de proyecto_id o estado
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió el proyecto_id, actualizar ambos proyectos
    IF OLD.proyecto_id IS DISTINCT FROM NEW.proyecto_id THEN
      PERFORM public.update_project_progress(OLD.proyecto_id);
      PERFORM public.update_project_progress(NEW.proyecto_id);
    -- Si cambió el estado, solo actualizar el proyecto actual
    ELSIF OLD.estado IS DISTINCT FROM NEW.estado THEN
      PERFORM public.update_project_progress(NEW.proyecto_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Crear el trigger en la tabla tareas
DROP TRIGGER IF EXISTS trg_update_project_progress ON public.tareas;
CREATE TRIGGER trg_update_project_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_project_progress();

-- Actualizar progreso de todos los proyectos existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.proyectos LOOP
    PERFORM public.update_project_progress(r.id);
  END LOOP;
END;
$$;