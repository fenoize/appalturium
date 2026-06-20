import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";
import type { FormatoOpcion } from "@/hooks/useCotizacionOpciones";

interface Props {
  cotizacionId: string;
  formato: FormatoOpcion;
  moneda?: string;
}

interface ItemRow {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  item_inventario_id: string | null;
}

interface InvRow {
  id: string;
  categoria_id: string | null;
}

interface CatRow {
  id: string;
  nombre: string;
  categoria_padre_id: string | null;
}

const OTROS = "Servicios y otros";

export function DetalleOpcionAgrupado({ cotizacionId, formato, moneda = "CLP" }: Props) {
  const { data: items } = useQuery({
    queryKey: ["cotizacion_items_detalle", cotizacionId],
    enabled: !!cotizacionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotizacion_items")
        .select("id, tipo, descripcion, cantidad, precio_unitario, subtotal, item_inventario_id")
        .eq("cotizacion_id", cotizacionId)
        .order("orden");
      if (error) throw error;
      return data as ItemRow[];
    },
  });

  const invIds = useMemo(
    () => Array.from(new Set((items ?? []).map((i) => i.item_inventario_id).filter(Boolean) as string[])),
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
      return data as InvRow[];
    },
  });

  const { data: categorias } = useQuery({
    queryKey: ["cat_inv_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_inventario")
        .select("id, nombre, categoria_padre_id");
      if (error) throw error;
      return data as CatRow[];
    },
  });

  const grupos = useMemo(() => {
    if (!items) return [] as { nombre: string; subtotal: number; items: ItemRow[] }[];
    const invMap = new Map((inventario ?? []).map((i) => [i.id, i]));
    const catMap = new Map((categorias ?? []).map((c) => [c.id, c]));

    const groupKey = (it: ItemRow): string => {
      if (!it.item_inventario_id) return OTROS;
      const inv = invMap.get(it.item_inventario_id);
      const catId = inv?.categoria_id ?? null;
      if (!catId) return OTROS;
      const cat = catMap.get(catId);
      if (!cat) return OTROS;
      if (formato === "items_por_categoria_padre") {
        const padre = cat.categoria_padre_id ? catMap.get(cat.categoria_padre_id) : null;
        return (padre?.nombre ?? cat.nombre) || OTROS;
      }
      return cat.nombre || OTROS;
    };

    const map = new Map<string, { nombre: string; subtotal: number; items: ItemRow[] }>();
    for (const it of items) {
      const key = groupKey(it);
      const g = map.get(key) ?? { nombre: key, subtotal: 0, items: [] };
      g.subtotal += Number(it.subtotal) || 0;
      g.items.push(it);
      map.set(key, g);
    }
    // OTROS al final
    return Array.from(map.values()).sort((a, b) =>
      a.nombre === OTROS ? 1 : b.nombre === OTROS ? -1 : a.nombre.localeCompare(b.nombre)
    );
  }, [items, inventario, categorias, formato]);

  if (!items) return <p className="text-sm text-muted-foreground">Cargando detalle…</p>;
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Sin items en la cotización.</p>;

  const soloCategorias = formato === "categorias";

  return (
    <div className="space-y-3 text-sm">
      {grupos.map((g) => (
        <div key={g.nombre} className="border rounded-md p-2">
          <div className="flex justify-between font-medium">
            <span>{g.nombre}</span>
            <span>{formatCurrency(g.subtotal, moneda as any)}</span>
          </div>
          {!soloCategorias && (
            <ul className="mt-2 space-y-1">
              {g.items.map((it) => (
                <li key={it.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2">
                    {it.cantidad} × {it.descripcion}
                  </span>
                  <span>{formatCurrency(Number(it.subtotal) || 0, moneda as any)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
