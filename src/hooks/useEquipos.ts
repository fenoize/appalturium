import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Equipo {
  id: string;
  codigo_qr: string;
  item_inventario_id: string | null;
  numero_serie: string | null;
  modelo: string | null;
  marca: string | null;
  descripcion: string | null;
  fecha_compra: string | null;
  fecha_garantia_fin: string | null;
  proveedor_id: string | null;
  costo_adquisicion: number | null;
  estado: "en_bodega" | "asignado_tecnico" | "instalado" | "en_mantenimiento" | "dado_de_baja";
  ubicacion_actual: string | null;
  tecnico_asignado_id: string | null;
  cliente_id: string | null;
  ubicacion_cliente_id: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  proveedor?: { id: string; razon_social: string } | null;
  cliente?: { id: string; razon_social: string | null; nombres: string | null; apellidos: string | null } | null;
  tecnico?: { id: string; nombre_completo: string } | null;
}

export interface EquipoMovimiento {
  id: string;
  equipo_id: string;
  tipo: string;
  fecha: string;
  ubicacion_origen: string | null;
  ubicacion_destino: string | null;
  tecnico_id: string | null;
  cliente_id: string | null;
  ot_id: string | null;
  notas: string | null;
  registrado_por: string;
  created_at: string;
  tecnico?: { id: string; nombre_completo: string } | null;
  cliente?: { id: string; razon_social: string | null; nombres: string | null } | null;
}

export interface EquipoIntervencion {
  id: string;
  equipo_id: string;
  tipo: "instalacion" | "mantenimiento_preventivo" | "mantenimiento_correctivo" | "cambio_equipo" | "retiro";
  fecha: string;
  tecnico_id: string | null;
  ot_id: string | null;
  descripcion: string;
  observaciones: string | null;
  estado_antes: string | null;
  estado_despues: string | null;
  evidencias_urls: string[] | null;
  registrado_por: string;
  created_at: string;
  tecnico?: { id: string; nombre_completo: string } | null;
}

export interface EquipoMaterial {
  id: string;
  equipo_id: string;
  item_inventario_id: string;
  cantidad: number;
  notas: string | null;
  fecha_asociacion: string;
  activo: boolean;
  item?: { id: string; codigo: string; nombre: string; unidad_medida: string | null } | null;
}

// Hook para obtener todos los equipos
export function useEquipos() {
  return useQuery({
    queryKey: ["equipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select(`
          *,
          proveedor:proveedores(id, razon_social),
          cliente:clientes(id, razon_social, nombres, apellidos),
          tecnico:personal_fichas!equipos_tecnico_asignado_id_fkey(id, nombre_completo)
        `)
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Equipo[];
    },
  });
}

// Hook para obtener un equipo por ID
export function useEquipo(id: string | undefined) {
  return useQuery({
    queryKey: ["equipo", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("equipos")
        .select(`
          *,
          proveedor:proveedores(id, razon_social),
          cliente:clientes(id, razon_social, nombres, apellidos),
          tecnico:personal_fichas!equipos_tecnico_asignado_id_fkey(id, nombre_completo)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Equipo;
    },
    enabled: !!id,
  });
}

// Hook para obtener equipo por código QR
export function useEquipoPorCodigo(codigo: string | undefined) {
  return useQuery({
    queryKey: ["equipo-codigo", codigo],
    queryFn: async () => {
      if (!codigo) return null;
      const { data, error } = await supabase
        .from("equipos")
        .select(`
          *,
          proveedor:proveedores(id, razon_social),
          cliente:clientes(id, razon_social, nombres, apellidos),
          tecnico:personal_fichas!equipos_tecnico_asignado_id_fkey(id, nombre_completo)
        `)
        .eq("codigo_qr", codigo)
        .single();

      if (error) throw error;
      return data as Equipo;
    },
    enabled: !!codigo,
  });
}

// Hook para obtener movimientos de un equipo
export function useEquipoMovimientos(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["equipo-movimientos", equipoId],
    queryFn: async () => {
      if (!equipoId) return [];
      const { data, error } = await supabase
        .from("equipos_movimientos")
        .select(`
          *,
          tecnico:personal_fichas(id, nombre_completo),
          cliente:clientes(id, razon_social, nombres)
        `)
        .eq("equipo_id", equipoId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data as EquipoMovimiento[];
    },
    enabled: !!equipoId,
  });
}

