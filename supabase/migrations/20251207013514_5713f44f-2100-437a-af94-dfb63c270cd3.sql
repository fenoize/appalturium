-- Crear tipo enum para estado de proyecto
CREATE TYPE public.estado_proyecto AS ENUM ('planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado');

-- Crear tipo enum para estado de tarea
CREATE TYPE public.estado_tarea AS ENUM ('pendiente', 'en_progreso', 'revision', 'completada', 'cancelada');

-- Crear tipo enum para prioridad de tarea
CREATE TYPE public.prioridad_tarea AS ENUM ('baja', 'media', 'alta', 'urgente');

-- Crear tabla de proyectos
CREATE TABLE public.proyectos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    estado estado_proyecto NOT NULL DEFAULT 'planificacion',
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    presupuesto NUMERIC DEFAULT 0,
    costo_real NUMERIC DEFAULT 0,
    responsable_id UUID,
    prioridad prioridad_tarea DEFAULT 'media',
    progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    etiquetas TEXT[] DEFAULT '{}',
    notas TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de tareas
CREATE TABLE public.tareas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    estado estado_tarea NOT NULL DEFAULT 'pendiente',
    prioridad prioridad_tarea DEFAULT 'media',
    asignado_a UUID,
    fecha_inicio DATE,
    fecha_vencimiento DATE,
    fecha_completada TIMESTAMP WITH TIME ZONE,
    horas_estimadas NUMERIC DEFAULT 0,
    horas_reales NUMERIC DEFAULT 0,
    orden INTEGER DEFAULT 0,
    tarea_padre_id UUID REFERENCES public.tareas(id) ON DELETE CASCADE,
    etiquetas TEXT[] DEFAULT '{}',
    adjuntos JSONB DEFAULT '[]',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de comentarios de tareas
CREATE TABLE public.comentarios_tarea (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id UUID REFERENCES public.tareas(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_tarea ENABLE ROW LEVEL SECURITY;

-- Políticas para proyectos
CREATE POLICY "Admins y supervisors pueden gestionar proyectos"
ON public.proyectos FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Clientes pueden ver sus proyectos"
ON public.proyectos FOR SELECT
USING (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = proyectos.cliente_id 
    AND c.user_id = auth.uid()
));

-- Políticas para tareas
CREATE POLICY "Admins y supervisors pueden gestionar tareas"
ON public.tareas FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Asignados pueden ver y actualizar sus tareas"
ON public.tareas FOR SELECT
USING (asignado_a = auth.uid());

CREATE POLICY "Asignados pueden actualizar sus tareas"
ON public.tareas FOR UPDATE
USING (asignado_a = auth.uid());

-- Políticas para comentarios
CREATE POLICY "Usuarios autenticados pueden ver comentarios"
ON public.comentarios_tarea FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios pueden crear comentarios"
ON public.comentarios_tarea FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus comentarios"
ON public.comentarios_tarea FOR DELETE
USING (usuario_id = auth.uid());

-- Crear índices
CREATE INDEX idx_proyectos_cliente ON public.proyectos(cliente_id);
CREATE INDEX idx_proyectos_estado ON public.proyectos(estado);
CREATE INDEX idx_tareas_proyecto ON public.tareas(proyecto_id);
CREATE INDEX idx_tareas_asignado ON public.tareas(asignado_a);
CREATE INDEX idx_tareas_estado ON public.tareas(estado);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_proyectos_updated_at
BEFORE UPDATE ON public.proyectos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tareas_updated_at
BEFORE UPDATE ON public.tareas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();