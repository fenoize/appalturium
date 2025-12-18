import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EmpleadoDocumento {
  id: string;
  empleado_id: string;
  tipo: string;
  nombre: string;
  descripcion?: string;
  archivo_url?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export function useEmpleadoDocumentos(empleadoId?: string) {
  return useQuery({
    queryKey: ["empleado_documentos", empleadoId],
    enabled: !!empleadoId,
    queryFn: async (): Promise<EmpleadoDocumento[]> => {
      // Table exists but types not generated yet - use raw query
      const { data, error } = await supabase
        .from("empleado_documentos" as any)
        .select("*")
        .eq("empleado_id", empleadoId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn('empleado_documentos query error:', error);
        return [];
      }
      return (data || []) as unknown as EmpleadoDocumento[];
    },
  });
}

export function useCrearDocumentoEmpleado() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (doc: Partial<EmpleadoDocumento>) => {
      const { data, error } = await supabase
        .from("empleado_documentos" as any)
        .insert([doc])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empleado_documentos", variables.empleado_id] });
      toast({ title: "Documento agregado", description: "El documento se ha registrado correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useEliminarDocumentoEmpleado() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, empleadoId }: { id: string; empleadoId: string }) => {
      const { error } = await supabase.from("empleado_documentos" as any).delete().eq("id", id);
      if (error) throw error;
      return empleadoId;
    },
    onSuccess: (empleadoId) => {
      queryClient.invalidateQueries({ queryKey: ["empleado_documentos", empleadoId] });
      toast({ title: "Documento eliminado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}
