import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntegracionesConfig {
  mapbox_token: string;
  whatsapp_token: string;
  whatsapp_phone_id: string;
  resend_api_key: string;
  resend_from_email: string;
}

const CATEGORIA = "integraciones";
const CAMPOS: (keyof IntegracionesConfig)[] = [
  "mapbox_token",
  "whatsapp_token",
  "whatsapp_phone_id",
  "resend_api_key",
  "resend_from_email",
];

const LABELS_FORM: Record<keyof IntegracionesConfig, string> = {
  mapbox_token: "Mapbox API Token",
  whatsapp_token: "WhatsApp Access Token",
  whatsapp_phone_id: "WhatsApp Phone Number ID",
  resend_api_key: "Resend API Key",
  resend_from_email: "Resend From Email",
};

export function useIntegraciones() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["configuracion_integraciones"],
    queryFn: async (): Promise<IntegracionesConfig> => {
      const { data, error } = await supabase
        .from("parametros_sistema")
        .select("key, descripcion")
        .eq("categoria", CATEGORIA);

      if (error) throw error;

      const result: IntegracionesConfig = {
        mapbox_token: "",
        whatsapp_token: "",
        whatsapp_phone_id: "",
        resend_api_key: "",
        resend_from_email: "",
      };

      (data ?? []).forEach((row) => {
        if (CAMPOS.includes(row.key as keyof IntegracionesConfig)) {
          result[row.key as keyof IntegracionesConfig] = row.descripcion ?? "";
        }
      });

      return result;
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: IntegracionesConfig) => {
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
      queryClient.invalidateQueries({ queryKey: ["configuracion_integraciones"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    guardar: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
