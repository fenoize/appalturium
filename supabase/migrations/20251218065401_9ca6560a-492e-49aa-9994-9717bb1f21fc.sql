-- =====================================================
-- Add hierarchical relationships to ordenes_servicio
-- =====================================================

-- Add trabajo_id (required relationship to trabajos)
ALTER TABLE public.ordenes_servicio 
  ADD COLUMN trabajo_id UUID NULL REFERENCES public.trabajos(id) ON DELETE SET NULL;

-- Add proyecto_id (required relationship to proyectos)
ALTER TABLE public.ordenes_servicio 
  ADD COLUMN proyecto_id UUID NULL REFERENCES public.proyectos(id) ON DELETE SET NULL;

-- Add fase_id (optional relationship to fases_proyecto)
ALTER TABLE public.ordenes_servicio 
  ADD COLUMN fase_id UUID NULL REFERENCES public.fases_proyecto(id) ON DELETE SET NULL;

-- Add tarea_id (optional relationship to tareas)
ALTER TABLE public.ordenes_servicio 
  ADD COLUMN tarea_id UUID NULL REFERENCES public.tareas(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_ordenes_servicio_trabajo_id ON public.ordenes_servicio(trabajo_id);
CREATE INDEX idx_ordenes_servicio_proyecto_id ON public.ordenes_servicio(proyecto_id);
CREATE INDEX idx_ordenes_servicio_fase_id ON public.ordenes_servicio(fase_id);
CREATE INDEX idx_ordenes_servicio_tarea_id ON public.ordenes_servicio(tarea_id);

-- =====================================================
-- Function to update task progress when OT is closed
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_ot_completion_task_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When an OT is marked as 'completed' or 'closed'
  IF NEW.estado IN ('completed', 'closed') AND OLD.estado NOT IN ('completed', 'closed') THEN
    -- If there's an associated task, we could update its progress
    -- For now, just log or trigger a project progress update
    IF NEW.tarea_id IS NOT NULL THEN
      -- Update the project progress (existing function)
      PERFORM public.update_project_progress(NEW.proyecto_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for OT completion
CREATE TRIGGER trg_ot_completion_task_progress
  AFTER UPDATE ON public.ordenes_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_ot_completion_task_progress();