import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { detectarConflictosAsignacion } from "@/lib/asignaciones-conflictos";

export interface AsignacionOT {
  id: string;
  ot_id: string;
  personal_id: string;
  rol_en_ot: string | null;
  horario_inicio: string | null;
  horario_fin: string | null;
  notas: string | null;
  created_at: string;
  personal?: {
    nombre_completo: string;
    rol_operativo: string;
  } | null;
}

export function useAsignacionesOT(otId?: string) {
  return useQuery({
    queryKey: ["asignaciones_ot", otId],
    enabled: !!otId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones_ot")
        .select("*")
        .eq("ot_id", otId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const personalIds = [...new Set((data || []).map((a) => a.personal_id))];
      let fichasMap = new Map<string, { nombre_completo: string; rol_operativo: string }>();
      if (personalIds.length > 0) {
        const { data: fichas } = await supabase
          .from("personal_fichas")
          .select("user_id, nombre_completo, rol_operativo")
          .in("user_id", personalIds);
        fichasMap = new Map((fichas || []).map((f) => [f.user_id, f as any]));
      }
      return (data || []).map((a) => ({
        ...a,
        personal: fichasMap.get(a.personal_id) || null,
      })) as AsignacionOT[];
    },
  });
}

export function useCrearAsignacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ot_id: string;
      personal_id: string;
      rol_en_ot?: string | null;
      horario_inicio?: string | null;
      horario_fin?: string | null;
      notas?: string | null;
    }) => {
      // Validar conflicto de horario con otras OT del mismo técnico
      const { data: ot, error: otErr } = await supabase
        .from("ordenes_servicio")
        .select("fecha_programada_inicio, fecha_programada_fin")
        .eq("id", payload.ot_id)
        .maybeSingle();
      if (otErr) throw otErr;
      if (ot?.fecha_programada_inicio && ot?.fecha_programada_fin) {
        const conflictos = await detectarConflictosAsignacion({
          personalIds: [payload.personal_id],
          inicio: new Date(ot.fecha_programada_inicio),
          fin: new Date(ot.fecha_programada_fin),
          otIdExcluida: payload.ot_id,
        });
        if (conflictos.length > 0) {
          throw new Error(
            `El técnico ya está asignado a la OT ${conflictos.map((c) => c.numero).join(", ")} en ese horario`
          );
        }
      }

      const { data, error } = await supabase
        .from("asignaciones_ot")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asignaciones_ot", variables.ot_id] });
      toast.success("Técnico asignado");
    },
    onError: (err: any) => toast.error("Error al asignar", { description: err.message }),
  });
}

export function useEliminarAsignacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; ot_id: string }) => {
      const { error } = await supabase.from("asignaciones_ot").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asignaciones_ot", variables.ot_id] });
      toast.success("Asignación eliminada");
    },
    onError: (err: any) => toast.error("Error al eliminar", { description: err.message }),
  });
}
