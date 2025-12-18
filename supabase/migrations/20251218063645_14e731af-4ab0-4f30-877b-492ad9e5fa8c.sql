-- =====================================================
-- 1. Create ENUM for cost entry source
-- =====================================================

CREATE TYPE public.fuente_costo AS ENUM ('compra', 'servicio', 'tarea_estandar', 'ajuste');

-- =====================================================
-- 2. Create TASK_TYPES table
-- =====================================================

CREATE TABLE public.task_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NULL,
  costo_estandar NUMERIC NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins y supervisors pueden gestionar task_types" 
  ON public.task_types 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios autenticados pueden ver task_types activos" 
  ON public.task_types 
  FOR SELECT 
  USING (activo = true AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_task_types_updated_at
  BEFORE UPDATE ON public.task_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. Create PROJECT_COST_ENTRIES table (ledger)
-- =====================================================

CREATE TABLE public.project_cost_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  fuente public.fuente_costo NOT NULL,
  ref_id UUID NULL,
  descripcion TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_cost_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins y supervisors pueden gestionar cost_entries" 
  ON public.project_cost_entries 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios autenticados pueden ver cost_entries" 
  ON public.project_cost_entries 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX idx_cost_entries_proyecto_id ON public.project_cost_entries(proyecto_id);
CREATE INDEX idx_cost_entries_ref_id ON public.project_cost_entries(ref_id);

-- =====================================================
-- 4. Modify TAREAS table - add costing columns
-- =====================================================

ALTER TABLE public.tareas 
  ADD COLUMN task_type_id UUID NULL REFERENCES public.task_types(id) ON DELETE SET NULL,
  ADD COLUMN costo_aplicado NUMERIC NULL,
  ADD COLUMN cost_entry_id UUID NULL REFERENCES public.project_cost_entries(id) ON DELETE SET NULL;

-- Index for task_type lookup
CREATE INDEX idx_tareas_task_type_id ON public.tareas(task_type_id);

-- =====================================================
-- 5. Create function to handle task costing
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_task_costing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_costo_estandar NUMERIC;
  v_entry_id UUID;
  v_task_type_nombre TEXT;
BEGIN
  -- CASE 1: Task becomes 'completada' (was not completed before)
  IF NEW.estado = 'completada' AND (OLD.estado IS NULL OR OLD.estado != 'completada') THEN
    -- Only create entry if task_type_id is set and no entry exists
    IF NEW.task_type_id IS NOT NULL AND NEW.cost_entry_id IS NULL THEN
      -- Get standard cost from task type
      SELECT costo_estandar, nombre INTO v_costo_estandar, v_task_type_nombre
      FROM public.task_types
      WHERE id = NEW.task_type_id;
      
      IF v_costo_estandar IS NOT NULL THEN
        -- Create cost entry
        INSERT INTO public.project_cost_entries (proyecto_id, fuente, ref_id, descripcion, monto)
        VALUES (
          NEW.proyecto_id,
          'tarea_estandar',
          NEW.id,
          'Costo estándar (' || v_task_type_nombre || '): ' || NEW.titulo,
          v_costo_estandar
        )
        RETURNING id INTO v_entry_id;
        
        -- Update task with cost info
        NEW.costo_aplicado := v_costo_estandar;
        NEW.cost_entry_id := v_entry_id;
      END IF;
    END IF;
  
  -- CASE 2: Task was 'completada' and now changes to another state
  ELSIF OLD.estado = 'completada' AND NEW.estado != 'completada' THEN
    -- If there's a cost entry, delete it
    IF OLD.cost_entry_id IS NOT NULL THEN
      DELETE FROM public.project_cost_entries WHERE id = OLD.cost_entry_id;
      NEW.cost_entry_id := NULL;
      NEW.costo_aplicado := NULL;
    END IF;
  
  -- CASE 3: Task is 'completada' and task_type_id changes
  ELSIF NEW.estado = 'completada' AND OLD.estado = 'completada' 
        AND NEW.task_type_id IS DISTINCT FROM OLD.task_type_id THEN
    
    -- If new task_type_id is null, delete existing entry
    IF NEW.task_type_id IS NULL THEN
      IF OLD.cost_entry_id IS NOT NULL THEN
        DELETE FROM public.project_cost_entries WHERE id = OLD.cost_entry_id;
        NEW.cost_entry_id := NULL;
        NEW.costo_aplicado := NULL;
      END IF;
    ELSE
      -- Get new standard cost
      SELECT costo_estandar, nombre INTO v_costo_estandar, v_task_type_nombre
      FROM public.task_types
      WHERE id = NEW.task_type_id;
      
      IF OLD.cost_entry_id IS NOT NULL THEN
        -- Update existing entry
        UPDATE public.project_cost_entries
        SET monto = v_costo_estandar,
            descripcion = 'Costo estándar (' || v_task_type_nombre || '): ' || NEW.titulo
        WHERE id = OLD.cost_entry_id;
        
        NEW.costo_aplicado := v_costo_estandar;
      ELSE
        -- Create new entry
        INSERT INTO public.project_cost_entries (proyecto_id, fuente, ref_id, descripcion, monto)
        VALUES (
          NEW.proyecto_id,
          'tarea_estandar',
          NEW.id,
          'Costo estándar (' || v_task_type_nombre || '): ' || NEW.titulo,
          v_costo_estandar
        )
        RETURNING id INTO v_entry_id;
        
        NEW.costo_aplicado := v_costo_estandar;
        NEW.cost_entry_id := v_entry_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 6. Create trigger for task costing
-- =====================================================

CREATE TRIGGER trg_handle_task_costing
  BEFORE UPDATE ON public.tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_costing();

-- =====================================================
-- 7. Create function to update project costo_real
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_proyecto_costo_real()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the project's costo_real based on sum of cost entries
  IF TG_OP = 'DELETE' THEN
    UPDATE public.proyectos
    SET costo_real = COALESCE((
      SELECT SUM(monto) FROM public.project_cost_entries WHERE proyecto_id = OLD.proyecto_id
    ), 0),
    updated_at = now()
    WHERE id = OLD.proyecto_id;
    RETURN OLD;
  ELSE
    UPDATE public.proyectos
    SET costo_real = COALESCE((
      SELECT SUM(monto) FROM public.project_cost_entries WHERE proyecto_id = NEW.proyecto_id
    ), 0),
    updated_at = now()
    WHERE id = NEW.proyecto_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to update project cost when entries change
CREATE TRIGGER trg_update_proyecto_costo_real
  AFTER INSERT OR UPDATE OR DELETE ON public.project_cost_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_proyecto_costo_real();