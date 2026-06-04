import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClienteData() {
  return useQuery({
    queryKey: ["cliente_data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("clientes")
        .select(`
          *,
          ubicaciones (*),
          contactos (*)
        `)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useClienteOrdenes() {
  return useQuery({
    queryKey: ["cliente_ordenes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Una sola query usando inner join al cliente para filtrar por user_id.
      const { data, error } = await supabase
        .from("ordenes_servicio")
        .select(`
          *,
          clientes!inner(id, user_id),
          ubicaciones(alias, direccion, comuna, ciudad),
          presupuestos(id, estado, total, validez_dias),
          informes_finales(id, created_at)
        `)
        .eq("clientes.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}


export function useClienteDocumentos() {
  return useQuery({
    queryKey: ["cliente_documentos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("documentos_venta")
        .select(`
          *,
          ordenes_servicio!inner (
            numero,
            clientes!inner (
              user_id
            )
          ),
          pagos (
            id,
            fecha,
            monto,
            metodo
          )
        `)
        .eq("ordenes_servicio.clientes.user_id", user.id)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
