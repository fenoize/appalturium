import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Pago {
  id: string;
  documento_id: string;
  fecha: string;
  monto: number;
  metodo: "transferencia" | "tarjeta" | "efectivo" | "cheque" | "otro";
  referencia?: string;
  notas?: string;
  registrado_por_user_id: string;
  created_at: string;
}

export function usePagosDocumento(documentoId?: string) {
  return useQuery({
    queryKey: ["pagos", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];
      
      const { data, error } = await supabase
        .from("pagos")
        .select("*")
        .eq("documento_id", documentoId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data as Pago[];
    },
    enabled: !!documentoId,
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pago: Omit<Pago, "id" | "created_at" | "registrado_por_user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("pagos")
        .insert([{
          ...pago,
          registrado_por_user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pagos", data.documento_id] });
      queryClient.invalidateQueries({ queryKey: ["documentos_venta"] });
      toast({
        title: "Pago registrado",
        description: "El pago se registró exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useEliminarPago() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pagoId: string) => {
      const { error } = await supabase
        .from("pagos")
        .delete()
        .eq("id", pagoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["documentos_venta"] });
      toast({
        title: "Pago eliminado",
        description: "El pago se eliminó correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}
