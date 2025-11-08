import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DocumentoVenta {
  id: string;
  ot_id: string;
  tipo: "boleta" | "factura" | "nota_credito" | "nota_debito" | "otro";
  numero: string;
  fecha: string;
  total: number;
  saldo: number;
  moneda: "CLP" | "UF" | "USD";
  pdf_url?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export function useDocumentosOT(otId?: string) {
  return useQuery({
    queryKey: ["documentos_venta", otId],
    queryFn: async () => {
      if (!otId) return [];
      
      const { data, error } = await supabase
        .from("documentos_venta")
        .select("*")
        .eq("ot_id", otId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data as DocumentoVenta[];
    },
    enabled: !!otId,
  });
}

export function useCrearDocumento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documento: Partial<DocumentoVenta>) => {
      // Generar número si no se proporciona
      let numero = documento.numero;
      if (!numero && documento.tipo) {
        const { data: numeroGenerado, error: errorNumero } = await supabase
          .rpc("generar_numero_documento", { _tipo: documento.tipo });
        
        if (errorNumero) throw errorNumero;
        numero = numeroGenerado;
      }

      const documentoData: any = {
        ...documento,
        numero,
        saldo: documento.total, // Saldo inicial = total
      };

      const { data, error } = await supabase
        .from("documentos_venta")
        .insert([documentoData])
        .select()
        .single();

      if (error) throw error;
      return data as DocumentoVenta;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documentos_venta", data.ot_id] });
      toast({
        title: "Documento creado",
        description: `${data.tipo} ${data.numero} creado exitosamente`,
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

export function useActualizarDocumento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<DocumentoVenta> }) => {
      const { data, error } = await supabase
        .from("documentos_venta")
        .update(datos)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documentos_venta", data.ot_id] });
      toast({
        title: "Documento actualizado",
        description: "Los cambios se guardaron correctamente",
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
