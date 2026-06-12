import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type TipoLineaCosto = "insumo" | "mano_obra" | "otro";

export interface LineaCosto {
  tipo: TipoLineaCosto;
  concepto: string;
  cantidad: number;
  costo_unit: number;
  subtotal: number;
  proveedor?: string | null;
  item_inventario_id?: string | null;
}

export interface PresupuestoInterno {
  id: string;
  cotizacion_id: string | null;
  ot_id: string | null;
  items: LineaCosto[];
  insumos: number;
  mano_obra: number;
  otros_costos: number;
  costo_total: number;
  margen_pct: number;
  precio_venta_sugerido: number;
  moneda: "CLP" | "UF" | "USD";
  estado: "borrador" | "enviado" | "aprobado" | "rechazado";
  created_at: string;
  updated_at: string;
}

export function calcularTotalesCosto(items: LineaCosto[]) {
  const insumos = items.filter(i => i.tipo === "insumo").reduce((s, i) => s + (i.subtotal || 0), 0);
  const mano_obra = items.filter(i => i.tipo === "mano_obra").reduce((s, i) => s + (i.subtotal || 0), 0);
  const otros_costos = items.filter(i => i.tipo === "otro").reduce((s, i) => s + (i.subtotal || 0), 0);
  return {
    insumos: Math.round(insumos * 100) / 100,
    mano_obra: Math.round(mano_obra * 100) / 100,
    otros_costos: Math.round(otros_costos * 100) / 100,
  };
}

export function usePresupuestoInterno(cotizacionId: string | undefined) {
  return useQuery({
    queryKey: ["presupuesto_interno", cotizacionId],
    queryFn: async () => {
      if (!cotizacionId) return null;
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("cotizacion_id", cotizacionId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        items: (data.items as unknown as LineaCosto[]) || [],
      } as PresupuestoInterno;
    },
    enabled: !!cotizacionId,
  });
}

export function useCrearPresupuestoInterno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      cotizacion_id: string;
      moneda?: "CLP" | "UF" | "USD";
      items?: LineaCosto[];
      margen_pct?: number;
    }) => {
      const items = input.items ?? [];
      const totales = calcularTotalesCosto(items);
      const { data, error } = await supabase
        .from("presupuestos")
        .insert({
          cotizacion_id: input.cotizacion_id,
          ot_id: null,
          moneda: input.moneda ?? "CLP",
          items: items as any,
          insumos: totales.insumos,
          mano_obra: totales.mano_obra,
          otros_costos: totales.otros_costos,
          margen_pct: input.margen_pct ?? 30,
          estado: "borrador",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["presupuesto_interno", data.cotizacion_id] });
      toast({ title: "Presupuesto interno creado" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useActualizarPresupuestoInterno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      items?: LineaCosto[];
      margen_pct?: number;
      moneda?: "CLP" | "UF" | "USD";
    }) => {
      const update: any = {};
      if (input.items) {
        const t = calcularTotalesCosto(input.items);
        update.items = input.items;
        update.insumos = t.insumos;
        update.mano_obra = t.mano_obra;
        update.otros_costos = t.otros_costos;
      }
      if (input.margen_pct !== undefined) update.margen_pct = input.margen_pct;
      if (input.moneda) update.moneda = input.moneda;

      const { data, error } = await supabase
        .from("presupuestos")
        .update(update)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["presupuesto_interno", data.cotizacion_id] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useEliminarPresupuestoInterno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; cotizacion_id: string }) => {
      const { error } = await supabase.from("presupuestos").delete().eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["presupuesto_interno", data.cotizacion_id] });
      toast({ title: "Presupuesto interno eliminado" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}
