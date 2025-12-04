import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ItemInventario {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: "material" | "producto" | "servicio";
  categoria_id: string | null;
  proveedor_id: string | null;
  unidad_medida: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  ubicacion_bodega: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: { id: string; nombre: string; color: string } | null;
  proveedor?: { id: string; razon_social: string } | null;
}

export interface CategoriaInventario {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  activa: boolean;
}

export interface MovimientoInventario {
  id: string;
  item_id: string;
  tipo: "entrada" | "salida" | "ajuste" | "transferencia";
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  costo_unitario: number | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  notas: string | null;
  registrado_por: string;
  created_at: string;
  item?: { codigo: string; nombre: string } | null;
}

export function useInventario() {
  return useQuery({
    queryKey: ["inventario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario")
        .select(`
          *,
          categoria:categorias_inventario(id, nombre, color),
          proveedor:proveedores(id, razon_social)
        `)
        .order("nombre");

      if (error) throw error;
      return data as ItemInventario[];
    },
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias_inventario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_inventario")
        .select("*")
        .eq("activa", true)
        .order("nombre");

      if (error) throw error;
      return data as CategoriaInventario[];
    },
  });
}

export function useMovimientos(itemId?: string) {
  return useQuery({
    queryKey: ["movimientos_inventario", itemId],
    queryFn: async () => {
      let query = supabase
        .from("movimientos_inventario")
        .select(`
          *,
          item:inventario(codigo, nombre)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MovimientoInventario[];
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ItemInventario, "id" | "created_at" | "updated_at" | "categoria" | "proveedor">) => {
      const { data, error } = await supabase
        .from("inventario")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast({ title: "Item creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<ItemInventario> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventario")
        .update(item)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast({ title: "Item actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventario")
        .update({ activo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast({ title: "Item eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movimiento: Omit<MovimientoInventario, "id" | "created_at" | "item">) => {
      const { data, error } = await supabase
        .from("movimientos_inventario")
        .insert(movimiento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos_inventario"] });
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

export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoria: Omit<CategoriaInventario, "id">) => {
      const { data, error } = await supabase
        .from("categorias_inventario")
        .insert(categoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias_inventario"] });
      toast({ title: "Categoría creada exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear categoría",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
