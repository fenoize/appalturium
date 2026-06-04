import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAprobarPresupuesto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ presupuestoId, contactoId }: { presupuestoId: string; contactoId?: string }) => {
      const { data, error } = await supabase
        .from("presupuestos")
        .update({
          estado: "aprobado",
          aprobado_ts: new Date().toISOString(),
          ...(contactoId && { aprobado_por_contacto_id: contactoId }),
        })
        .eq("id", presupuestoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente_ordenes"] });
      queryClient.invalidateQueries({ queryKey: ["presupuesto"] });
      toast({
        title: "Presupuesto aprobado",
        description: "El presupuesto ha sido aprobado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useSolicitarMantencion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (datos: {
      cliente_id: string;
      ubicacion_id: string;
      tipo_trabajo: string;
      descripcion: string;
      prioridad?: string;
      fecha_programada_inicio?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Obtener número de OT vía RPC
      const { data: numeroOT, error: numeroError } = await supabase
        .rpc("generar_numero_ot");
      if (numeroError) throw numeroError;

      // Crear trabajo asociado a la solicitud del portal
      const { data: trabajo, error: trabajoError } = await supabase
        .from("trabajos")
        .insert([{
          cliente_id: datos.cliente_id,
          nombre_trabajo: `Solicitud Portal - ${datos.tipo_trabajo}`,
          tipo_trabajo: "mantencion",
          descripcion: datos.descripcion,
          origen: "portal",
          created_by: user.id,
        } as any])
        .select()
        .single();
      if (trabajoError) throw trabajoError;

      const { data, error } = await supabase
        .from("ordenes_servicio")
        .insert([{
          cliente_id: datos.cliente_id,
          ubicacion_id: datos.ubicacion_id,
          trabajo_id: trabajo.id,
          tipo_trabajo: datos.tipo_trabajo,
          descripcion: datos.descripcion,
          prioridad: datos.prioridad as any,
          fecha_programada_inicio: datos.fecha_programada_inicio,
          estado: "draft",
          created_by_user_id: user.id,
          numero: numeroOT as string,
        }])
        .select()
        .single();

      if (error) throw error;

      // Crear cotización borrador vinculada (no bloqueante si falla)
      try {
        const { data: numeroCot } = await supabase.rpc("generar_numero_cotizacion");
        await supabase.from("cotizaciones").insert([{
          numero: numeroCot as string,
          cliente_id: datos.cliente_id,
          fecha_emision: new Date().toISOString().slice(0, 10),
          estado: "en_revision",
          moneda: "CLP",
          subtotal: 0,
          impuestos: 0,
          total: 0,
          notas: `Cotización borrador generada desde portal cliente. OT: ${numeroOT}. Solicitud: ${datos.descripcion}`,
          ot_id: data.id,
          created_by: user.id,
        } as any]);
      } catch (cotErr) {
        console.warn("No se pudo crear cotización borrador:", cotErr);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente_ordenes"] });
      toast({
        title: "Solicitud enviada",
        description: "Su solicitud de mantención ha sido registrada",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}
