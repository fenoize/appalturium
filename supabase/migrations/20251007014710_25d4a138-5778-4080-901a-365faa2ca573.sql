-- =====================================================
-- FASE 2: ÓRDENES DE SERVICIO (OT) + INFORME FINAL
-- =====================================================

-- 1. TABLA DE PARÁMETROS DEL SISTEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.parametros_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  descripcion TEXT,
  color TEXT,
  icono TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  editable_por_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(categoria, key)
);

-- 2. ENUMS
-- =====================================================
CREATE TYPE public.prioridad_ot AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE public.rol_en_ot AS ENUM ('tecnico', 'operario', 'despachador', 'otro');

-- 3. SECUENCIA PARA NÚMERO DE OT
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS public.ot_numero_seq START 1;

-- 4. TABLA ORDENES_SERVICIO
-- =====================================================
CREATE TABLE public.ordenes_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT NOT NULL,
  ubicacion_id UUID REFERENCES public.ubicaciones(id) ON DELETE RESTRICT NOT NULL,
  tipo_trabajo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad public.prioridad_ot DEFAULT 'media',
  adjuntos JSONB DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'draft',
  fecha_programada_inicio TIMESTAMPTZ,
  fecha_programada_fin TIMESTAMPTZ,
  costos_estimado DECIMAL(12,2),
  costos_real DECIMAL(12,2),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fecha_valida CHECK (
    fecha_programada_fin IS NULL OR 
    fecha_programada_inicio IS NULL OR 
    fecha_programada_fin >= fecha_programada_inicio
  ),
  CONSTRAINT costos_no_negativos CHECK (
    (costos_estimado IS NULL OR costos_estimado >= 0) AND
    (costos_real IS NULL OR costos_real >= 0)
  )
);

-- 5. TABLA ASIGNACIONES_OT
-- =====================================================
CREATE TABLE public.asignaciones_ot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE NOT NULL,
  personal_id UUID NOT NULL,
  rol_en_ot public.rol_en_ot DEFAULT 'tecnico',
  horario_inicio TIMESTAMPTZ,
  horario_fin TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ot_id, personal_id)
);

-- 6. TABLA INFORMES_FINALES
-- =====================================================
CREATE TABLE public.informes_finales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE RESTRICT NOT NULL UNIQUE,
  resumen_tecnico TEXT NOT NULL,
  tareas_ejecutadas JSONB DEFAULT '[]'::jsonb,
  materiales JSONB DEFAULT '[]'::jsonb,
  evidencias_urls JSONB DEFAULT '[]'::jsonb,
  lecturas_mediciones JSONB DEFAULT '[]'::jsonb,
  recomendaciones TEXT,
  observaciones_cliente TEXT,
  firma_cliente TEXT,
  geocierre_lat DECIMAL(10,8),
  geocierre_lng DECIMAL(11,8),
  geocierre_timestamp TIMESTAMPTZ,
  responsable_personal_id UUID NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABLA OT_ESTADO_LOGS (Auditoría)
-- =====================================================
CREATE TABLE public.ot_estado_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  cambio_realizado_por UUID NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================
ALTER TABLE public.parametros_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_ot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_finales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_estado_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- RLS Policies para parametros_sistema
CREATE POLICY "Todos pueden ver parámetros activos"
ON public.parametros_sistema
FOR SELECT
USING (activo = true);

CREATE POLICY "Admins pueden gestionar parámetros"
ON public.parametros_sistema
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para ordenes_servicio
CREATE POLICY "Admins y supervisors pueden ver todas las OT"
ON public.ordenes_servicio
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Admins y supervisors pueden crear OT"
ON public.ordenes_servicio
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Admins y supervisors pueden actualizar OT"
ON public.ordenes_servicio
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Admins pueden eliminar OT"
ON public.ordenes_servicio
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Personal asignado puede ver sus OT"
ON public.ordenes_servicio
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE ot_id = ordenes_servicio.id 
    AND personal_id = auth.uid()
  )
);

CREATE POLICY "Clientes pueden ver sus propias OT"
ON public.ordenes_servicio
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE id = ordenes_servicio.cliente_id 
    AND user_id = auth.uid()
  )
);

-- RLS Policies para asignaciones_ot
CREATE POLICY "Admins y supervisors pueden gestionar asignaciones"
ON public.asignaciones_ot
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Personal puede ver sus propias asignaciones"
ON public.asignaciones_ot
FOR SELECT
USING (personal_id = auth.uid());

-- RLS Policies para informes_finales
CREATE POLICY "Admins y supervisors pueden gestionar informes"
ON public.informes_finales
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Personal asignado puede ver informes de sus OT"
ON public.informes_finales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE ot_id = informes_finales.ot_id 
    AND personal_id = auth.uid()
  )
);

CREATE POLICY "Personal asignado puede insertar informes de sus OT"
ON public.informes_finales
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE ot_id = informes_finales.ot_id 
    AND personal_id = auth.uid()
  )
);

CREATE POLICY "Clientes pueden ver informes de sus OT"
ON public.informes_finales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes_servicio os
    JOIN public.clientes c ON c.id = os.cliente_id
    WHERE os.id = informes_finales.ot_id 
    AND c.user_id = auth.uid()
  )
);

