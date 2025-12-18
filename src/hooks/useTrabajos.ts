import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type TipoTrabajo = 'simple' | 'complejo' | 'mantencion';
export type EstadoTrabajo = 'pendiente' | 'en_ejecucion' | 'finalizado' | 'cancelado';

export interface Trabajo {
  id: string;
  cliente_id: string;
  oportunidad_id: string | null;
  nombre_trabajo: string;
  tipo_trabajo: TipoTrabajo;
  descripcion: string | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  estado: EstadoTrabajo;
  created_by: string;
  created_at: string;
  updated_at: string;
  cliente?: {
    razon_social: string | null;
    nombres: string | null;
    apellidos: string | null;
  } | null;
  proyectos?: { id: string; nombre: string }[];
}

export interface TrabajoInput {
  cliente_id: string;
  nombre_trabajo: string;
  tipo_trabajo?: TipoTrabajo;
  descripcion?: string;
  fecha_inicio_estimada?: string;
  fecha_fin_estimada?: string;
  estado?: EstadoTrabajo;
}

export function useTrabajos() {
  return useQuery({
    queryKey: ["trabajos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trabajos")
        .select(`
          *,
          cliente:clientes(razon_social, nombres, apellidos),
          proyectos(id, nombre)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Trabajo[];
    },
  });
}

export function useTrabajosByCliente(clienteId: string) {
  return useQuery({
    queryKey: ["trabajos", "cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trabajos")
        .select(`
          *,
          proyectos(id, nombre)
        `)
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Trabajo[];
    },
    enabled: !!clienteId,
  });
}

export function useTrabajo(id: string) {
  return useQuery({
    queryKey: ["trabajo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trabajos")
        .select(`
          *,
          cliente:clientes(razon_social, nombres, apellidos),
          proyectos(id, nombre)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Trabajo;
    },
    enabled: !!id,
  });
}

export function useCrearTrabajo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trabajo: TrabajoInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("trabajos")
        .insert({
          ...trabajo,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trabajos"] });
      queryClient.invalidateQueries({ queryKey: ["trabajos", "cliente", variables.cliente_id] });
      toast({ title: "Trabajo creado exitosamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear trabajo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActualizarTrabajo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...trabajo }: Partial<TrabajoInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("trabajos")
        .update(trabajo)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trabajos"] });
      toast({ title: "Trabajo actualizado" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar trabajo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEliminarTrabajo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trabajos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trabajos"] });
      toast({ title: "Trabajo eliminado" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar trabajo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
