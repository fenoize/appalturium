import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'revision' | 'completada' | 'cancelada';
export type PrioridadTarea = 'baja' | 'media' | 'alta' | 'urgente';

export interface Tarea {
  id: string;
  proyecto_id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  asignado_a: string | null;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  fecha_completada: string | null;
  horas_estimadas: number;
  horas_reales: number;
  orden: number;
  tarea_padre_id: string | null;
  etiquetas: string[];
  adjuntos: unknown[];
  created_by: string;
  created_at: string;
  updated_at: string;
  proyecto?: {
    nombre: string;
  } | null;
  asignado?: {
    nombre_completo: string;
  } | null;
}

export interface TareaInput {
  proyecto_id: string;
  titulo: string;
  descripcion?: string;
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  asignado_a?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  horas_estimadas?: number;
  orden?: number;
  tarea_padre_id?: string;
  etiquetas?: string[];
}

export function useTareas(proyectoId?: string) {
  return useQuery({
    queryKey: ["tareas", proyectoId],
    queryFn: async () => {
      let query = supabase
        .from("tareas")
        .select(`
          *,
          proyecto:proyectos(nombre),
          asignado:personal_fichas!tareas_asignado_a_fkey(nombre_completo)
        `)
        .order("orden", { ascending: true });

      if (proyectoId) {
        query = query.eq("proyecto_id", proyectoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Tarea[];
    },
  });
}

export function useTarea(id: string) {
  return useQuery({
    queryKey: ["tarea", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tareas")
        .select(`
          *,
          proyecto:proyectos(nombre),
          asignado:personal_fichas!tareas_asignado_a_fkey(nombre_completo)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Tarea;
    },
    enabled: !!id,
  });
}

export function useCrearTarea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tarea: TareaInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("tareas")
        .insert({
          ...tarea,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast({ title: "Tarea creada exitosamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al crear tarea",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActualizarTarea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...tarea }: Partial<TareaInput> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...tarea };
      
      // Si se marca como completada, agregar fecha_completada
      if (tarea.estado === 'completada') {
        updateData.fecha_completada = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("tareas")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast({ title: "Tarea actualizada" });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar tarea",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEliminarTarea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tareas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast({ title: "Tarea eliminada" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar tarea",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useComentariosTarea(tareaId: string) {
  return useQuery({
    queryKey: ["comentarios-tarea", tareaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comentarios_tarea")
        .select("*")
        .eq("tarea_id", tareaId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tareaId,
  });
}

export function useCrearComentario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tareaId, contenido }: { tareaId: string; contenido: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("comentarios_tarea")
        .insert({
          tarea_id: tareaId,
          usuario_id: userData.user.id,
          contenido,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comentarios-tarea", variables.tareaId] });
      toast({ title: "Comentario agregado" });
    },
    onError: (error) => {
      toast({
        title: "Error al agregar comentario",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
