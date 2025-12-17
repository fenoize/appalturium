import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export interface UsuarioConRoles {
  id: string;
  email: string;
  created_at: string;
  roles: AppRole[];
  last_sign_in_at?: string;
}

// Hook para obtener todos los usuarios con sus roles
export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      // Obtener todos los roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Obtener usuarios únicos
      const userIds = [...new Set(rolesData?.map(r => r.user_id) || [])];
      
      const usuarios: UsuarioConRoles[] = await Promise.all(
        userIds.map(async (userId) => {
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          const userRoles = rolesData?.filter(r => r.user_id === userId).map(r => r.role) || [];
          
          return {
            id: userId,
            email: userData.user?.email || "",
            created_at: userData.user?.created_at || "",
            last_sign_in_at: userData.user?.last_sign_in_at,
            roles: userRoles as AppRole[],
          };
        })
      );

      return usuarios.sort((a, b) => a.email.localeCompare(b.email));
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
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Asignar roles
      if (roles.length > 0) {
        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(roles.map(role => ({ user_id: authData.user.id, role })));

        if (rolesError) throw rolesError;
      }

      return authData.user;
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

// Hook para eliminar usuario
export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Primero eliminar los roles del usuario
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      // Eliminar usuario de auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;
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
      const updateData: { email?: string; password?: string } = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData);

      if (error) throw error;
      return data;
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
