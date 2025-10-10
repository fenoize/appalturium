import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrdenServicio {
  id: string;
  numero: string;
  cliente_id: string;
  ubicacion_id: string;
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
  };
}

interface FiltrosOT {
  estado?: string;
  prioridad?: string;
  cliente_id?: string;
  tipo_trabajo?: string;
  busqueda?: string;
}

export function useOrdenesServicio(filtros?: FiltrosOT) {
  return useQuery({
    queryKey: ["ordenes_servicio", filtros],
    queryFn: async () => {
      let query = supabase
        .from("ordenes_servicio")
        .select(`
          *,
          clientes (razon_social, nombres, apellidos),
          ubicaciones (alias, direccion)
        `)
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
        query = query.or(`numero.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OrdenServicio[];
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
          tipo_trabajo: nuevaOT.tipo_trabajo,
          descripcion: nuevaOT.descripcion,
          prioridad: nuevaOT.prioridad,
          estado: nuevaOT.estado || 'draft',
          fecha_programada_inicio: nuevaOT.fecha_programada_inicio,
          fecha_programada_fin: nuevaOT.fecha_programada_fin,
          costos_estimado: nuevaOT.costos_estimado,
          created_by_user_id: user.id, 
          numero: '' 
        }])
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
