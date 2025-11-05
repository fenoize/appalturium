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

      // Primero obtener el cliente
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!cliente) throw new Error("Cliente no encontrado");

      const { data, error } = await supabase
        .from("ordenes_servicio")
        .select(`
          *,
          ubicaciones (
            alias,
            direccion,
            comuna,
            ciudad
          )
        `)
        .eq("cliente_id", cliente.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Obtener presupuestos e informes por separado
      const ordenesConDatos = await Promise.all(
        (data || []).map(async (orden) => {
          const { data: presupuestos } = await supabase
            .from("presupuestos")
            .select("id, estado, total, validez_dias")
            .eq("ot_id", orden.id);

          const { data: informes } = await supabase
            .from("informes_finales")
            .select("id, created_at")
            .eq("ot_id", orden.id);

          return {
            ...orden,
            presupuestos: presupuestos || [],
            informes_finales: informes?.[0] || null,
          };
        })
      );

      return ordenesConDatos;
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
