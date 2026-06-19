import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EtiquetaOpcion = "A" | "B" | "C";
export type EstadoOpcion = "pendiente" | "presentada" | "aceptada" | "rechazada" | "descartada";
export type FormatoOpcion = "categorias" | "items_por_categoria" | "items_por_categoria_padre";

export interface CotizacionOpcion {
  id: string;
  cotizacion_id: string;
  etiqueta: EtiquetaOpcion;
  orden: number;
  margen_pct: number;
  costo_base: number;
  subtotal: number;
  impuestos: number;
  total: number;
  formato: FormatoOpcion;
  estado: EstadoOpcion;
  presentada_ts: string | null;
  aceptada_ts: string | null;
  rechazada_ts: string | null;
  created_at: string;
}

export function useCotizacionOpciones(cotizacionId?: string) {
  return useQuery({
    queryKey: ["cotizacion_opciones", cotizacionId],
    enabled: !!cotizacionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cotizacion_opciones")
        .select("*")
        .eq("cotizacion_id", cotizacionId)
        .order("orden", { ascending: true });
      if (error) throw error;
      return data as CotizacionOpcion[];
    },
  });
}

export function usePresentarOpcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opcion: CotizacionOpcion) => {
      const ts = new Date().toISOString();
      const { error: e1 } = await (supabase as any)
        .from("cotizacion_opciones")
        .update({ estado: "presentada", presentada_ts: ts })
        .eq("id", opcion.id);
      if (e1) throw e1;
      const { error: e2 } = await (supabase as any)
        .from("cotizaciones")
        .update({ opcion_actual_id: opcion.id })
        .eq("id", opcion.cotizacion_id);
      if (e2) throw e2;
      return opcion;
    },
    onSuccess: (opcion) => {
      qc.invalidateQueries({ queryKey: ["cotizacion_opciones", opcion.cotizacion_id] });
      qc.invalidateQueries({ queryKey: ["cotizacion", opcion.cotizacion_id] });
      toast({ title: `Opción ${opcion.etiqueta} presentada`, description: "Se marcó como opción actual." });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message ?? "No se pudo presentar", variant: "destructive" }),
  });
}
