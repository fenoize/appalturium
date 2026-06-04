import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FrecuenciaPlan = "mensual" | "trimestral" | "semestral" | "anual";

export interface PlanMantenimiento {
  id: string;
  equipo_id: string;
  frecuencia: string;
  proxima_fecha: string;
  ultimo_ot_id: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanProximoConEquipo extends PlanMantenimiento {
  equipo?: {
    id: string;
    codigo_qr: string;
    marca: string | null;
    modelo: string | null;
  } | null;
}

export function usePlanMantenimientoEquipo(equipoId?: string) {
  return useQuery({
    queryKey: ["plan_mantenimiento", equipoId],
    enabled: !!equipoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planes_mantenimiento")
        .select("*")
        .eq("equipo_id", equipoId!)
        .eq("activo", true)
        .maybeSingle();
      if (error) throw error;
      return data as PlanMantenimiento | null;
    },
  });
}

export function usePlanesProximos(diasAdelante: number = 30) {
  return useQuery({
    queryKey: ["planes_proximos", diasAdelante],
    queryFn: async () => {
      const hoy = new Date();
      const limite = new Date();
      limite.setDate(limite.getDate() + diasAdelante);

      const { data, error } = await supabase
        .from("planes_mantenimiento")
        .select("*, equipo:equipos(id, codigo_qr, marca, modelo)")
        .eq("activo", true)
        .gte("proxima_fecha", hoy.toISOString().slice(0, 10))
        .lte("proxima_fecha", limite.toISOString().slice(0, 10))
        .order("proxima_fecha", { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []) as PlanProximoConEquipo[];
    },
  });
}

export function useGuardarPlanMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      equipo_id: string;
      frecuencia: string;
      proxima_fecha: string;
      activo: boolean;
      notas?: string | null;
    }) => {
      if (payload.id) {
        const { data, error } = await supabase
          .from("planes_mantenimiento")
          .update({
            frecuencia: payload.frecuencia,
            proxima_fecha: payload.proxima_fecha,
            activo: payload.activo,
            notas: payload.notas ?? null,
          })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("planes_mantenimiento")
          .insert({
            equipo_id: payload.equipo_id,
            frecuencia: payload.frecuencia,
            proxima_fecha: payload.proxima_fecha,
            activo: payload.activo,
            notas: payload.notas ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plan_mantenimiento", variables.equipo_id] });
      queryClient.invalidateQueries({ queryKey: ["planes_proximos"] });
      toast.success("Plan de mantenimiento guardado");
    },
    onError: (err: any) => toast.error("Error al guardar plan", { description: err.message }),
  });
}
