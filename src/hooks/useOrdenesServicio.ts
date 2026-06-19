import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrdenServicio {
  id: string;
  numero: string;
  cliente_id: string;
  ubicacion_id: string;
  trabajo_id: string | null;
  proyecto_id: string | null;
  fase_id: string | null;
  tarea_id: string | null;
  tipo_trabajo: string;
  descripcion: string;
  prioridad: "baja" | "media" | "alta" | "urgente";
  adjuntos: any[];
  estado: string;
  fecha_programada_inicio?: string;
  fecha_programada_fin?: string;
  costos_estimado?: number;
  costos_real?: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  clientes?: {
    razon_social?: string;
    nombres?: string;
    apellidos?: string;
  };
  ubicaciones?: {
    alias: string;
    direccion: string;
    lat?: number | null;
    lng?: number | null;
  };
  trabajos?: {
    nombre_trabajo: string;
  };
  proyectos?: {
    nombre: string;
  };
  tareas?: {
    titulo: string;
  };
}

interface FiltrosOT {
  estado?: string;
  prioridad?: string;
  cliente_id?: string;
  tipo_trabajo?: string;
  busqueda?: string;
  page?: number;
  pageSize?: number;
}

interface OrdenesPaginated {
  data: OrdenServicio[];
  total: number;
}

export function useOrdenesServicio(filtros?: FiltrosOT) {
  const page = filtros?.page ?? 1;
  const pageSize = filtros?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  return useQuery<OrdenesPaginated>({
    queryKey: ["ordenes_servicio", filtros],
    queryFn: async () => {
      let query = supabase
        .from("ordenes_servicio")
        .select(
          `
          *,
          clientes (razon_social, nombres, apellidos),
          ubicaciones (alias, direccion, lat, lng),
          trabajos (nombre_trabajo),
          proyectos (nombre),
          tareas (titulo)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (filtros?.estado && filtros.estado !== "todos") {
        query = query.eq("estado", filtros.estado);
      }
      if (filtros?.prioridad && filtros.prioridad !== "todos") {
        query = query.eq("prioridad", filtros.prioridad as any);
      }
      if (filtros?.cliente_id) {
        query = query.eq("cliente_id", filtros.cliente_id);
      }
      if (filtros?.tipo_trabajo && filtros.tipo_trabajo !== "todos") {
        query = query.eq("tipo_trabajo", filtros.tipo_trabajo);
      }
      if (filtros?.busqueda) {
        query = query.or(
          `numero.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`
        );
      }

      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data as OrdenServicio[]) || [], total: count || 0 };
    },
  });
}

export function useCrearOrdenServicio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (nuevaOT: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("ordenes_servicio")
        .insert([{
          cliente_id: nuevaOT.cliente_id,
          ubicacion_id: nuevaOT.ubicacion_id,
          trabajo_id: nuevaOT.trabajo_id || null,
          proyecto_id: nuevaOT.proyecto_id || null,
          fase_id: nuevaOT.fase_id || null,
          tarea_id: nuevaOT.tarea_id || null,
          tipo_trabajo: nuevaOT.tipo_trabajo,
          descripcion: nuevaOT.descripcion,
          prioridad: nuevaOT.prioridad,
          estado: nuevaOT.estado || 'pendiente',
          fecha_programada_inicio: nuevaOT.fecha_programada_inicio,
          fecha_programada_fin: nuevaOT.fecha_programada_fin,
          costos_estimado: nuevaOT.costos_estimado,
          created_by_user_id: user.id,
          // numero lo asigna el trigger auto_generar_numero_ot
        } as any])
        .select()
        .single();


      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_servicio"] });
      toast({
        title: "OT creada",
        description: "La orden de servicio se creó exitosamente",
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

export function useActualizarOrdenServicio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<OrdenServicio> }) => {
      const { data, error } = await supabase
        .from("ordenes_servicio")
        .update(datos)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_servicio"] });
      toast({
        title: "OT actualizada",
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
