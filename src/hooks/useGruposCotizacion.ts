import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormatoOpcion } from "@/hooks/useCotizacionOpciones";

export interface CotItemRow {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  subtotal: number;
  item_inventario_id: string | null;
}

export interface GrupoCotizacion {
  nombre: string;
  subtotal: number;
  items: CotItemRow[];
}

export const GRUPO_OTROS = "Servicios y otros";

export function useGruposCotizacion(cotizacionId: string | undefined, formato: FormatoOpcion) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["cotizacion_items_detalle", cotizacionId],
    enabled: !!cotizacionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotizacion_items")
        .select("id, tipo, descripcion, cantidad, precio_unitario, descuento_pct, subtotal, item_inventario_id")
        .eq("cotizacion_id", cotizacionId!)
        .order("orden");
      if (error) throw error;
      return data as CotItemRow[];
    },
  });

  const invIds = useMemo(
    () =>
      Array.from(
        new Set((items ?? []).map((i) => i.item_inventario_id).filter(Boolean) as string[])
      ),
    [items]
  );

  const { data: inventario } = useQuery({
    queryKey: ["inv_cat_lookup", invIds],
    enabled: invIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario")
        .select("id, categoria_id")
        .in("id", invIds);
      if (error) throw error;
      return data as { id: string; categoria_id: string | null }[];
    },
  });

  const { data: categorias } = useQuery({
    queryKey: ["cat_inv_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_inventario")
        .select("id, nombre, categoria_padre_id");
      if (error) throw error;
      return data as { id: string; nombre: string; categoria_padre_id: string | null }[];
    },
  });

  const grupos = useMemo<GrupoCotizacion[]>(() => {
    if (!items) return [];
    const invMap = new Map((inventario ?? []).map((i) => [i.id, i]));
    const catMap = new Map((categorias ?? []).map((c) => [c.id, c]));

    const groupKey = (it: CotItemRow): string => {
      if (!it.item_inventario_id) return GRUPO_OTROS;
      const inv = invMap.get(it.item_inventario_id);
      const catId = inv?.categoria_id ?? null;
      if (!catId) return GRUPO_OTROS;
      const cat = catMap.get(catId);
      if (!cat) return GRUPO_OTROS;
      if (formato === "items_por_categoria_padre") {
        const padre = cat.categoria_padre_id ? catMap.get(cat.categoria_padre_id) : null;
        return (padre?.nombre ?? cat.nombre) || GRUPO_OTROS;
      }
      return cat.nombre || GRUPO_OTROS;
    };

    const map = new Map<string, GrupoCotizacion>();
    for (const it of items) {
      const key = groupKey(it);
      const g = map.get(key) ?? { nombre: key, subtotal: 0, items: [] };
      g.subtotal += Number(it.subtotal) || 0;
      g.items.push(it);
      map.set(key, g);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.nombre === GRUPO_OTROS ? 1 : b.nombre === GRUPO_OTROS ? -1 : a.nombre.localeCompare(b.nombre)
    );
  }, [items, inventario, categorias, formato]);

  return { items, grupos, isLoading };
}
