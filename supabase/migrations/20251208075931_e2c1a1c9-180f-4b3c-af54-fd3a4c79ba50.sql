-- Add unique constraint on personal_fichas.user_id (required for FK)
ALTER TABLE public.personal_fichas
ADD CONSTRAINT personal_fichas_user_id_unique UNIQUE (user_id);

-- Add foreign key from proyectos.responsable_id to personal_fichas.user_id
ALTER TABLE public.proyectos
ADD CONSTRAINT proyectos_responsable_id_fkey 
FOREIGN KEY (responsable_id) REFERENCES public.personal_fichas(user_id) ON DELETE SET NULL;

-- Add foreign key from tareas.asignado_a to personal_fichas.user_id
ALTER TABLE public.tareas
ADD CONSTRAINT tareas_asignado_a_fkey 
FOREIGN KEY (asignado_a) REFERENCES public.personal_fichas(user_id) ON DELETE SET NULL;