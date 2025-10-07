import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrdenServicioDetalle(id: string) {
  return useQuery({
    queryKey: ["orden_servicio_detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes_servicio")
        .select(`
          *,
          clientes (
            id,
            razon_social,
            nombres,
            apellidos,
            rut,
            email,
            telefono
          ),
          ubicaciones (
            id,
            alias,
            direccion,
            comuna,
            ciudad,
            region
          )
        `)
        .eq("id", id)
        .single();

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
