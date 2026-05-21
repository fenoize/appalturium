import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConfiguracionEmpresa {
  nombre: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
}

const CATEGORIA = "empresa";
const CAMPOS: (keyof ConfiguracionEmpresa)[] = [
  "nombre",
  "rut",
  "direccion",
  "telefono",
  "email",
];

const LABELS_FORM: Record<keyof ConfiguracionEmpresa, string> = {
  nombre: "Nombre de la Empresa",
  rut: "RUT",
  direccion: "Dirección",
  telefono: "Teléfono",
  email: "Email",
};

export function useConfiguracionEmpresa() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["configuracion_empresa"],
    queryFn: async (): Promise<ConfiguracionEmpresa> => {
      const { data, error } = await supabase
        .from("parametros_sistema")
        .select("key, descripcion")
        .eq("categoria", CATEGORIA);

      if (error) throw error;

      const result: ConfiguracionEmpresa = {
        nombre: "",
        rut: "",
        direccion: "",
        telefono: "",
        email: "",
      };

      (data ?? []).forEach((row) => {
        if (CAMPOS.includes(row.key as keyof ConfiguracionEmpresa)) {
          result[row.key as keyof ConfiguracionEmpresa] = row.descripcion ?? "";
        }
      });

      return result;
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ConfiguracionEmpresa) => {
      // Fetch existing rows for categoria 'empresa'
      const { data: existentes, error: errFetch } = await supabase
        .from("parametros_sistema")
        .select("id, key")
        .eq("categoria", CATEGORIA);

      if (errFetch) throw errFetch;

      const existentesPorKey = new Map(
        (existentes ?? []).map((r) => [r.key, r.id])
      );

      for (const campo of CAMPOS) {
        const valor = values[campo] ?? "";
        const existingId = existentesPorKey.get(campo);

        if (existingId) {
          const { error } = await supabase
            .from("parametros_sistema")
            .update({ descripcion: valor, label: LABELS_FORM[campo] })
            .eq("id", existingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("parametros_sistema").insert({
            categoria: CATEGORIA,
            key: campo,
            label: LABELS_FORM[campo],
            descripcion: valor,
            activo: true,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracion_empresa"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    guardar: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
