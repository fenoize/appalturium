-- Crear enums necesarios
CREATE TYPE public.estado_civil AS ENUM ('soltero', 'casado', 'viudo', 'divorciado', 'union_libre');
CREATE TYPE public.rol_operativo AS ENUM ('tecnico', 'operario', 'despachador', 'supervisor', 'administrador', 'otro');
CREATE TYPE public.sexo AS ENUM ('masculino', 'femenino', 'otro');

-- Tabla personal_fichas
CREATE TABLE public.personal_fichas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  domicilio TEXT,
  estado_civil estado_civil,
  contacto_emergencia JSONB DEFAULT '{"nombre": "", "telefono": "", "relacion": ""}'::jsonb,
  escolaridad TEXT,
  especialidad TEXT[],
  sexo sexo,
  comentarios TEXT,
  etiquetas TEXT[] DEFAULT '{}',
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_termino DATE,
  rol_operativo rol_operativo NOT NULL DEFAULT 'tecnico',
  documentos_urls JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_personal_fichas_user_id ON public.personal_fichas(user_id);
CREATE INDEX idx_personal_fichas_rol_operativo ON public.personal_fichas(rol_operativo);
CREATE INDEX idx_personal_fichas_activo ON public.personal_fichas(activo);
CREATE INDEX idx_personal_fichas_especialidad ON public.personal_fichas USING GIN(especialidad);

-- Habilitar RLS
ALTER TABLE public.personal_fichas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins pueden gestionar todo el personal"
  ON public.personal_fichas
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors pueden gestionar todo el personal"
  ON public.personal_fichas
  FOR ALL
  USING (has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Personal puede ver su propia ficha"
  ON public.personal_fichas
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Personal puede actualizar su propia ficha (campos limitados)"
  ON public.personal_fichas
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger para actualizar updated_at
CREATE TRIGGER update_personal_fichas_updated_at
  BEFORE UPDATE ON public.personal_fichas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();