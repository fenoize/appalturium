import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Comunicacion {
  id: string;
  ot_id: string;
  canal: 'email' | 'telefono' | 'whatsapp' | 'nota';
  fecha: string;
  emisor_user_id?: string;
  destinatario: string;
  resumen: string;
  adjuntos: any[];
  requiere_respuesta: boolean;
  estatus: 'pendiente' | 'resuelto';
  created_at: string;
  updated_at: string;
}

interface UseComunicacionesParams {
  otId: string;
  canal?: 'email' | 'telefono' | 'whatsapp' | 'nota';
  estatus?: 'pendiente' | 'resuelto';
}

export function useComunicaciones({ otId, canal, estatus }: UseComunicacionesParams) {
  return useQuery({
    queryKey: ["comunicaciones", otId, canal, estatus],
    queryFn: async () => {
      let query = supabase
        .from("comunicaciones")
        .select("*")
        .eq("ot_id", otId)
        .order("fecha", { ascending: false });

      if (canal) {
        query = query.eq("canal", canal);
      }

      if (estatus) {
        query = query.eq("estatus", estatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Comunicacion[];
    },
    enabled: !!otId,
  });
}

export function useCrearComunicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comunicacion: Omit<Comunicacion, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("comunicaciones")
        .insert(comunicacion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comunicaciones", data.ot_id] });
      toast.success("Comunicación registrada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al registrar comunicación");
    },
  });
}

export function useActualizarComunicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Comunicacion> & { id: string }) => {
      const { data, error } = await supabase
        .from("comunicaciones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comunicaciones", data.ot_id] });
      toast.success("Comunicación actualizada");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar comunicación");
    },
  });
}

export function useMarcarComoResuelto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("comunicaciones")
        .update({ estatus: "resuelto" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comunicaciones", data.ot_id] });
      toast.success("Comunicación marcada como resuelta");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al marcar como resuelta");
    },
  });
}
