import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

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
      const now = new Date();
      const inicioMesActual = startOfMonth(now);
      const finMesActual = endOfMonth(now);
      const inicioMesAnterior = startOfMonth(subMonths(now, 1));
      const finMesAnterior = endOfMonth(subMonths(now, 1));

      // Clientes activos
      const { count: clientesActivos } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("estado_cliente", "activo");

      // Clientes mes anterior (aproximación basada en created_at)
      const { count: clientesAnterior } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("estado_cliente", "activo")
        .lt("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      // Proyectos en curso
      const { count: proyectosEnCurso } = await supabase
        .from("proyectos")
        .select("*", { count: "exact", head: true })
        .in("estado", ["planificacion", "en_progreso", "pausado"]);

      // Proyectos mes anterior
      const { count: proyectosAnterior } = await supabase
        .from("proyectos")
        .select("*", { count: "exact", head: true })
        .in("estado", ["planificacion", "en_progreso", "pausado"])
        .lt("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      // Inventario total (valor en stock)
      const { data: inventarioData } = await supabase
        .from("inventario")
        .select("stock_actual, precio_venta")
        .eq("activo", true);

      const inventarioTotal = inventarioData?.reduce(
        (acc, item) => acc + (item.stock_actual || 0) * (item.precio_venta || 0),
        0
      ) || 0;

      // Ingresos del mes (documentos de venta)
      const { data: ingresosData } = await supabase
        .from("documentos_venta")
        .select("total")
        .gte("fecha", format(inicioMesActual, "yyyy-MM-dd"))
        .lte("fecha", format(finMesActual, "yyyy-MM-dd"));

      const ingresosMes = ingresosData?.reduce((acc, doc) => acc + (doc.total || 0), 0) || 0;

      // Ingresos mes anterior
      const { data: ingresosAnteriorData } = await supabase
        .from("documentos_venta")
        .select("total")
        .gte("fecha", format(inicioMesAnterior, "yyyy-MM-dd"))
        .lte("fecha", format(finMesAnterior, "yyyy-MM-dd"));

      const ingresosAnterior = ingresosAnteriorData?.reduce((acc, doc) => acc + (doc.total || 0), 0) || 0;

      // Empleados activos
      const { count: empleados } = await supabase
        .from("personal_fichas")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      // Mantenciones del mes (OT tipo mantencion)
      const { count: mantencionesMes } = await supabase
        .from("ordenes_servicio")
        .select("*", { count: "exact", head: true })
        .ilike("tipo_trabajo", "%manten%")
        .gte("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      // Mantenciones mes anterior
      const { count: mantencionesAnterior } = await supabase
        .from("ordenes_servicio")
        .select("*", { count: "exact", head: true })
        .ilike("tipo_trabajo", "%manten%")
        .gte("created_at", format(inicioMesAnterior, "yyyy-MM-dd"))
        .lt("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      // Tareas pendientes
      const { count: tareasPendientes } = await supabase
        .from("tareas")
        .select("*", { count: "exact", head: true })
        .neq("estado", "completada");

      // Eficiencia (OT completadas vs total este mes)
      const { count: otTotalMes } = await supabase
        .from("ordenes_servicio")
        .select("*", { count: "exact", head: true })
        .gte("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      const { count: otCompletadasMes } = await supabase
        .from("ordenes_servicio")
        .select("*", { count: "exact", head: true })
        .in("estado", ["completed", "closed"])
        .gte("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      const eficiencia = otTotalMes && otTotalMes > 0 
        ? Math.round((otCompletadasMes || 0) / otTotalMes * 100) 
        : 0;

      // Eficiencia mes anterior
      const { count: otTotalAnterior } = await supabase
        .from("ordenes_servicio")
        .select("*", { count: "exact", head: true })
        .gte("created_at", format(inicioMesAnterior, "yyyy-MM-dd"))
        .lt("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      const { count: otCompletadasAnterior } = await supabase
        .from("ordenes_servicio")
        .select("*", { count: "exact", head: true })
        .in("estado", ["completed", "closed"])
        .gte("created_at", format(inicioMesAnterior, "yyyy-MM-dd"))
        .lt("created_at", format(inicioMesActual, "yyyy-MM-dd"));

      const eficienciaAnterior = otTotalAnterior && otTotalAnterior > 0 
        ? Math.round((otCompletadasAnterior || 0) / otTotalAnterior * 100) 
        : 0;

      return {
        clientesActivos: clientesActivos || 0,
        clientesAnterior: clientesAnterior || 0,
        proyectosEnCurso: proyectosEnCurso || 0,
        proyectosAnterior: proyectosAnterior || 0,
        inventarioTotal,
        inventarioAnterior: inventarioTotal, // Sin histórico disponible
        ingresosMes,
        ingresosAnterior,
        empleados: empleados || 0,
        mantencionesMes: mantencionesMes || 0,
        mantencionesAnterior: mantencionesAnterior || 0,
        tareasPendientes: tareasPendientes || 0,
        eficiencia,
        eficienciaAnterior,
      };
    },
  });
}
