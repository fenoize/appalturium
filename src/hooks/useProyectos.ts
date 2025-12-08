import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type EstadoProyecto = 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
export type PrioridadTarea = 'baja' | 'media' | 'alta' | 'urgente';

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  cliente_id: string | null;
  estado: EstadoProyecto;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  fecha_fin_real: string | null;
  presupuesto: number;
  costo_real: number;
  responsable_id: string | null;
  prioridad: PrioridadTarea;
  progreso: number;
  etiquetas: string[];
  notas: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  cliente?: {
    razon_social: string | null;
    nombres: string | null;
    apellidos: string | null;
  } | null;
  responsable?: {
    nombre_completo: string;
  } | null;
}

export interface ProyectoInput {
  nombre: string;
  descripcion?: string;
  cliente_id?: string;
  estado?: EstadoProyecto;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  presupuesto?: number;
  responsable_id?: string;
  prioridad?: PrioridadTarea;
  etiquetas?: string[];
  notas?: string;
}

export function useProyectos() {
  return useQuery({
    queryKey: ["proyectos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          *,
          cliente:clientes(razon_social, nombres, apellidos),
          responsable:personal_fichas(nombre_completo)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Proyecto[];
    },
  });
}

export function useProyecto(id: string) {
  return useQuery({
    queryKey: ["proyecto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          *,
          cliente:clientes(razon_social, nombres, apellidos),
          responsable:personal_fichas(nombre_completo)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Proyecto;
    },
    enabled: !!id,
  });
}

export function useCrearProyecto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (proyecto: ProyectoInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("proyectos")
        .insert({
          ...proyecto,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      toast({ title: "Proyecto creado exitosamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear proyecto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActualizarProyecto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...proyecto }: ProyectoInput & { id: string }) => {
      const { data, error } = await supabase
        .from("proyectos")
        .update(proyecto)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      toast({ title: "Proyecto actualizado" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar proyecto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEliminarProyecto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proyectos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      toast({ title: "Proyecto eliminado" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar proyecto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
