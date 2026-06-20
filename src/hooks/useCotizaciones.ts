import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EstadoCotizacion = "borrador" | "en_revision" | "aceptada" | "rechazada" | "asignada_ot";
export type TipoMoneda = "CLP" | "UF" | "USD";
export type TipoItemCotizacion = "producto" | "servicio" | "personalizado";

export interface CotizacionItem {
  id?: string;
  cotizacion_id?: string;
  tipo: TipoItemCotizacion;
  item_inventario_id?: string | null;
  servicio_id?: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  subtotal: number;
  orden: number;
}

export interface Cotizacion {
  id: string;
  numero: string;
  cliente_id: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  validez_dias: number;
  estado: EstadoCotizacion;
  moneda: TipoMoneda;
  subtotal: number;
  impuestos: number;
  total: number;
  notas: string | null;
  condiciones: string | null;
  token_acceso: string | null;
  aceptada_por_nombre: string | null;
  aceptada_por_email: string | null;
  aceptada_ts: string | null;
  rechazada_ts: string | null;
  rechazo_motivo: string | null;
  ot_id: string | null;
  solicitud_cotizacion_id?: string | null;
  ubicacion_id?: string | null;
  ubicacion?: { id: string; alias: string | null; direccion: string | null; comuna: string | null } | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  cliente?: {
    id: string;
    razon_social: string | null;
    nombres: string | null;
    apellidos: string | null;
    rut: string;
    email: string | null;
    tipo: string;
  } | null;
  items?: CotizacionItem[];
  orden_servicio?: {
    id: string;
    numero: string;
  } | null;
}

export interface CotizacionInput {
  cliente_id?: string | null;
  fecha_emision?: string;
  validez_dias?: number;
  estado?: EstadoCotizacion;
  moneda?: TipoMoneda;
  subtotal?: number;
  impuestos?: number;
  total?: number;
  notas?: string | null;
  condiciones?: string | null;
  solicitud_cotizacion_id?: string | null;
  ubicacion_id?: string | null;
}


// Calcular subtotal de un item
export function calcularSubtotalItem(cantidad: number, precio_unitario: number, descuento_pct: number): number {
  const subtotalBruto = cantidad * precio_unitario;
  const descuento = subtotalBruto * (descuento_pct / 100);
  return Math.round((subtotalBruto - descuento) * 100) / 100;
}

// Calcular totales de cotización
export function calcularTotalesCotizacion(
  items: CotizacionItem[],
  ivaPct: number = 0.19
): { subtotal: number; impuestos: number; total: number } {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const impuestos = Math.round(subtotal * ivaPct * 100) / 100;
  const total = subtotal + impuestos;
  return { subtotal, impuestos, total };
}

// Generar token único para acceso público
function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

/**
 * Obtiene la tasa de IVA desde parametros_sistema (categoria='tax_config', key='iva').
 * El valor puede estar guardado como número (0.19) o como porcentaje (19) en el
 * campo `descripcion` (jsonb) bajo la clave `value`. Fallback: 0.19.
 */
async function obtenerIvaPct(): Promise<number> {
  const { data } = await supabase
    .from("parametros_sistema")
    .select("descripcion")
    .eq("categoria", "tax_config")
    .eq("key", "iva")
    .eq("activo", true)
    .maybeSingle();

  const raw = (data?.descripcion as any)?.value;
  const num = typeof raw === "number" ? raw : parseFloat(raw);
  if (!isFinite(num) || num <= 0) return 0.19;
  return num > 1 ? num / 100 : num;
}


