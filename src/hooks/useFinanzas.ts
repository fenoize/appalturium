import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumenFinanzas {
  total_presupuestos: number;
  presupuestos_aprobados: number;
  presupuestos_rechazados: number;
  presupuestos_enviados: number;
  presupuestos_borrador: number;
  ingresos_proyectados_clp: number;
  ingresos_proyectados_uf: number;
  ingresos_proyectados_usd: number;
  facturado_clp: number;
  facturado_uf: number;
  facturado_usd: number;
}

export interface PresupuestoPorMoneda {
  moneda: "CLP" | "UF" | "USD";
  total: number;
  cantidad: number;
}

export function useResumenFinanzas() {
  return useQuery({
    queryKey: ["resumen_finanzas"],
    queryFn: async () => {
      // Obtener estadísticas de presupuestos
      const { data: presupuestos, error: errorPresupuestos } = await supabase
        .from("presupuestos")
        .select("estado, moneda, total");

      if (errorPresupuestos) throw errorPresupuestos;

      // Obtener documentos de venta
      const { data: documentos, error: errorDocumentos } = await supabase
        .from("documentos_venta")
        .select("moneda, total");

      if (errorDocumentos) throw errorDocumentos;

      // Calcular resumen
      const resumen: ResumenFinanzas = {
        total_presupuestos: presupuestos?.length || 0,
        presupuestos_aprobados: presupuestos?.filter(p => p.estado === "aprobado").length || 0,
        presupuestos_rechazados: presupuestos?.filter(p => p.estado === "rechazado").length || 0,
        presupuestos_enviados: presupuestos?.filter(p => p.estado === "enviado").length || 0,
        presupuestos_borrador: presupuestos?.filter(p => p.estado === "borrador").length || 0,
        ingresos_proyectados_clp: presupuestos?.filter(p => p.estado === "aprobado" && p.moneda === "CLP").reduce((acc, p) => acc + Number(p.total), 0) || 0,
        ingresos_proyectados_uf: presupuestos?.filter(p => p.estado === "aprobado" && p.moneda === "UF").reduce((acc, p) => acc + Number(p.total), 0) || 0,
        ingresos_proyectados_usd: presupuestos?.filter(p => p.estado === "aprobado" && p.moneda === "USD").reduce((acc, p) => acc + Number(p.total), 0) || 0,
        facturado_clp: documentos?.filter(d => d.moneda === "CLP").reduce((acc, d) => acc + Number(d.total), 0) || 0,
        facturado_uf: documentos?.filter(d => d.moneda === "UF").reduce((acc, d) => acc + Number(d.total), 0) || 0,
        facturado_usd: documentos?.filter(d => d.moneda === "USD").reduce((acc, d) => acc + Number(d.total), 0) || 0,
      };

      return resumen;
    },
  });
}

export function usePresupuestosPorEstado() {
  return useQuery({
    queryKey: ["presupuestos_por_estado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("estado, total");

      if (error) throw error;

      const porEstado = {
        aprobado: { cantidad: 0, total: 0 },
        rechazado: { cantidad: 0, total: 0 },
        enviado: { cantidad: 0, total: 0 },
        borrador: { cantidad: 0, total: 0 },
      };

      data?.forEach((p) => {
        const estado = p.estado as keyof typeof porEstado;
        porEstado[estado].cantidad += 1;
        porEstado[estado].total += Number(p.total);
      });

      return Object.entries(porEstado).map(([estado, stats]) => ({
        estado,
        cantidad: stats.cantidad,
        total: stats.total,
      }));
    },
  });
}

export function usePresupuestosPorMoneda() {
  return useQuery({
    queryKey: ["presupuestos_por_moneda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("moneda, total, estado")
        .eq("estado", "aprobado");

      if (error) throw error;

      const porMoneda: Record<string, PresupuestoPorMoneda> = {
        CLP: { moneda: "CLP", total: 0, cantidad: 0 },
        UF: { moneda: "UF", total: 0, cantidad: 0 },
        USD: { moneda: "USD", total: 0, cantidad: 0 },
      };

      data?.forEach((p) => {
        const moneda = p.moneda as "CLP" | "UF" | "USD";
        porMoneda[moneda].total += Number(p.total);
        porMoneda[moneda].cantidad += 1;
      });

      return Object.values(porMoneda);
    },
  });
}

export function useComparacionFinanciera() {
  return useQuery({
    queryKey: ["comparacion_financiera"],
    queryFn: async () => {
      const { data: presupuestos, error: errorPresupuestos } = await supabase
        .from("presupuestos")
        .select("moneda, total, estado")
        .eq("estado", "aprobado");

      if (errorPresupuestos) throw errorPresupuestos;

      const { data: documentos, error: errorDocumentos } = await supabase
        .from("documentos_venta")
        .select("moneda, total");

      if (errorDocumentos) throw errorDocumentos;

      const comparacion = ["CLP", "UF", "USD"].map((moneda) => ({
        moneda,
        presupuestado: presupuestos?.filter(p => p.moneda === moneda).reduce((acc, p) => acc + Number(p.total), 0) || 0,
        facturado: documentos?.filter(d => d.moneda === moneda).reduce((acc, d) => acc + Number(d.total), 0) || 0,
      }));

      return comparacion;
    },
  });
}