-- RLS Policies para ot_estado_logs
CREATE POLICY "Admins y supervisors pueden ver logs"
ON public.ot_estado_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Personal asignado puede ver logs de sus OT"
ON public.ot_estado_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones_ot
    WHERE ot_id = ot_estado_logs.ot_id 
    AND personal_id = auth.uid()
  )
);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para generar número de OT secuencial
CREATE OR REPLACE FUNCTION public.generar_numero_ot()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anio TEXT;
  secuencia TEXT;
BEGIN
  anio := EXTRACT(YEAR FROM now())::TEXT;
  secuencia := LPAD(nextval('ot_numero_seq')::TEXT, 6, '0');
  RETURN anio || '-' || secuencia;
END;
$$;

-- Trigger para auto-generar número de OT
CREATE OR REPLACE FUNCTION public.auto_generar_numero_ot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := public.generar_numero_ot();
  END IF;
  RETURN NEW;
END;
$$;

-- Función para registrar cambios de estado
CREATE OR REPLACE FUNCTION public.registrar_cambio_estado_ot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.ot_estado_logs (
      ot_id, 
      estado_anterior, 
      estado_nuevo, 
      cambio_realizado_por
    )
    VALUES (
      NEW.id, 
      OLD.estado, 
      NEW.estado, 
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Función para validar estado completado
CREATE OR REPLACE FUNCTION public.validar_estado_completado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si se intenta cambiar a 'completed', verificar que exista informe
  IF NEW.estado = 'completed' AND OLD.estado != 'completed' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.informes_finales 
      WHERE ot_id = NEW.id 
      AND firma_cliente IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'No se puede marcar como completado sin informe final y firma del cliente';
    END IF;
  END IF;
  
  -- Si se intenta cambiar a 'closed', verificar que esté en 'completed'
  IF NEW.estado = 'closed' AND OLD.estado != 'closed' THEN
    IF OLD.estado != 'completed' THEN
      RAISE EXCEPTION 'Solo se puede cerrar una OT que esté en estado completado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at en parametros_sistema
CREATE TRIGGER update_parametros_sistema_updated_at
BEFORE UPDATE ON public.parametros_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en ordenes_servicio
CREATE TRIGGER update_ordenes_servicio_updated_at
BEFORE UPDATE ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para auto-generar número de OT
CREATE TRIGGER trigger_auto_generar_numero_ot
BEFORE INSERT ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.auto_generar_numero_ot();

-- Trigger para registrar cambios de estado
CREATE TRIGGER trigger_cambio_estado_ot
AFTER UPDATE ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.registrar_cambio_estado_ot();

-- Trigger para validar estado completado
CREATE TRIGGER trigger_validar_estado_completado
BEFORE UPDATE ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.validar_estado_completado();

-- Trigger para updated_at en informes_finales
CREATE TRIGGER update_informes_finales_updated_at
BEFORE UPDATE ON public.informes_finales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

CREATE INDEX idx_ordenes_servicio_cliente_id ON public.ordenes_servicio(cliente_id);
CREATE INDEX idx_ordenes_servicio_ubicacion_id ON public.ordenes_servicio(ubicacion_id);
CREATE INDEX idx_ordenes_servicio_estado ON public.ordenes_servicio(estado);
CREATE INDEX idx_ordenes_servicio_fecha_programada ON public.ordenes_servicio(fecha_programada_inicio);
CREATE INDEX idx_asignaciones_ot_personal_id ON public.asignaciones_ot(personal_id);
CREATE INDEX idx_asignaciones_ot_ot_id ON public.asignaciones_ot(ot_id);
CREATE INDEX idx_informes_finales_ot_id ON public.informes_finales(ot_id);
CREATE INDEX idx_ot_estado_logs_ot_id ON public.ot_estado_logs(ot_id);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

INSERT INTO public.parametros_sistema (categoria, key, label, descripcion, color, icono, orden) VALUES
-- Estados de servicio
('service_statuses', 'draft', 'Borrador', 'OT en borrador, no programada', 'hsl(var(--muted))', 'FileEdit', 1),
('service_statuses', 'scheduled', 'Programado', 'OT programada, esperando inicio', 'hsl(var(--primary))', 'Calendar', 2),
('service_statuses', 'in_progress', 'En Progreso', 'Servicio en ejecución', 'hsl(var(--warning))', 'Clock', 3),
('service_statuses', 'completed', 'Completado', 'Servicio completado con informe', 'hsl(var(--success))', 'CheckCircle', 4),
('service_statuses', 'closed', 'Cerrado/Facturado', 'OT cerrada y facturada', 'hsl(var(--accent))', 'Lock', 5),

-- Tipos de trabajo
('work_types', 'mantenimiento', 'Mantenimiento', 'Mantenimiento preventivo o correctivo', 'hsl(var(--primary))', 'Wrench', 1),
('work_types', 'reparacion', 'Reparación', 'Reparación de equipos o sistemas', 'hsl(var(--warning))', 'Tool', 2),
('work_types', 'instalacion', 'Instalación', 'Instalación de nuevos equipos', 'hsl(var(--success))', 'Package', 3),
('work_types', 'inspeccion', 'Inspección', 'Inspección técnica', 'hsl(var(--accent))', 'Search', 4),
('work_types', 'emergencia', 'Emergencia', 'Atención de emergencia', 'hsl(var(--destructive))', 'AlertTriangle', 5),
('work_types', 'otro', 'Otro', 'Otro tipo de servicio', 'hsl(var(--muted))', 'MoreHorizontal', 6);