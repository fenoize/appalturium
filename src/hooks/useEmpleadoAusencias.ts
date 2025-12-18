import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EmpleadoAusencia {
  id: string;
  empleado_id: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_totales: number;
  estado: string;
  aprobado_por?: string;
  aprobado_at?: string;
  motivo?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export function useEmpleadoAusencias(empleadoId?: string) {
  return useQuery({
    queryKey: ["empleado_ausencias", empleadoId],
    enabled: !!empleadoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleado_ausencias")
        .select("*")
        .eq("empleado_id", empleadoId)
        .order("fecha_inicio", { ascending: false });
      if (error) throw error;
      return data as EmpleadoAusencia[];
    },
  });
}

export function useCrearAusencia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ausencia: Partial<EmpleadoAusencia>) => {
      const { data, error } = await supabase
        .from("empleado_ausencias")
        .insert([ausencia])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empleado_ausencias", variables.empleado_id] });
      toast({ title: "Ausencia registrada", description: "La solicitud se ha creado correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useActualizarAusencia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, empleadoId, ...updates }: { id: string; empleadoId: string } & Partial<EmpleadoAusencia>) => {
      const { data, error } = await supabase
        .from("empleado_ausencias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, empleadoId };
    },
    onSuccess: ({ empleadoId }) => {
      queryClient.invalidateQueries({ queryKey: ["empleado_ausencias", empleadoId] });
      toast({ title: "Ausencia actualizada" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}
