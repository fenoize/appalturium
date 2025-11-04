-- ============================================
-- FASE 7: REPORTES Y TIEMPOS ESTÁNDAR
-- ============================================

-- 1. Insertar tiempos estándar en parametros_sistema
INSERT INTO public.parametros_sistema (categoria, key, label, descripcion, color, orden, activo) VALUES
('standard_times', 'instalacion_clima', 'Instalación Climatización', '{"minutos": 240, "tolerancia": 15}', '#10b981', 1, true),
('standard_times', 'mantencion_clima', 'Mantenimiento Climatización', '{"minutos": 90, "tolerancia": 20}', '#3b82f6', 2, true),
('standard_times', 'reparacion_clima', 'Reparación Climatización', '{"minutos": 180, "tolerancia": 25}', '#f59e0b', 3, true),
('standard_times', 'instalacion_fv', 'Instalación Fotovoltaica', '{"minutos": 480, "tolerancia": 15}', '#8b5cf6', 4, true),
('standard_times', 'mantencion_fv', 'Mantenimiento Fotovoltaico', '{"minutos": 120, "tolerancia": 20}', '#06b6d4', 5, true),
('standard_times', 'inspeccion', 'Inspección General', '{"minutos": 60, "tolerancia": 30}', '#ec4899', 6, true);

-- 2. Crear tabla tiempos_reales
CREATE TABLE public.tiempos_reales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  asignacion_id UUID REFERENCES public.asignaciones_ot(id) ON DELETE CASCADE,
  
  -- Timestamps de estado
  en_ruta_inicio TIMESTAMPTZ,
  en_ruta_fin TIMESTAMPTZ,
  en_proceso_inicio TIMESTAMPTZ,
  en_proceso_fin TIMESTAMPTZ,
  
  -- Tiempos calculados (en minutos)
  tiempo_respuesta_min INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN en_ruta_inicio IS NOT NULL AND fecha_creacion IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (en_ruta_inicio - fecha_creacion))/60
      ELSE NULL 
    END
  ) STORED,
  
  tiempo_servicio_min INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN en_proceso_inicio IS NOT NULL AND en_proceso_fin IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (en_proceso_fin - en_proceso_inicio))/60
      ELSE NULL 
    END
  ) STORED,
  
  -- Metadata
  fecha_creacion TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tiempos_reales_ot ON tiempos_reales(ot_id);
CREATE INDEX idx_tiempos_reales_asignacion ON tiempos_reales(asignacion_id);

-- Trigger para updated_at
CREATE TRIGGER update_tiempos_reales_updated_at
  BEFORE UPDATE ON public.tiempos_reales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.tiempos_reales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y supervisors pueden ver todos los tiempos"
  ON public.tiempos_reales FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admins y supervisors pueden gestionar tiempos"
  ON public.tiempos_reales FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Personal puede ver tiempos de sus OT"
  ON public.tiempos_reales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.id = tiempos_reales.asignacion_id
      AND asignaciones_ot.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal puede insertar tiempos de sus OT"
  ON public.tiempos_reales FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.id = tiempos_reales.asignacion_id
      AND asignaciones_ot.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal puede actualizar tiempos de sus OT"
  ON public.tiempos_reales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.asignaciones_ot
      WHERE asignaciones_ot.id = tiempos_reales.asignacion_id
      AND asignaciones_ot.personal_id = auth.uid()
    )
  );