// Hook para obtener intervenciones de un equipo
export function useEquipoIntervenciones(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["equipo-intervenciones", equipoId],
    queryFn: async () => {
      if (!equipoId) return [];
      const { data, error } = await supabase
        .from("equipos_intervenciones")
        .select(`
          *,
          tecnico:personal_fichas(id, nombre_completo)
        `)
        .eq("equipo_id", equipoId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data as EquipoIntervencion[];
    },
    enabled: !!equipoId,
  });
}

// Hook para obtener materiales de un equipo
export function useEquipoMateriales(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["equipo-materiales", equipoId],
    queryFn: async () => {
      if (!equipoId) return [];
      const { data, error } = await supabase
        .from("equipos_materiales")
        .select(`
          *,
          item:inventario(id, codigo, nombre, unidad_medida)
        `)
        .eq("equipo_id", equipoId)
        .eq("activo", true)
        .order("fecha_asociacion", { ascending: false });

      if (error) throw error;
      return data as EquipoMaterial[];
    },
    enabled: !!equipoId,
  });
}

// Generar código único
export async function generarCodigoEquipo(): Promise<string> {
  const { data, error } = await supabase.rpc("generar_codigo_equipo");
  if (error) throw error;
  return data as string;
}

// Crear equipo
export function useCreateEquipo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipo: Omit<Equipo, "id" | "created_at" | "updated_at" | "proveedor" | "cliente" | "tecnico">) => {
      const { data, error } = await supabase
        .from("equipos")
        .insert(equipo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({ title: "Equipo creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear equipo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Actualizar equipo
export function useUpdateEquipo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...equipo }: Partial<Equipo> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipos")
        .update(equipo)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      queryClient.invalidateQueries({ queryKey: ["equipo", variables.id] });
      toast({ title: "Equipo actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar equipo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Registrar movimiento
export function useCreateMovimientoEquipo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movimiento: Omit<EquipoMovimiento, "id" | "created_at" | "tecnico" | "cliente">) => {
      const { data, error } = await supabase
        .from("equipos_movimientos")
        .insert(movimiento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipo-movimientos", variables.equipo_id] });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({ title: "Movimiento registrado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar movimiento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Registrar intervención
export function useCreateIntervencionEquipo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intervencion: Omit<EquipoIntervencion, "id" | "created_at" | "tecnico">) => {
      const { data, error } = await supabase
        .from("equipos_intervenciones")
        .insert(intervencion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipo-intervenciones", variables.equipo_id] });
      toast({ title: "Intervención registrada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar intervención",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Gestionar materiales del equipo
export function useAddMaterialEquipo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (material: Omit<EquipoMaterial, "id" | "created_at" | "updated_at" | "item">) => {
      const { data, error } = await supabase
        .from("equipos_materiales")
        .insert(material)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipo-materiales", variables.equipo_id] });
      toast({ title: "Material agregado al equipo" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al agregar material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveMaterialEquipo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, equipo_id }: { id: string; equipo_id: string }) => {
      const { error } = await supabase
        .from("equipos_materiales")
        .update({ activo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipo-materiales", variables.equipo_id] });
      toast({ title: "Material removido del equipo" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al remover material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Utilidades
export const estadoEquipoLabels: Record<string, string> = {
  en_bodega: "En Bodega",
  asignado_tecnico: "Asignado a Técnico",
  instalado: "Instalado",
  en_mantenimiento: "En Mantenimiento",
  dado_de_baja: "Dado de Baja",
};

export const tipoIntervencionLabels: Record<string, string> = {
  instalacion: "Instalación",
  mantenimiento_preventivo: "Mantenimiento Preventivo",
  mantenimiento_correctivo: "Mantenimiento Correctivo",
  cambio_equipo: "Cambio de Equipo",
  retiro: "Retiro",
};

export const tipoMovimientoLabels: Record<string, string> = {
  compra: "Compra",
  almacenamiento: "Almacenamiento",
  asignacion_tecnico: "Asignación a Técnico",
  instalacion_cliente: "Instalación en Cliente",
  retiro: "Retiro de Cliente",
};
