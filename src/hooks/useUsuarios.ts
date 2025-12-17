import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UsuarioConRoles {
  id: string;
  email: string;
  created_at: string;
  roles: AppRole[];
  last_sign_in_at?: string;
  linked_personal?: string | null;
  linked_cliente?: string | null;
}

// Helper to call the manage-users backend function
async function callManageUsers(action: string, payload: Record<string, any> = {}) {
  const res = await supabase.functions.invoke("manage-users", {
    body: { action, ...payload },
  });

  if (res.error) {
    // Supabase wraps function errors like: "Edge Function returned 409: ..., {\"error\":\"...\"}"
    const raw = res.error.message || "Error en la operación";
    const jsonMatch = raw.match(/\{\s*"error"\s*:\s*"([\s\S]*?)"\s*\}$/);
    const message = (jsonMatch?.[1] || raw).replace(/\\n/g, "\n");
    throw new Error(message);
  }

  // Some non-2xx responses may come back as data with an { error } payload
  if (res.data && typeof res.data === "object" && "error" in res.data) {
    throw new Error(String((res.data as any).error));
  }

  return res.data;
}

// Hook para obtener todos los usuarios con sus roles
export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const data = await callManageUsers("list");
      return data.users as UsuarioConRoles[];
    },
  });
}

// Hook para obtener roles disponibles
export function useRolesDisponibles() {
  return useQuery({
    queryKey: ["roles-disponibles"],
    queryFn: async () => {
      return ["admin", "supervisor", "cliente"] as AppRole[];
    },
  });
}

// Hook para asignar rol a usuario
export function useAsignarRol() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({
        title: "Rol asignado",
        description: "El rol se ha asignado correctamente al usuario.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al asignar rol",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para remover rol de usuario
export function useRemoverRol() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({
        title: "Rol removido",
        description: "El rol se ha removido correctamente del usuario.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al remover rol",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para crear nuevo usuario
export function useCrearUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, password, roles }: { email: string; password: string; roles: AppRole[] }) => {
      const data = await callManageUsers("create", { email, password, roles });
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({
        title: "Usuario creado",
        description: "El usuario se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para crear usuario con ficha de personal
export function useCrearUsuarioConPersonal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      roles, 
      personalData 
    }: { 
      email: string; 
      password: string; 
      roles: AppRole[]; 
      personalData: any;
    }) => {
      const data = await callManageUsers("create_with_personal", { 
        email, 
        password, 
        roles,
        personalData 
      });
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["personal"] });
      toast({
        title: "Usuario y ficha creados",
        description: "El usuario y su ficha de personal se han creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para eliminar usuario
export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      await callManageUsers("delete", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para actualizar usuario
export function useActualizarUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, email, password }: { userId: string; email?: string; password?: string }) => {
      const data = await callManageUsers("update", { userId, email, password });
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario se ha actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