-- 3. Función para calcular semáforo de cumplimiento
CREATE OR REPLACE FUNCTION calcular_semaforo_tiempo(
  tipo_trabajo TEXT,
  tiempo_servicio_min INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  std_config JSONB;
  std_minutos INTEGER;
  std_tolerancia NUMERIC;
  limite_amarillo INTEGER;
BEGIN
  -- Buscar tiempo estándar
  SELECT descripcion INTO std_config
  FROM parametros_sistema
  WHERE categoria = 'standard_times'
    AND key = tipo_trabajo
    AND activo = true;
  
  IF std_config IS NULL THEN
    RETURN 'sin_estandar';
  END IF;
  
  std_minutos := (std_config->>'minutos')::INTEGER;
  std_tolerancia := (std_config->>'tolerancia')::NUMERIC;
  limite_amarillo := std_minutos + (std_minutos * std_tolerancia / 100);
  
  IF tiempo_servicio_min <= std_minutos THEN
    RETURN 'verde';
  ELSIF tiempo_servicio_min <= limite_amarillo THEN
    RETURN 'amarillo';
  ELSE
    RETURN 'rojo';
  END IF;
END;
$$;

-- 4. Vista materializada para reportes KPI
CREATE MATERIALIZED VIEW public.kpis_reportes AS
SELECT 
  os.id as ot_id,
  os.numero as ot_numero,
  os.tipo_trabajo,
  os.estado,
  os.created_at as fecha_creacion,
  os.fecha_programada_inicio,
  
  -- Cliente
  c.razon_social as cliente_razon_social,
  c.nombres || ' ' || c.apellidos as cliente_nombre,
  
  -- Ubicación
  u.comuna,
  u.ciudad,
  u.region,
  
  -- Técnico asignado
  a.personal_id,
  a.rol_en_ot,
  
  -- Tiempos
  tr.tiempo_respuesta_min,
  tr.tiempo_servicio_min,
  tr.en_ruta_inicio,
  tr.en_proceso_inicio,
  tr.en_proceso_fin,
  
  -- Semáforo
  calcular_semaforo_tiempo(os.tipo_trabajo, tr.tiempo_servicio_min) as semaforo,
  
  -- Facturación
  COALESCE(
    (SELECT SUM(total) FROM documentos_venta WHERE ot_id = os.id),
    0
  ) as facturado,
  
  COALESCE(os.costos_real, os.costos_estimado, 0) as costos,
  
  COALESCE(
    (SELECT SUM(total) FROM documentos_venta WHERE ot_id = os.id),
    0
  ) - COALESCE(os.costos_real, os.costos_estimado, 0) as margen

FROM ordenes_servicio os
LEFT JOIN clientes c ON c.id = os.cliente_id
LEFT JOIN ubicaciones u ON u.id = os.ubicacion_id
LEFT JOIN asignaciones_ot a ON a.ot_id = os.id
LEFT JOIN tiempos_reales tr ON tr.ot_id = os.id AND tr.asignacion_id = a.id
WHERE os.estado NOT IN ('draft', 'cancelled');

CREATE UNIQUE INDEX idx_kpis_reportes_ot_personal ON kpis_reportes(ot_id, personal_id);
CREATE INDEX idx_kpis_reportes_fecha ON kpis_reportes(fecha_creacion);
CREATE INDEX idx_kpis_reportes_semaforo ON kpis_reportes(semaforo);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_kpis_reportes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpis_reportes;
END;
$$;

-- 5. Trigger para actualizar tiempos_reales desde personal_ubicacion
CREATE OR REPLACE FUNCTION actualizar_tiempos_desde_ubicacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asignacion_activa UUID;
  ot_activa UUID;
  fecha_ot TIMESTAMPTZ;
BEGIN
  -- Encontrar asignación activa del personal
  SELECT a.id, a.ot_id, os.created_at INTO asignacion_activa, ot_activa, fecha_ot
  FROM asignaciones_ot a
  JOIN ordenes_servicio os ON os.id = a.ot_id
  WHERE a.personal_id = NEW.personal_id
    AND os.estado IN ('assigned', 'in_progress')
  ORDER BY a.created_at DESC
  LIMIT 1;
  
  IF asignacion_activa IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Insertar o actualizar tiempos_reales
  IF NEW.estado_app = 'en_ruta' THEN
    INSERT INTO tiempos_reales (ot_id, asignacion_id, en_ruta_inicio, fecha_creacion)
    VALUES (ot_activa, asignacion_activa, NEW.captured_at, fecha_ot)
    ON CONFLICT (ot_id, asignacion_id) 
    DO UPDATE SET 
      en_ruta_inicio = COALESCE(tiempos_reales.en_ruta_inicio, NEW.captured_at);
      
  ELSIF NEW.estado_app = 'en_proceso' THEN
    INSERT INTO tiempos_reales (ot_id, asignacion_id, en_ruta_fin, en_proceso_inicio, fecha_creacion)
    VALUES (ot_activa, asignacion_activa, NEW.captured_at, NEW.captured_at, fecha_ot)
    ON CONFLICT (ot_id, asignacion_id)
    DO UPDATE SET 
      en_ruta_fin = NEW.captured_at,
      en_proceso_inicio = NEW.captured_at;
      
  ELSIF NEW.estado_app = 'online' AND OLD.estado_app = 'en_proceso' THEN
    UPDATE tiempos_reales
    SET en_proceso_fin = NEW.captured_at
    WHERE asignacion_id = asignacion_activa;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_tiempos
  AFTER INSERT ON public.personal_ubicacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_tiempos_desde_ubicacion();

-- Agregar constraint único para tiempos_reales
ALTER TABLE tiempos_reales ADD CONSTRAINT unique_ot_asignacion UNIQUE(ot_id, asignacion_id);