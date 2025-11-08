-- Eliminar la vista materializada temporalmente
DROP MATERIALIZED VIEW IF EXISTS public.kpis_reportes;

-- Crear enum para tipo de moneda
CREATE TYPE tipo_moneda AS ENUM ('CLP', 'UF', 'USD');

-- Aumentar la precisión de los campos numéricos en presupuestos
ALTER TABLE public.presupuestos
  ALTER COLUMN mano_obra TYPE numeric(18,2),
  ALTER COLUMN insumos TYPE numeric(18,2),
  ALTER COLUMN subtotal TYPE numeric(18,2),
  ALTER COLUMN impuestos TYPE numeric(18,2),
  ALTER COLUMN total TYPE numeric(18,2);

-- Agregar campo de moneda
ALTER TABLE public.presupuestos
  ADD COLUMN moneda tipo_moneda NOT NULL DEFAULT 'CLP';

-- Aumentar precisión en documentos_venta
ALTER TABLE public.documentos_venta
  ALTER COLUMN total TYPE numeric(18,2),
  ALTER COLUMN saldo TYPE numeric(18,2);

-- Agregar campo de moneda a documentos_venta
ALTER TABLE public.documentos_venta
  ADD COLUMN moneda tipo_moneda NOT NULL DEFAULT 'CLP';

-- Aumentar precisión en pagos
ALTER TABLE public.pagos
  ALTER COLUMN monto TYPE numeric(18,2);

-- Aumentar precisión en ordenes_servicio
ALTER TABLE public.ordenes_servicio
  ALTER COLUMN costos_estimado TYPE numeric(18,2),
  ALTER COLUMN costos_real TYPE numeric(18,2);

-- Recrear la vista materializada con los nuevos tipos
CREATE MATERIALIZED VIEW public.kpis_reportes AS
SELECT 
  os.id AS ot_id,
  os.numero AS ot_numero,
  os.tipo_trabajo,
  os.estado,
  os.created_at AS fecha_creacion,
  os.fecha_programada_inicio,
  c.razon_social AS cliente_razon_social,
  ((c.nombres || ' '::text) || c.apellidos) AS cliente_nombre,
  u.comuna,
  u.ciudad,
  u.region,
  a.personal_id,
  a.rol_en_ot,
  tr.tiempo_respuesta_min,
  tr.tiempo_servicio_min,
  tr.en_ruta_inicio,
  tr.en_proceso_inicio,
  tr.en_proceso_fin,
  calcular_semaforo_tiempo(os.tipo_trabajo, tr.tiempo_servicio_min) AS semaforo,
  COALESCE((SELECT sum(documentos_venta.total) FROM documentos_venta WHERE documentos_venta.ot_id = os.id), 0::numeric) AS facturado,
  COALESCE(os.costos_real, os.costos_estimado, 0::numeric) AS costos,
  (COALESCE((SELECT sum(documentos_venta.total) FROM documentos_venta WHERE documentos_venta.ot_id = os.id), 0::numeric) - COALESCE(os.costos_real, os.costos_estimado, 0::numeric)) AS margen
FROM ordenes_servicio os
LEFT JOIN clientes c ON c.id = os.cliente_id
LEFT JOIN ubicaciones u ON u.id = os.ubicacion_id
LEFT JOIN asignaciones_ot a ON a.ot_id = os.id
LEFT JOIN tiempos_reales tr ON tr.ot_id = os.id AND tr.asignacion_id = a.id
WHERE os.estado <> ALL (ARRAY['draft'::text, 'cancelled'::text]);

-- Crear índices para la vista materializada
CREATE UNIQUE INDEX kpis_reportes_ot_id_personal_id_idx ON public.kpis_reportes(ot_id, personal_id);
CREATE INDEX kpis_reportes_tipo_trabajo_idx ON public.kpis_reportes(tipo_trabajo);
CREATE INDEX kpis_reportes_estado_idx ON public.kpis_reportes(estado);
CREATE INDEX kpis_reportes_fecha_creacion_idx ON public.kpis_reportes(fecha_creacion);