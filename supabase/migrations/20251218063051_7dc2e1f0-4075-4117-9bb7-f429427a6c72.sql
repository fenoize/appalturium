-- =====================================================
-- 1. Create ENUMS for new tables
-- =====================================================

-- Tipo de trabajo
CREATE TYPE public.tipo_trabajo AS ENUM ('simple', 'complejo', 'mantencion');

-- Estado de trabajo
CREATE TYPE public.estado_trabajo AS ENUM ('pendiente', 'en_ejecucion', 'finalizado', 'cancelado');

-- Estado de fase
CREATE TYPE public.estado_fase AS ENUM ('pendiente', 'en_progreso', 'completada');

-- =====================================================
-- 2. Create TRABAJOS table (Work Orders)
-- =====================================================

CREATE TABLE public.trabajos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  oportunidad_id UUID NULL,
  nombre_trabajo TEXT NOT NULL,
  tipo_trabajo public.tipo_trabajo NOT NULL DEFAULT 'simple',
  descripcion TEXT NULL,
  fecha_inicio_estimada DATE NULL,
  fecha_fin_estimada DATE NULL,
  estado public.estado_trabajo NOT NULL DEFAULT 'pendiente',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trabajos
CREATE POLICY "Admins y supervisors pueden gestionar trabajos" 
  ON public.trabajos 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Clientes pueden ver sus propios trabajos" 
  ON public.trabajos 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = trabajos.cliente_id AND c.user_id = auth.uid()
  ));

-- =====================================================
-- 3. Create PROJECT_TEMPLATES table
-- =====================================================

CREATE TABLE public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NULL,
  descripcion TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_templates
CREATE POLICY "Admins y supervisors pueden gestionar templates" 
  ON public.project_templates 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios autenticados pueden ver templates activos" 
  ON public.project_templates 
  FOR SELECT 
  USING (activo = true AND auth.uid() IS NOT NULL);

-- =====================================================
-- 4. Create TEMPLATE_FASES table
-- =====================================================

CREATE TABLE public.template_fases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  duracion_dias INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_fases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_fases
CREATE POLICY "Admins y supervisors pueden gestionar template_fases" 
  ON public.template_fases 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios autenticados pueden ver template_fases" 
  ON public.template_fases 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. Create TEMPLATE_TAREAS table
-- =====================================================

CREATE TABLE public.template_tareas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_fase_id UUID NOT NULL REFERENCES public.template_fases(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NULL,
  prioridad public.prioridad_tarea NOT NULL DEFAULT 'media',
  duracion_dias INTEGER NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_tareas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_tareas
CREATE POLICY "Admins y supervisors pueden gestionar template_tareas" 
  ON public.template_tareas 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios autenticados pueden ver template_tareas" 
  ON public.template_tareas 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 6. Create FASES_PROYECTO table
-- =====================================================

CREATE TABLE public.fases_proyecto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  fecha_inicio DATE NULL,
  fecha_fin_estimada DATE NULL,
  estado public.estado_fase NOT NULL DEFAULT 'pendiente',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fases_proyecto ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fases_proyecto
CREATE POLICY "Admins y supervisors pueden gestionar fases" 
  ON public.fases_proyecto 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios autenticados pueden ver fases de proyectos" 
  ON public.fases_proyecto 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. Modify PROYECTOS table - add trabajo_id and template_id
-- =====================================================

ALTER TABLE public.proyectos 
  ADD COLUMN trabajo_id UUID NULL REFERENCES public.trabajos(id) ON DELETE SET NULL,
  ADD COLUMN template_id UUID NULL REFERENCES public.project_templates(id) ON DELETE SET NULL;

-- =====================================================
-- 8. Modify TAREAS table - add fase_id
-- =====================================================

ALTER TABLE public.tareas 
  ADD COLUMN fase_id UUID NULL REFERENCES public.fases_proyecto(id) ON DELETE SET NULL;

-- =====================================================
-- 9. Create indexes for better performance
-- =====================================================

CREATE INDEX idx_trabajos_cliente_id ON public.trabajos(cliente_id);
CREATE INDEX idx_trabajos_estado ON public.trabajos(estado);
CREATE INDEX idx_fases_proyecto_proyecto_id ON public.fases_proyecto(proyecto_id);
CREATE INDEX idx_fases_proyecto_orden ON public.fases_proyecto(proyecto_id, orden);
CREATE INDEX idx_tareas_fase_id ON public.tareas(fase_id);
CREATE INDEX idx_proyectos_trabajo_id ON public.proyectos(trabajo_id);
CREATE INDEX idx_template_fases_template_id ON public.template_fases(template_id);
CREATE INDEX idx_template_tareas_fase_id ON public.template_tareas(template_fase_id);

-- =====================================================
-- 10. Create updated_at triggers for new tables
-- =====================================================

CREATE TRIGGER update_trabajos_updated_at
  BEFORE UPDATE ON public.trabajos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fases_proyecto_updated_at
  BEFORE UPDATE ON public.fases_proyecto
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();