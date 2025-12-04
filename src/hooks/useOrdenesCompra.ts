import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type EstadoOrdenCompra = Database["public"]["Enums"]["estado_orden_compra"];
type TipoMoneda = Database["public"]["Enums"]["tipo_moneda"];

export interface OrdenCompra {
  id: string;
  numero: string;
  proveedor_id: string;
  estado: EstadoOrdenCompra;
  fecha_emision: string;
  fecha_entrega_esperada: string | null;
  fecha_recepcion: string | null;
  subtotal: number;
  impuestos: number;
  total: number;
  moneda: TipoMoneda;
  notas: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  proveedor?: { id: string; razon_social: string; rut: string } | null;
  items?: ItemOrdenCompra[];
}

export interface ItemOrdenCompra {
  id: string;
  orden_id: string;
  item_id: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
  item?: { id: string; codigo: string; nombre: string; unidad_medida: string } | null;
}

export function useOrdenesCompra() {
  return useQuery({
    queryKey: ["ordenes_compra"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes_compra")
        .select(`
          *,
          proveedor:proveedores(id, razon_social, rut)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrdenCompra[];
    },
  });
}

export function useOrdenCompra(id: string | undefined) {
  return useQuery({
    queryKey: ["orden_compra", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: orden, error: ordenError } = await supabase
        .from("ordenes_compra")
        .select(`
          *,
          proveedor:proveedores(id, razon_social, rut)
        `)
        .eq("id", id)
        .maybeSingle();

      if (ordenError) throw ordenError;
      if (!orden) return null;

      const { data: items, error: itemsError } = await supabase
        .from("items_orden_compra")
        .select(`
          *,
          item:inventario(id, codigo, nombre, unidad_medida)
        `)
        .eq("orden_id", id);

      if (itemsError) throw itemsError;

      return { ...orden, items } as OrdenCompra;
    },
    enabled: !!id,
  });
}

export function useCreateOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orden,
      items,
    }: {
      orden: Omit<OrdenCompra, "id" | "created_at" | "updated_at" | "proveedor" | "items">;
      items: Omit<ItemOrdenCompra, "id" | "orden_id" | "created_at" | "item">[];
    }) => {
      // Generar número de OC
      const { data: numeroData, error: numeroError } = await supabase.rpc("generar_numero_oc");
      if (numeroError) throw numeroError;

      const { data: ordenData, error: ordenError } = await supabase
        .from("ordenes_compra")
        .insert({ ...orden, numero: numeroData })
        .select()
        .single();

      if (ordenError) throw ordenError;

      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          orden_id: ordenData.id,
        }));

        const { error: itemsError } = await supabase
          .from("items_orden_compra")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return ordenData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast({ title: "Orden de compra creada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear orden de compra",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...orden }: Partial<OrdenCompra> & { id: string }) => {
      const { data, error } = await supabase
        .from("ordenes_compra")
        .update(orden)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast({ title: "Orden de compra actualizada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar orden de compra",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRecibirOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ordenId,
      items,
      userId,
    }: {
      ordenId: string;
      items: { itemId: string; cantidadRecibida: number; inventarioId: string }[];
      userId: string;
    }) => {
      // Actualizar items de la orden
      for (const item of items) {
        const { error: itemError } = await supabase
          .from("items_orden_compra")
          .update({ cantidad_recibida: item.cantidadRecibida })
          .eq("id", item.itemId);

        if (itemError) throw itemError;

        // Obtener stock actual
        const { data: inventarioItem, error: inventarioError } = await supabase
          .from("inventario")
          .select("stock_actual, precio_compra")
          .eq("id", item.inventarioId)
          .single();

        if (inventarioError) throw inventarioError;

        // Crear movimiento de entrada
        const { error: movError } = await supabase
          .from("movimientos_inventario")
          .insert({
            item_id: item.inventarioId,
            tipo: "entrada",
            cantidad: item.cantidadRecibida,
            stock_anterior: inventarioItem.stock_actual,
            stock_nuevo: inventarioItem.stock_actual + item.cantidadRecibida,
            costo_unitario: inventarioItem.precio_compra,
            referencia_tipo: "orden_compra",
            referencia_id: ordenId,
            registrado_por: userId,
          });

        if (movError) throw movError;
      }

      // Verificar si todas las cantidades fueron recibidas
      const { data: itemsOrden, error: itemsError } = await supabase
        .from("items_orden_compra")
        .select("cantidad_solicitada, cantidad_recibida")
        .eq("orden_id", ordenId);

      if (itemsError) throw itemsError;

      const todoRecibido = itemsOrden.every(
        (i) => i.cantidad_recibida >= i.cantidad_solicitada
      );
      const parcialRecibido = itemsOrden.some((i) => i.cantidad_recibida > 0);

      let nuevoEstado: EstadoOrdenCompra = "enviada";
      if (todoRecibido) {
        nuevoEstado = "completada";
      } else if (parcialRecibido) {
        nuevoEstado = "parcial";
      }

      const { error: ordenError } = await supabase
        .from("ordenes_compra")
        .update({
          estado: nuevoEstado,
          fecha_recepcion: todoRecibido ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", ordenId);

      if (ordenError) throw ordenError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_compra"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos_inventario"] });
      toast({ title: "Recepción registrada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar recepción",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
