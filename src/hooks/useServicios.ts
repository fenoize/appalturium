import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EstadoServicio = "activo" | "pausado" | "cancelado" | "finalizado";
export type TipoServicio = "mantencion" | "consultoria" | "soporte" | "desarrollo" | "instalacion" | "capacitacion" | "otro";
export type FrecuenciaFacturacion = "unico" | "mensual" | "trimestral" | "semestral" | "anual";
export type TipoMoneda = "CLP" | "UF" | "USD";

export interface Servicio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoServicio;
  proveedor_id: string | null;
  proyecto_id: string | null;
  estado: EstadoServicio;
  numero_contrato: string | null;
  fecha_inicio_contrato: string | null;
  fecha_fin_contrato: string | null;
  renovacion_automatica: boolean;
  frecuencia_facturacion: FrecuenciaFacturacion;
  monto_base: number;
  moneda: TipoMoneda;
  sla_tiempo_respuesta_horas: number | null;
  sla_tiempo_resolucion_horas: number | null;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  notas: string | null;
  etiquetas: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Joined data
  proveedor?: {
    id: string;
    razon_social: string;
    nombre_fantasia: string | null;
  } | null;
  proyecto?: {
    id: string;
    nombre: string;
  } | null;
}

export interface ServicioInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoServicio;
  proveedor_id?: string | null;
  proyecto_id?: string | null;
  estado?: EstadoServicio;
  numero_contrato?: string | null;
  fecha_inicio_contrato?: string | null;
  fecha_fin_contrato?: string | null;
  renovacion_automatica?: boolean;
  frecuencia_facturacion?: FrecuenciaFacturacion;
  monto_base?: number;
  moneda?: TipoMoneda;
  sla_tiempo_respuesta_horas?: number | null;
  sla_tiempo_resolucion_horas?: number | null;
  contacto_nombre?: string | null;
  contacto_email?: string | null;
  contacto_telefono?: string | null;
  notas?: string | null;
  etiquetas?: string[];
}

export function useServicios() {
  return useQuery({
    queryKey: ["servicios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select(`
          *,
          proveedor:proveedores(id, razon_social, nombre_fantasia),
          proyecto:proyectos(id, nombre)
        `)
        .order("nombre");

      if (error) throw error;
      return data as Servicio[];
    },
  });
}

export function useServicio(id: string | undefined) {
  return useQuery({
    queryKey: ["servicio", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("servicios")
        .select(`
          *,
          proveedor:proveedores(id, razon_social, nombre_fantasia),
          proyecto:proyectos(id, nombre)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Servicio | null;
    },
    enabled: !!id,
  });
}

export function useCrearServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (servicio: ServicioInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("servicios")
        .insert({ ...servicio, created_by: userData.user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Servicio creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear servicio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActualizarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...servicio }: Partial<ServicioInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("servicios")
        .update(servicio)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Servicio actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar servicio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEliminarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("servicios")
        .update({ activo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Servicio eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar servicio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
