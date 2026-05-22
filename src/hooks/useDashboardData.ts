import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardMetrics {
  clientesActivos: number;
  clientesAnterior: number;
  proyectosEnCurso: number;
  proyectosAnterior: number;
  inventarioTotal: number;
  inventarioAnterior: number;
  ingresosMes: number;
  ingresosAnterior: number;
  empleados: number;
  mantencionesMes: number;
  mantencionesAnterior: number;
  tareasPendientes: number;
  eficiencia: number;
  eficienciaAnterior: number;
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data, error } = await supabase.rpc("get_dashboard_metrics");
      if (error) throw error;
      const m = (data ?? {}) as Record<string, number>;
      return {
        clientesActivos: Number(m.clientes_activos ?? 0),
        clientesAnterior: Number(m.clientes_anterior ?? 0),
        proyectosEnCurso: Number(m.proyectos_en_curso ?? 0),
        proyectosAnterior: Number(m.proyectos_anterior ?? 0),
        inventarioTotal: Number(m.inventario_total ?? 0),
        inventarioAnterior: Number(m.inventario_anterior ?? 0),
        ingresosMes: Number(m.ingresos_mes ?? 0),
        ingresosAnterior: Number(m.ingresos_anterior ?? 0),
        empleados: Number(m.empleados ?? 0),
        mantencionesMes: Number(m.mantenciones_mes ?? 0),
        mantencionesAnterior: Number(m.mantenciones_anterior ?? 0),
        tareasPendientes: Number(m.tareas_pendientes ?? 0),
        eficiencia: Number(m.eficiencia ?? 0),
        eficienciaAnterior: Number(m.eficiencia_anterior ?? 0),
      };
    },
  });
}
