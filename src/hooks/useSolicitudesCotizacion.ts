import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EstadoSolicitud =
  | "nueva"
  | "en_presupuesto"
  | "cotizada"
  | "negociacion"
  | "aceptada"
  | "cerrada_sin_acuerdo";

export interface SolicitudCotizacion {
  id: string;
  numero: string;
  cliente_id: string;
  ubicacion_id: string | null;
  ejecutivo_id: string;
  tipo_servicio: string | null;
  descripcion_necesidad: string;
  detalle_requerimiento: Record<string, unknown>;
  fecha_visita_tecnica: string | null;
  archivos_adjuntos: unknown[];
  estado: EstadoSolicitud;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: string;
    razon_social: string | null;
    nombres: string | null;
    apellidos: string | null;
    rut: string;
  } | null;
}

// Cast helper to avoid type lag until types.ts is regenerated.
const sb = supabase as unknown as ReturnType<typeof getClient>;
function getClient() {
  return supabase as unknown as {
    from: (t: string) => ReturnType<typeof supabase.from>;
  };
}

export function useSolicitudesCotizacion() {
  return useQuery({
    queryKey: ["solicitudes_cotizacion"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("solicitudes_cotizacion")
        .select(
          `*, cliente:clientes(id, razon_social, nombres, apellidos, rut)`
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SolicitudCotizacion[];
    },
  });
}

export interface CrearSolicitudInput {
  cliente_id: string;
  ubicacion_id?: string | null;
  tipo_servicio?: string | null;
  descripcion_necesidad: string;
  detalle_requerimiento?: Record<string, unknown>;
  fecha_visita_tecnica?: string | null;
  archivos_adjuntos?: unknown[];
  estado?: EstadoSolicitud;
}

export function useCrearSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CrearSolicitudInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("No autenticado");
      const payload = {
        ...input,
        ejecutivo_id: user.id,
        detalle_requerimiento: input.detalle_requerimiento ?? {},
        archivos_adjuntos: input.archivos_adjuntos ?? [],
        estado: input.estado ?? "nueva",
      };
      const { data, error } = await (supabase as any)
        .from("solicitudes_cotizacion")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SolicitudCotizacion;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitudes_cotizacion"] });
      toast({ title: "Solicitud creada", description: "Se registró la solicitud de cotización." });
    },
    onError: (e: any) =>
      toast({
        title: "Error al crear solicitud",
        description: e?.message ?? "Intenta nuevamente",
        variant: "destructive",
      }),
  });
}

export const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  nueva: "Nueva",
  en_presupuesto: "En presupuesto",
  cotizada: "Cotizada",
  negociacion: "Negociación",
  aceptada: "Aceptada",
  cerrada_sin_acuerdo: "Cerrada sin acuerdo",
};
