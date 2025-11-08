import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PresupuestoItem {
  concepto: string;
  cantidad: number;
  precio_unit: number;
  subtotal: number;
}

export interface Presupuesto {
  id: string;
  ot_id: string;
  items: PresupuestoItem[];
  mano_obra: number;
  insumos: number;
  subtotal: number;
  impuestos: number;
  total: number;
  validez_dias: number;
  estado: "borrador" | "enviado" | "aprobado" | "rechazado";
  moneda: "CLP" | "UF" | "USD";
  aprobado_por_contacto_id?: string;
  aprobado_ts?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export function usePresupuestoOT(otId?: string) {
  return useQuery({
    queryKey: ["presupuesto", otId],
    queryFn: async () => {
      if (!otId) return null;
      
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("ot_id", otId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        items: data.items as unknown as PresupuestoItem[],
      } as Presupuesto;
    },
    enabled: !!otId,
  });
}

export function useCrearPresupuesto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (presupuesto: Partial<Presupuesto>) => {
      const { data, error } = await supabase
        .from("presupuestos")
        .insert([presupuesto as any])
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as PresupuestoItem[],
      } as Presupuesto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["presupuesto", data.ot_id] });
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto se creó exitosamente",
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

export function useActualizarPresupuesto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<Presupuesto> }) => {
      const { data, error } = await supabase
        .from("presupuestos")
        .update(datos as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as PresupuestoItem[],
      } as Presupuesto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["presupuesto", data.ot_id] });
      toast({
        title: "Presupuesto actualizado",
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

export function useCambiarEstadoPresupuesto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      estado, 
      contacto_id 
    }: { 
      id: string; 
      estado: "borrador" | "enviado" | "aprobado" | "rechazado";
      contacto_id?: string;
    }) => {
      const datos: any = { estado };
      
      if (estado === "aprobado" && contacto_id) {
        datos.aprobado_por_contacto_id = contacto_id;
        datos.aprobado_ts = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("presupuestos")
        .update(datos as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as PresupuestoItem[],
      } as Presupuesto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["presupuesto", data.ot_id] });
      toast({
        title: "Estado actualizado",
        description: `Presupuesto marcado como ${data.estado}`,
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
