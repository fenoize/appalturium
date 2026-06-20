import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EstadoCuota = "pendiente" | "pagada" | "vencida";

export interface PlanPago {
  id: string;
  documento_venta_id: string;
  numero_cuota: 1 | 2;
  monto_esperado: number;
  fecha_esperada: string | null;
  estado: EstadoCuota;
  pago_id: string | null;
  created_at: string;
}

export function usePlanPagos(documentoId?: string) {
  return useQuery({
    queryKey: ["plan_pagos", documentoId],
    enabled: !!documentoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("plan_pagos")
        .select("*")
        .eq("documento_venta_id", documentoId)
        .order("numero_cuota", { ascending: true });
      if (error) throw error;
      return data as PlanPago[];
    },
  });
}

export interface CuotaInput {
  numero_cuota: 1 | 2;
  monto_esperado: number;
  fecha_esperada?: string | null;
}

export function useCrearPlanPagos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentoId,
      cuotas,
    }: {
      documentoId: string;
      cuotas: CuotaInput[];
    }) => {
      const rows = cuotas.map((c) => ({
        documento_venta_id: documentoId,
        numero_cuota: c.numero_cuota,
        monto_esperado: c.monto_esperado,
        fecha_esperada: c.fecha_esperada ?? null,
      }));
      const { error } = await (supabase as any).from("plan_pagos").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["plan_pagos", vars.documentoId] });
    },
    onError: (e: any) =>
      toast({ title: "Error creando plan de pago", description: e?.message, variant: "destructive" }),
  });
}

export function useVincularPagoCuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cuotaId, pagoId }: { cuotaId: string; pagoId: string }) => {
      const { error } = await (supabase as any)
        .from("plan_pagos")
        .update({ pago_id: pagoId })
        .eq("id", cuotaId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan_pagos"] });
    },
    onError: (e: any) =>
      toast({ title: "Error vinculando pago a cuota", description: e?.message, variant: "destructive" }),
  });
}
