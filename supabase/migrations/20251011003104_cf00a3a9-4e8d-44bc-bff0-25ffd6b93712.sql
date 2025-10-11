-- =====================================================
-- FASE 6: SISTEMA DE NOTIFICACIONES
-- =====================================================

-- 1. Tabla: notificaciones_log
-- Registra todas las notificaciones enviadas para auditoría
CREATE TABLE IF NOT EXISTS public.notificaciones_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  canal TEXT NOT NULL,
  destinatario_user_id UUID NOT NULL,
  destinatario_email TEXT,
  asunto TEXT,
  contenido TEXT,
  metadata JSONB,
  enviado_exitosamente BOOLEAN DEFAULT false,
  error_mensaje TEXT,
  intentos INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_ot ON public.notificaciones_log(ot_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_user ON public.notificaciones_log(destinatario_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_tipo ON public.notificaciones_log(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_notif_log_pendientes ON public.notificaciones_log(enviado_exitosamente, intentos) WHERE NOT enviado_exitosamente;

-- RLS para notificaciones_log
ALTER TABLE public.notificaciones_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y supervisors pueden ver todos los logs"
  ON public.notificaciones_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
  ON public.notificaciones_log FOR SELECT
  USING (destinatario_user_id = auth.uid());

-- 2. Tabla: user_notification_prefs
-- Preferencias de notificación por usuario
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_ot_creada BOOLEAN DEFAULT true,
  email_asignacion BOOLEAN DEFAULT true,
  email_cambio_estado BOOLEAN DEFAULT true,
  email_recordatorio BOOLEAN DEFAULT true,
  push_asignacion BOOLEAN DEFAULT true,
  push_cambio_estado BOOLEAN DEFAULT true,
  push_recordatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_user_notification_prefs_updated_at
  BEFORE UPDATE ON public.user_notification_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para user_notification_prefs
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias preferencias"
  ON public.user_notification_prefs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propias preferencias"
  ON public.user_notification_prefs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden insertar sus propias preferencias"
  ON public.user_notification_prefs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins pueden ver todas las preferencias"
  ON public.user_notification_prefs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Tipo enum y tabla: plantillas_email
DO $$ BEGIN
  CREATE TYPE tipo_plantilla_email AS ENUM (
    'ot_creada',
    'asignacion_personal',
    'cambio_estado',
    'recordatorio_mantencion'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.plantillas_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_plantilla_email NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  contenido_html TEXT NOT NULL,
  variables_disponibles TEXT[],
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_plantillas_email_updated_at
  BEFORE UPDATE ON public.plantillas_email
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para plantillas_email
ALTER TABLE public.plantillas_email ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar plantillas"
  ON public.plantillas_email FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios pueden ver plantillas activas"
  ON public.plantillas_email FOR SELECT
  USING (activa = true);

-- Insertar plantillas por defecto
INSERT INTO public.plantillas_email (tipo, nombre, asunto, contenido_html, variables_disponibles) VALUES
(
  'ot_creada',
  'Orden de Servicio Creada',
  'Nueva Orden de Servicio: {{ot_numero}}',
  '<h1>Nueva Orden de Servicio</h1><p>Estimado/a cliente,</p><p>Se ha creado la orden de servicio <strong>{{ot_numero}}</strong>.</p><p><strong>Tipo de trabajo:</strong> {{tipo_trabajo}}</p><p><strong>Descripción:</strong> {{descripcion}}</p><p><strong>Fecha programada:</strong> {{fecha_programada}}</p><p><strong>Ubicación:</strong> {{ubicacion}}</p><p>Gracias por confiar en nuestros servicios.</p>',
  ARRAY['ot_numero', 'cliente_nombre', 'tipo_trabajo', 'descripcion', 'fecha_programada', 'ubicacion']
),
(
  'asignacion_personal',
  'Asignación a Orden de Servicio',
  'Has sido asignado a OT: {{ot_numero}}',
  '<h1>Nueva Asignación</h1><p>Has sido asignado a la orden de servicio <strong>{{ot_numero}}</strong>.</p><p><strong>Cliente:</strong> {{cliente_nombre}}</p><p><strong>Ubicación:</strong> {{ubicacion}}</p><p><strong>Horario:</strong> {{horario_inicio}} - {{horario_fin}}</p><p><strong>Rol:</strong> {{rol_en_ot}}</p><p>Por favor revisa los detalles en la aplicación.</p>',
  ARRAY['ot_numero', 'cliente_nombre', 'ubicacion', 'horario_inicio', 'horario_fin', 'rol_en_ot']
),
(
  'cambio_estado',
  'Cambio de Estado de OT',
  'OT {{ot_numero}} - Cambio de estado',
  '<h1>Cambio de Estado</h1><p>La orden de servicio <strong>{{ot_numero}}</strong> ha cambiado de estado.</p><p><strong>Estado anterior:</strong> {{estado_anterior}}</p><p><strong>Estado nuevo:</strong> {{estado_nuevo}}</p><p><strong>Fecha:</strong> {{fecha_cambio}}</p>',
  ARRAY['ot_numero', 'estado_anterior', 'estado_nuevo', 'fecha_cambio', 'cliente_nombre']
),
(
  'recordatorio_mantencion',
  'Recordatorio de Mantenimiento',
  'Recordatorio: Mantenimiento programado {{fecha_programada}}',
  '<h1>Recordatorio de Mantenimiento</h1><p>Se acerca el mantenimiento programado para la OT <strong>{{ot_numero}}</strong>.</p><p><strong>Cliente:</strong> {{cliente_nombre}}</p><p><strong>Fecha programada:</strong> {{fecha_programada}}</p><p><strong>Ubicación:</strong> {{ubicacion}}</p>',
  ARRAY['ot_numero', 'cliente_nombre', 'fecha_programada', 'ubicacion']
)
ON CONFLICT (tipo) DO NOTHING;

-- 4. Tabla: push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden gestionar sus propias subscripciones"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins pueden ver todas las subscripciones"
  ON public.push_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Trigger: Notificar al crear OT
CREATE OR REPLACE FUNCTION public.notificar_ot_creada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notificaciones_log (
    ot_id,
    tipo_evento,
    canal,
    destinatario_user_id,
    metadata,
    enviado_exitosamente
  )
  SELECT 
    NEW.id,
    'ot_creada',
    'email',
    c.user_id,
    jsonb_build_object(
      'ot_numero', NEW.numero,
      'cliente_id', NEW.cliente_id,
      'tipo_trabajo', NEW.tipo_trabajo,
      'descripcion', NEW.descripcion
    ),
    false
  FROM public.clientes c
  WHERE c.id = NEW.cliente_id AND c.user_id IS NOT NULL;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificar_ot_creada ON public.ordenes_servicio;
CREATE TRIGGER trigger_notificar_ot_creada
  AFTER INSERT ON public.ordenes_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_ot_creada();

-- 6. Trigger: Notificar asignación de personal
CREATE OR REPLACE FUNCTION public.notificar_asignacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notificación por email
  INSERT INTO public.notificaciones_log (
    ot_id,
    tipo_evento,
    canal,
    destinatario_user_id,
    metadata,
    enviado_exitosamente
  ) VALUES (
    NEW.ot_id,
    'asignacion',
    'email',
    NEW.personal_id,
    jsonb_build_object(
      'horario_inicio', NEW.horario_inicio,
      'horario_fin', NEW.horario_fin,
      'rol_en_ot', NEW.rol_en_ot
    ),
    false
  );
  
  -- Notificación push
  INSERT INTO public.notificaciones_log (
    ot_id,
    tipo_evento,
    canal,
    destinatario_user_id,
    metadata,
    enviado_exitosamente
  ) VALUES (
    NEW.ot_id,
    'asignacion',
    'push',
    NEW.personal_id,
    jsonb_build_object(
      'horario_inicio', NEW.horario_inicio,
      'horario_fin', NEW.horario_fin,
      'rol_en_ot', NEW.rol_en_ot
    ),
    false
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificar_asignacion ON public.asignaciones_ot;
CREATE TRIGGER trigger_notificar_asignacion
  AFTER INSERT ON public.asignaciones_ot
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_asignacion();

-- 7. Actualizar trigger de cambio de estado para incluir notificaciones
CREATE OR REPLACE FUNCTION public.registrar_cambio_estado_ot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    -- Log de cambio de estado
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
    
    -- Notificar al cliente por email
    INSERT INTO public.notificaciones_log (
      ot_id,
      tipo_evento,
      canal,
      destinatario_user_id,
      metadata,
      enviado_exitosamente
    )
    SELECT 
      NEW.id,
      'cambio_estado',
      'email',
      c.user_id,
      jsonb_build_object(
        'ot_numero', NEW.numero,
        'estado_anterior', OLD.estado,
        'estado_nuevo', NEW.estado
      ),
      false
    FROM public.clientes c
    WHERE c.id = NEW.cliente_id AND c.user_id IS NOT NULL;
    
    -- Notificar al personal asignado por push
    INSERT INTO public.notificaciones_log (
      ot_id,
      tipo_evento,
      canal,
      destinatario_user_id,
      metadata,
      enviado_exitosamente
    )
    SELECT 
      NEW.id,
      'cambio_estado',
      'push',
      a.personal_id,
      jsonb_build_object(
        'ot_numero', NEW.numero,
        'estado_anterior', OLD.estado,
        'estado_nuevo', NEW.estado
      ),
      false
    FROM public.asignaciones_ot a
    WHERE a.ot_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;