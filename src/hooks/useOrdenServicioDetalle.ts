import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook consolidado: trae la OT con todos los joins necesarios
 * (cliente, ubicación, trabajo, presupuestos, comunicaciones, informe final,
 * logs de estado y asignaciones) en un solo round-trip.
 */
export function useOrdenServicioDetalle(id: string) {
  return useQuery({
    queryKey: ["orden_servicio_detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes_servicio")
        .select(`
          *,
          clientes (
            id, razon_social, nombres, apellidos, rut, email, telefono
          ),
          ubicaciones (
            id, alias, direccion, comuna, ciudad, region
          ),
          trabajos (
            id, nombre_trabajo, descripcion, estado
          ),
          presupuestos (
            id, estado, total, validez_dias, created_at
          ),
          comunicaciones (
            id, canal, resumen, fecha, created_at
          ),
          informes_finales (
            id, created_at, firma_cliente, observaciones_cliente
          ),
          ot_estado_logs (
            id, estado_anterior, estado_nuevo, cambio_realizado_por, created_at
          ),
          asignaciones_ot (
            id, personal_id, rol_en_ot, horario_inicio, horario_fin
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useAsignacionesOT(otId: string) {
  return useQuery({
    queryKey: ["asignaciones_ot", otId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones_ot")
        .select("*")
        .eq("ot_id", otId);

      if (error) throw error;
      return data;
    },
    enabled: !!otId,
  });
}

export function useEstadoLogs(otId: string) {
  return useQuery({
    queryKey: ["ot_estado_logs", otId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ot_estado_logs")
        .select("*")
        .eq("ot_id", otId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!otId,
  });
}

export function useInformeFinal(otId: string) {
  return useQuery({
    queryKey: ["informe_final", otId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("informes_finales")
        .select("*")
        .eq("ot_id", otId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!otId,
  });
}
