import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FiltrosReportes {
  fechaInicio?: string;
  fechaFin?: string;
  personalId?: string;
  tipoTrabajo?: string;
  comuna?: string;
  semaforo?: 'verde' | 'amarillo' | 'rojo' | 'sin_estandar';
}

export interface KPIData {
  ot_id: string;
  ot_numero: string;
  tipo_trabajo: string;
  estado: string;
  fecha_creacion: string;
  cliente_razon_social?: string;
  cliente_nombre?: string;
  comuna?: string;
  ciudad?: string;
  region?: string;
  personal_id?: string;
  rol_en_ot?: string;
  tiempo_respuesta_min?: number;
  tiempo_servicio_min?: number;
  en_ruta_inicio?: string;
  en_proceso_inicio?: string;
  en_proceso_fin?: string;
  semaforo?: string;
  facturado: number;
  costos: number;
  margen: number;
}

export interface ResumenKPIs {
  total_ot: number;
  promedio_ttr: number;
  promedio_tts: number;
  cumplimiento_verde: number;
  cumplimiento_amarillo: number;
  cumplimiento_rojo: number;
  porcentaje_cumplimiento: number;
  facturacion_total: number;
  margen_total: number;
  margen_porcentaje: number;
}

export function useReportesKPIs(filtros: FiltrosReportes = {}) {
  return useQuery({
    queryKey: ["reportes_kpis", filtros],
    queryFn: async () => {
      // Refrescar vista materializada
      await supabase.rpc("refresh_kpis_reportes");

      let query = supabase
        .from("kpis_reportes")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (filtros.fechaInicio) {
        query = query.gte("fecha_creacion", filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte("fecha_creacion", filtros.fechaFin);
      }
      if (filtros.personalId) {
        query = query.eq("personal_id", filtros.personalId);
      }
      if (filtros.tipoTrabajo) {
        query = query.eq("tipo_trabajo", filtros.tipoTrabajo);
      }
      if (filtros.comuna) {
        query = query.eq("comuna", filtros.comuna);
      }
      if (filtros.semaforo) {
        query = query.eq("semaforo", filtros.semaforo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KPIData[];
    },
  });
}

export function useResumenKPIs(filtros: FiltrosReportes = {}) {
  return useQuery({
    queryKey: ["resumen_kpis", filtros],
    queryFn: async () => {
      // Refrescar vista materializada primero
      await supabase.rpc("refresh_kpis_reportes");

      let query = supabase
        .from("kpis_reportes")
        .select("*");

      if (filtros.fechaInicio) {
        query = query.gte("fecha_creacion", filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte("fecha_creacion", filtros.fechaFin);
      }
      if (filtros.personalId) {
        query = query.eq("personal_id", filtros.personalId);
      }
      if (filtros.tipoTrabajo) {
        query = query.eq("tipo_trabajo", filtros.tipoTrabajo);
      }
      if (filtros.comuna) {
        query = query.eq("comuna", filtros.comuna);
      }

      const { data, error } = await query;

      if (error) throw error;

      const kpis = data as KPIData[];

      // Calcular resumen
      const total_ot = kpis.length;
      const conTiempos = kpis.filter(k => k.tiempo_respuesta_min && k.tiempo_servicio_min);
      
      const promedio_ttr = conTiempos.length > 0
        ? conTiempos.reduce((sum, k) => sum + (k.tiempo_respuesta_min || 0), 0) / conTiempos.length
        : 0;

      const promedio_tts = conTiempos.length > 0
        ? conTiempos.reduce((sum, k) => sum + (k.tiempo_servicio_min || 0), 0) / conTiempos.length
        : 0;

      const cumplimiento_verde = kpis.filter(k => k.semaforo === 'verde').length;
      const cumplimiento_amarillo = kpis.filter(k => k.semaforo === 'amarillo').length;
      const cumplimiento_rojo = kpis.filter(k => k.semaforo === 'rojo').length;

      const porcentaje_cumplimiento = total_ot > 0
        ? ((cumplimiento_verde + cumplimiento_amarillo) / total_ot) * 100
        : 0;

      const facturacion_total = kpis.reduce((sum, k) => sum + k.facturado, 0);
      const margen_total = kpis.reduce((sum, k) => sum + k.margen, 0);
      const margen_porcentaje = facturacion_total > 0
        ? (margen_total / facturacion_total) * 100
        : 0;

      return {
        total_ot,
        promedio_ttr,
        promedio_tts,
        cumplimiento_verde,
        cumplimiento_amarillo,
        cumplimiento_rojo,
        porcentaje_cumplimiento,
        facturacion_total,
        margen_total,
        margen_porcentaje,
      } as ResumenKPIs;
    },
  });
}

export function useTiposTrabajoReportes() {
  return useQuery({
    queryKey: ["tipos_trabajo_reportes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parametros_sistema")
        .select("key, label")
        .eq("categoria", "standard_times")
        .eq("activo", true)
        .order("orden");

      if (error) throw error;
      return data;
    },
  });
}