export function useCotizaciones(filtros?: { estado?: EstadoCotizacion; clienteId?: string }) {
  return useQuery({
    queryKey: ["cotizaciones", filtros],
    queryFn: async () => {
      let query = supabase
        .from("cotizaciones")
        .select(`
          *,
          cliente:clientes(id, razon_social, nombres, apellidos, rut, email, tipo),
          orden_servicio:ordenes_servicio(id, numero)
        `)
        .order("created_at", { ascending: false });

      if (filtros?.estado) {
        query = query.eq("estado", filtros.estado);
      }
      if (filtros?.clienteId) {
        query = query.eq("cliente_id", filtros.clienteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cotizacion[];
    },
  });
}

export function useCotizacion(id: string | undefined) {
  return useQuery({
    queryKey: ["cotizacion", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: cotizacion, error: cotError } = await supabase
        .from("cotizaciones")
        .select(`
          *,
          cliente:clientes(id, razon_social, nombres, apellidos, rut, email, tipo),
          orden_servicio:ordenes_servicio(id, numero)
        `)
        .eq("id", id)
        .maybeSingle();

      if (cotError) throw cotError;
      if (!cotizacion) return null;

      const { data: items, error: itemsError } = await supabase
        .from("cotizacion_items")
        .select("*")
        .eq("cotizacion_id", id)
        .order("orden");

      if (itemsError) throw itemsError;

      return { ...cotizacion, items } as Cotizacion;
    },
    enabled: !!id,
  });
}

export function useCrearCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cotizacion: CotizacionInput; items: CotizacionItem[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      // Generar número de cotización
      const { data: numeroData, error: numeroError } = await supabase
        .rpc("generar_numero_cotizacion");
      
      if (numeroError) throw numeroError;

      const ivaPct = await obtenerIvaPct();
      const totales = calcularTotalesCotizacion(data.items, ivaPct);
      const token = generateToken();
      const fechaEmision = data.cotizacion.fecha_emision || new Date().toISOString();
      const validezDias = data.cotizacion.validez_dias || 30;


      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + validezDias);

      // Crear cotización
      const { data: cotizacion, error: cotError } = await supabase
        .from("cotizaciones")
        .insert({
          ...data.cotizacion,
          numero: numeroData,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento.toISOString(),
          validez_dias: validezDias,
          subtotal: totales.subtotal,
          impuestos: totales.impuestos,
          total: totales.total,
          token_acceso: token,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (cotError) throw cotError;

      // Crear items
      if (data.items.length > 0) {
        const itemsConCotizacion = data.items.map((item, index) => ({
          cotizacion_id: cotizacion.id,
          tipo: item.tipo,
          item_inventario_id: item.item_inventario_id || null,
          servicio_id: item.servicio_id || null,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_pct: item.descuento_pct,
          subtotal: item.subtotal,
          orden: index,
        }));

        const { error: itemsError } = await supabase
          .from("cotizacion_items")
          .insert(itemsConCotizacion);

        if (itemsError) throw itemsError;
      }

      return cotizacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      toast({ title: "Cotización creada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear cotización",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActualizarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; cotizacion: Partial<CotizacionInput>; items?: CotizacionItem[] }) => {
      let updateData: any = { ...data.cotizacion };

      // Si hay items, recalcular totales
      if (data.items) {
        const ivaPct = await obtenerIvaPct();
        const totales = calcularTotalesCotizacion(data.items, ivaPct);

        updateData = {
          ...updateData,
          subtotal: totales.subtotal,
          impuestos: totales.impuestos,
          total: totales.total,
        };

        // Eliminar items existentes
        const { error: deleteError } = await supabase
          .from("cotizacion_items")
          .delete()
          .eq("cotizacion_id", data.id);

        if (deleteError) throw deleteError;

        // Insertar nuevos items
        if (data.items.length > 0) {
          const itemsConCotizacion = data.items.map((item, index) => ({
            cotizacion_id: data.id,
            tipo: item.tipo,
            item_inventario_id: item.item_inventario_id || null,
            servicio_id: item.servicio_id || null,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento_pct: item.descuento_pct,
            subtotal: item.subtotal,
            orden: index,
          }));

          const { error: itemsError } = await supabase
            .from("cotizacion_items")
            .insert(itemsConCotizacion);

          if (itemsError) throw itemsError;
        }
      }

      // Actualizar cotización
      const { data: cotizacion, error } = await supabase
        .from("cotizaciones")
        .update(updateData)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return cotizacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion"] });
      toast({ title: "Cotización actualizada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar cotización",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCambiarEstadoCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      id: string; 
      estado: EstadoCotizacion;
      aceptada_por_nombre?: string;
      aceptada_por_email?: string;
      rechazo_motivo?: string;
    }) => {
      const updateData: any = { estado: data.estado };

      if (data.estado === 'aceptada') {
        updateData.aceptada_ts = new Date().toISOString();
        updateData.aceptada_por_nombre = data.aceptada_por_nombre;
        updateData.aceptada_por_email = data.aceptada_por_email;
      } else if (data.estado === 'rechazada') {
        updateData.rechazada_ts = new Date().toISOString();
        updateData.rechazo_motivo = data.rechazo_motivo;
      }

      const { data: cotizacion, error } = await supabase
        .from("cotizaciones")
        .update(updateData)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return cotizacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion"] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones_pendientes"] });
      toast({ title: "Estado actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAsignarOTaCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cotizacionId: string; otId: string }) => {
      const { data: cotizacion, error } = await supabase
        .from("cotizaciones")
        .update({ 
          ot_id: data.otId, 
          estado: 'asignada_ot' as EstadoCotizacion
        })
        .eq("id", data.cotizacionId)
        .select()
        .single();

      if (error) throw error;
      return cotizacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion"] });
      toast({ title: "Cotización asignada a OT exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al asignar OT",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEliminarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cotizaciones")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      toast({ title: "Cotización eliminada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar cotización",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para obtener cotizaciones aceptadas sin pagar (para finanzas)
export function useCotizacionesPendientesPago() {
  return useQuery({
    queryKey: ["cotizaciones_pendientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select(`
          *,
          cliente:clientes(id, razon_social, nombres, apellidos, rut, email, tipo)
        `)
        .in("estado", ["aceptada", "asignada_ot"])
        .order("aceptada_ts", { ascending: false });

      if (error) throw error;
      return data as Cotizacion[];
    },
  });
}
