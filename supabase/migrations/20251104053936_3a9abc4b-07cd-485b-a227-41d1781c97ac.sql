-- Fase 8: Centro de Comunicaciones

-- Crear enums para comunicaciones
CREATE TYPE canal_comunicacion AS ENUM ('email', 'telefono', 'whatsapp', 'nota');
CREATE TYPE estatus_comunicacion AS ENUM ('pendiente', 'resuelto');

-- Crear tabla comunicaciones
CREATE TABLE public.comunicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  canal canal_comunicacion NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  emisor_user_id UUID REFERENCES auth.users(id),
  destinatario TEXT NOT NULL,
  resumen TEXT NOT NULL,
  adjuntos JSONB DEFAULT '[]'::jsonb,
  requiere_respuesta BOOLEAN DEFAULT false,
  estatus estatus_comunicacion NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX idx_comunicaciones_ot_id ON public.comunicaciones(ot_id);
CREATE INDEX idx_comunicaciones_fecha ON public.comunicaciones(fecha DESC);
CREATE INDEX idx_comunicaciones_canal ON public.comunicaciones(canal);
CREATE INDEX idx_comunicaciones_estatus ON public.comunicaciones(estatus);

-- Habilitar RLS
ALTER TABLE public.comunicaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins y supervisors pueden gestionar todas las comunicaciones"
ON public.comunicaciones
FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "Personal asignado puede ver comunicaciones de sus OT"
ON public.comunicaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = comunicaciones.ot_id
    AND asignaciones_ot.personal_id = auth.uid()
  )
);

CREATE POLICY "Personal asignado puede crear comunicaciones de sus OT"
ON public.comunicaciones
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = comunicaciones.ot_id
    AND asignaciones_ot.personal_id = auth.uid()
  )
);

CREATE POLICY "Personal asignado puede actualizar comunicaciones de sus OT"
ON public.comunicaciones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE asignaciones_ot.ot_id = comunicaciones.ot_id
    AND asignaciones_ot.personal_id = auth.uid()
  )
);

CREATE POLICY "Clientes pueden ver comunicaciones de sus OT"
ON public.comunicaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes_servicio os
    JOIN public.clientes c ON c.id = os.cliente_id
    WHERE os.id = comunicaciones.ot_id
    AND c.user_id = auth.uid()
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_comunicaciones_updated_at
BEFORE UPDATE ON public.comunicaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();