import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type EstadoFase = 'pendiente' | 'en_progreso' | 'completada';

export interface FaseProyecto {
  id: string;
  proyecto_id: string;
  nombre: string;
  orden: number;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  estado: EstadoFase;
  created_by: string;
  created_at: string;
  updated_at: string;
  tareas_count?: number;
}

export interface FaseInput {
  proyecto_id: string;
  nombre: string;
  orden?: number;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  estado?: EstadoFase;
}

export function useFasesProyecto(proyectoId: string) {
  return useQuery({
    queryKey: ["fases_proyecto", proyectoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fases_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId)
        .order("orden", { ascending: true });

      if (error) throw error;
      return data as unknown as FaseProyecto[];
    },
    enabled: !!proyectoId,
  });
}

export function useCrearFase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fase: FaseInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("fases_proyecto")
        .insert({
          ...fase,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fases_proyecto", variables.proyecto_id] });
      toast({ title: "Fase creada exitosamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear fase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActualizarFase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, proyecto_id, ...fase }: Partial<FaseInput> & { id: string; proyecto_id: string }) => {
      const { data, error } = await supabase
        .from("fases_proyecto")
        .update(fase)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fases_proyecto", variables.proyecto_id] });
      toast({ title: "Fase actualizada" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar fase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEliminarFase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, proyecto_id }: { id: string; proyecto_id: string }) => {
      const { error } = await supabase.from("fases_proyecto").delete().eq("id", id);
      if (error) throw error;
      return proyecto_id;
    },
    onSuccess: (proyecto_id) => {
      queryClient.invalidateQueries({ queryKey: ["fases_proyecto", proyecto_id] });
      toast({ title: "Fase eliminada" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar fase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
