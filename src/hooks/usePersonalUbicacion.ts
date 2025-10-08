import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type EstadoApp = "offline" | "online" | "en_ruta" | "en_proceso";

export interface PersonalUbicacion {
  id: string;
  personal_id: string;
  lat: number;
  lng: number;
  precision_m?: number;
  captured_at: string;
  estado_app: EstadoApp;
  created_at: string;
}

export interface TecnicoCercano {
  personal_id: string;
  distancia_km: number;
  lat: number;
  lng: number;
  estado_app: EstadoApp;
  captured_at: string;
}

// Hook para obtener ubicaciones de todo el personal
export function usePersonalUbicaciones() {
  return useQuery({
    queryKey: ["personal_ubicaciones"],
    queryFn: async () => {
      // Obtener la última ubicación de cada personal
      const { data, error } = await supabase
        .from("personal_ubicacion")
        .select("*")
        .order("captured_at", { ascending: false });

      if (error) throw error;

      // Filtrar para obtener solo la última ubicación de cada personal
      const ubicacionesPorPersonal = new Map<string, PersonalUbicacion>();
      (data as PersonalUbicacion[]).forEach((ubicacion) => {
        if (!ubicacionesPorPersonal.has(ubicacion.personal_id)) {
          ubicacionesPorPersonal.set(ubicacion.personal_id, ubicacion);
        }
      });

      return Array.from(ubicacionesPorPersonal.values());
    },
  });
}

// Hook para registrar ubicación del personal
export function useRegistrarUbicacion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      lat,
      lng,
      precision_m,
      estado_app,
    }: {
      lat: number;
      lng: number;
      precision_m?: number;
      estado_app: EstadoApp;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("personal_ubicacion")
        .insert([
          {
            personal_id: user.id,
            lat,
            lng,
            precision_m,
            estado_app,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_ubicaciones"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al registrar ubicación",
        description: error.message,
      });
    },
  });
}

// Hook para obtener técnicos cercanos a una ubicación
export function useTecnicosCercanos(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ["tecnicos_cercanos", lat, lng],
    enabled: !!lat && !!lng,
    queryFn: async () => {
      if (!lat || !lng) return [];

      // Obtener todas las últimas ubicaciones
      const { data: ubicaciones, error } = await supabase
        .from("personal_ubicacion")
        .select("*")
        .order("captured_at", { ascending: false });

      if (error) throw error;

      // Filtrar última ubicación por personal
      const ubicacionesPorPersonal = new Map<string, PersonalUbicacion>();
      (ubicaciones as PersonalUbicacion[]).forEach((ubicacion) => {
        if (!ubicacionesPorPersonal.has(ubicacion.personal_id)) {
          ubicacionesPorPersonal.set(ubicacion.personal_id, ubicacion);
        }
      });

      // Calcular distancias usando Haversine
      const tecnicos: TecnicoCercano[] = [];
      for (const ubicacion of ubicacionesPorPersonal.values()) {
        const { data: distancia, error: distError } = await supabase.rpc(
          "calcular_distancia_haversine",
          {
            lat1: lat,
            lng1: lng,
            lat2: ubicacion.lat,
            lng2: ubicacion.lng,
          }
        );

        if (!distError && distancia !== null) {
          tecnicos.push({
            personal_id: ubicacion.personal_id,
            distancia_km: distancia,
            lat: ubicacion.lat,
            lng: ubicacion.lng,
            estado_app: ubicacion.estado_app,
            captured_at: ubicacion.captured_at,
          });
        }
      }

      // Ordenar por distancia
      return tecnicos.sort((a, b) => a.distancia_km - b.distancia_km);
    },
  });
}
