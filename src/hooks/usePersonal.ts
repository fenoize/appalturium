import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PersonalFicha = Database["public"]["Tables"]["personal_fichas"]["Row"];
type PersonalFichaInsert = Database["public"]["Tables"]["personal_fichas"]["Insert"];
type PersonalFichaUpdate = Database["public"]["Tables"]["personal_fichas"]["Update"];

export interface PersonalConUsuario extends PersonalFicha {
  email?: string;
}

// Hook para obtener todo el personal
export function usePersonal(filtros?: {
  rol_operativo?: string;
  especialidad?: string;
  activo?: boolean;
}) {
  return useQuery({
    queryKey: ["personal", filtros],
    queryFn: async () => {
      let query = supabase
        .from("personal_fichas")
        .select("*")
        .order("nombre_completo", { ascending: true });

      if (filtros?.rol_operativo) {
        query = query.eq("rol_operativo", filtros.rol_operativo as any);
      }

      if (filtros?.especialidad) {
        query = query.contains("especialidad", [filtros.especialidad]);
      }

      if (filtros?.activo !== undefined) {
        query = query.eq("activo", filtros.activo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Retornar datos sin intentar obtener emails (eso requiere API admin)
      return (data || []) as PersonalConUsuario[];
    },
  });
}

// Hook para obtener una ficha específica
export function usePersonalFicha(userId?: string) {
  return useQuery({
    queryKey: ["personal_ficha", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("personal_fichas")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      return data as PersonalConUsuario;
    },
  });
}

// Hook para crear ficha de personal
export function useCrearPersonal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (personal: PersonalFichaInsert) => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .insert([personal])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal"] });
      toast({
        title: "Personal creado",
        description: "La ficha de personal se ha creado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al crear personal",
        description: error.message,
      });
    },
  });
}

// Hook para actualizar ficha de personal
export function useActualizarPersonal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: PersonalFichaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal"] });
      queryClient.invalidateQueries({ queryKey: ["personal_ficha"] });
      toast({
        title: "Personal actualizado",
        description: "La ficha de personal se ha actualizado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar personal",
        description: error.message,
      });
    },
  });
}

// Hook para desactivar personal
export function useDesactivarPersonal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .update({ activo: false, fecha_termino: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal"] });
      toast({
        title: "Personal desactivado",
        description: "El personal ha sido desactivado",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al desactivar personal",
        description: error.message,
      });
    },
  });
}

// Hook para reactivar personal
export function useReactivarPersonal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .update({ activo: true, fecha_termino: null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal"] });
      toast({
        title: "Personal reactivado",
        description: "El personal ha sido reactivado",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al reactivar personal",
        description: error.message,
      });
    },
  });
}

// Hook para obtener especialidades únicas
export function useEspecialidades() {
  return useQuery({
    queryKey: ["especialidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .select("especialidad");

      if (error) throw error;

      // Extraer especialidades únicas
      const especialidadesSet = new Set<string>();
      data.forEach((ficha) => {
        ficha.especialidad?.forEach((esp) => especialidadesSet.add(esp));
      });

      return Array.from(especialidadesSet).sort();
    },
  });
}
