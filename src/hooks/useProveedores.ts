import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CondicionesPago = Database["public"]["Enums"]["condiciones_pago"];

export interface Proveedor {
  id: string;
  rut: string;
  razon_social: string;
  nombre_fantasia: string | null;
  giro: string | null;
  direccion: string | null;
  ciudad: string | null;
  region: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  contacto_email: string | null;
  condiciones_pago: CondicionesPago | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useProveedores() {
  return useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .order("razon_social");

      if (error) throw error;
      return data as Proveedor[];
    },
  });
}

export function useProveedor(id: string | undefined) {
  return useQuery({
    queryKey: ["proveedor", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Proveedor | null;
    },
    enabled: !!id,
  });
}

export function useCreateProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proveedor: Omit<Proveedor, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("proveedores")
        .insert(proveedor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast({ title: "Proveedor creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear proveedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...proveedor }: Partial<Proveedor> & { id: string }) => {
      const { data, error } = await supabase
        .from("proveedores")
        .update(proveedor)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast({ title: "Proveedor actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar proveedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proveedores")
        .update({ activo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast({ title: "Proveedor eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar proveedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
