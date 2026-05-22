import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Cliente {
  id: string;
  tipo: "empresa" | "persona";
  razon_social: string | null;
  giro: string | null;
  nombres: string | null;
  apellidos: string | null;
  rut: string;
  email: string | null;
  telefono: string | null;
  industria: string | null;
  segmento: string | null;
  estado_cliente: string;
  etiquetas: string[];
  created_at: string;
}

interface FiltrosClientes {
  busqueda?: string;
  tipo?: string;
  estado?: string;
  industria?: string;
  page?: number;
  pageSize?: number;
}

interface ClientesPaginated {
  data: Cliente[];
  total: number;
}

export function useClientes(filtros?: FiltrosClientes) {
  const page = filtros?.page ?? 1;
  const pageSize = filtros?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  return useQuery<ClientesPaginated>({
    queryKey: ["clientes", filtros],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filtros?.tipo && filtros.tipo !== "todos") {
        query = query.eq("tipo", filtros.tipo);
      }
      if (filtros?.estado && filtros.estado !== "todos") {
        query = query.eq("estado_cliente", filtros.estado);
      }
      if (filtros?.industria && filtros.industria !== "todos") {
        query = query.eq("industria", filtros.industria);
      }
      if (filtros?.busqueda) {
        const term = filtros.busqueda;
        query = query.or(
          `rut.ilike.%${term}%,email.ilike.%${term}%,razon_social.ilike.%${term}%,nombres.ilike.%${term}%,apellidos.ilike.%${term}%`
        );
      }

      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data as Cliente[]) || [], total: count || 0 };
    },
  });
}
