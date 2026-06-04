
-- 1) Extensiones para jobs programados
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Columna origen en trabajos
ALTER TABLE public.trabajos
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'interno';

-- 3) Tabla planes_mantenimiento
CREATE TABLE IF NOT EXISTS public.planes_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  frecuencia TEXT NOT NULL CHECK (frecuencia IN ('mensual','bimestral','trimestral','semestral','anual')),
  proxima_fecha DATE NOT NULL,
  ultimo_ot_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (equipo_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planes_mantenimiento TO authenticated;
GRANT ALL ON public.planes_mantenimiento TO service_role;

ALTER TABLE public.planes_mantenimiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden ver planes de mantenimiento"
  ON public.planes_mantenimiento FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Autenticados pueden crear planes de mantenimiento"
  ON public.planes_mantenimiento FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden actualizar planes de mantenimiento"
  ON public.planes_mantenimiento FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Autenticados pueden eliminar planes de mantenimiento"
  ON public.planes_mantenimiento FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER trg_planes_mantenimiento_updated_at
  BEFORE UPDATE ON public.planes_mantenimiento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Fix get_dashboard_metrics: inventario_anterior real
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_now timestamptz := now();
  v_inicio_mes timestamptz := date_trunc('month', v_now);
  v_fin_mes timestamptz := (date_trunc('month', v_now) + interval '1 month');
  v_inicio_mes_ant timestamptz := date_trunc('month', v_now - interval '1 month');

  v_clientes_activos int;
  v_clientes_anterior int;
  v_proyectos_en_curso int;
  v_proyectos_anterior int;
  v_inventario_total numeric;
  v_inventario_delta numeric;
  v_inventario_anterior numeric;
  v_ingresos_mes numeric;
  v_ingresos_anterior numeric;
  v_empleados int;
  v_mantenciones_mes int;
  v_mantenciones_anterior int;
  v_tareas_pendientes int;
  v_ot_total_mes int;
  v_ot_completadas_mes int;
  v_ot_total_ant int;
  v_ot_completadas_ant int;
  v_eficiencia int;
  v_eficiencia_anterior int;
BEGIN
  SELECT count(*) INTO v_clientes_activos FROM clientes WHERE estado_cliente = 'activo';
  SELECT count(*) INTO v_clientes_anterior FROM clientes WHERE estado_cliente = 'activo' AND created_at < v_inicio_mes;

  SELECT count(*) INTO v_proyectos_en_curso FROM proyectos WHERE estado::text IN ('planificacion','en_progreso','pausado');
  SELECT count(*) INTO v_proyectos_anterior FROM proyectos
    WHERE estado::text IN ('planificacion','en_progreso','pausado') AND created_at < v_inicio_mes;

  SELECT COALESCE(SUM(COALESCE(stock_actual,0) * COALESCE(precio_venta,0)), 0)
    INTO v_inventario_total FROM inventario WHERE activo = true;

  -- Delta del mes actual: entradas valorizadas a precio_venta menos salidas
  SELECT COALESCE(SUM(
    CASE WHEN m.tipo = 'entrada' THEN  m.cantidad * COALESCE(i.precio_venta, 0)
         WHEN m.tipo = 'salida'  THEN -m.cantidad * COALESCE(i.precio_venta, 0)
         ELSE 0 END
  ), 0) INTO v_inventario_delta
  FROM movimientos_inventario m
  JOIN inventario i ON i.id = m.item_id
  WHERE m.created_at >= v_inicio_mes AND m.created_at < v_fin_mes;

  v_inventario_anterior := v_inventario_total - v_inventario_delta;

  SELECT COALESCE(SUM(total),0) INTO v_ingresos_mes
    FROM documentos_venta WHERE fecha >= v_inicio_mes::date AND fecha < v_fin_mes::date;
  SELECT COALESCE(SUM(total),0) INTO v_ingresos_anterior
    FROM documentos_venta WHERE fecha >= v_inicio_mes_ant::date AND fecha < v_inicio_mes::date;

  SELECT count(*) INTO v_empleados FROM personal_fichas WHERE activo = true;

  SELECT count(*) INTO v_mantenciones_mes
    FROM ordenes_servicio WHERE tipo_trabajo ILIKE '%manten%' AND created_at >= v_inicio_mes;
  SELECT count(*) INTO v_mantenciones_anterior
    FROM ordenes_servicio
    WHERE tipo_trabajo ILIKE '%manten%' AND created_at >= v_inicio_mes_ant AND created_at < v_inicio_mes;

  SELECT count(*) INTO v_tareas_pendientes FROM tareas WHERE estado::text <> 'completada';

  SELECT count(*) INTO v_ot_total_mes FROM ordenes_servicio WHERE created_at >= v_inicio_mes;
  SELECT count(*) INTO v_ot_completadas_mes FROM ordenes_servicio
    WHERE estado IN ('completed','closed') AND created_at >= v_inicio_mes;
  SELECT count(*) INTO v_ot_total_ant FROM ordenes_servicio
    WHERE created_at >= v_inicio_mes_ant AND created_at < v_inicio_mes;
  SELECT count(*) INTO v_ot_completadas_ant FROM ordenes_servicio
    WHERE estado IN ('completed','closed') AND created_at >= v_inicio_mes_ant AND created_at < v_inicio_mes;

  v_eficiencia := CASE WHEN v_ot_total_mes > 0
    THEN round(v_ot_completadas_mes::numeric / v_ot_total_mes * 100) ELSE 0 END;
  v_eficiencia_anterior := CASE WHEN v_ot_total_ant > 0
    THEN round(v_ot_completadas_ant::numeric / v_ot_total_ant * 100) ELSE 0 END;

  RETURN jsonb_build_object(
    'clientes_activos', v_clientes_activos,
    'clientes_anterior', v_clientes_anterior,
    'proyectos_en_curso', v_proyectos_en_curso,
    'proyectos_anterior', v_proyectos_anterior,
    'inventario_total', v_inventario_total,
    'inventario_anterior', v_inventario_anterior,
    'ingresos_mes', v_ingresos_mes,
    'ingresos_anterior', v_ingresos_anterior,
    'empleados', v_empleados,
    'mantenciones_mes', v_mantenciones_mes,
    'mantenciones_anterior', v_mantenciones_anterior,
    'tareas_pendientes', v_tareas_pendientes,
    'eficiencia', v_eficiencia,
    'eficiencia_anterior', v_eficiencia_anterior
  );
END;
$function$;
