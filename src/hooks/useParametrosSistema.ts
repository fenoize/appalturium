import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParametroSistema {
  id: string;
  categoria: string;
  key: string;
  label: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden: number;
  activo: boolean;
}

export function useParametrosSistema(categoria: string) {
  return useQuery({
    queryKey: ["parametros_sistema", categoria],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parametros_sistema")
        .select("*")
        .eq("categoria", categoria)
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (error) throw error;
      return data as ParametroSistema[];
    },
  });
}
