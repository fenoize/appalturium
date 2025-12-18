import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TaskType {
  id: string;
  nombre: string;
  descripcion: string | null;
  costo_estandar: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskTypeInput {
  nombre: string;
  descripcion?: string;
  costo_estandar: number;
  activo?: boolean;
}

export function useTaskTypes() {
  return useQuery({
    queryKey: ["task_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      return data as TaskType[];
    },
  });
}

export function useCrearTaskType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskType: TaskTypeInput) => {
      const { data, error } = await supabase
        .from("task_types")
        .insert(taskType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_types"] });
      toast({ title: "Tipo de tarea creado" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear tipo de tarea",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
