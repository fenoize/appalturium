import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Users as UsersIcon } from "lucide-react";
import { UsuarioCard } from "@/components/usuarios/UsuarioCard";
import { AsignarRolDialog } from "@/components/usuarios/AsignarRolDialog";
import { CrearUsuarioDialog } from "@/components/usuarios/CrearUsuarioDialog";
import {
  useUsuarios,
  useRolesDisponibles,
  useAsignarRol,
  useRemoverRol,
  useCrearUsuario,
} from "@/hooks/useUsuarios";

export default function Usuarios() {
  const [busqueda, setBusqueda] = useState("");
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: rolesDisponibles } = useRolesDisponibles();
  const asignarRol = useAsignarRol();
  const removerRol = useRemoverRol();
  const crearUsuario = useCrearUsuario();

  const usuariosFiltrados = usuarios?.filter((usuario) =>
    usuario.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAsignarRol = (userId: string, role: any) => {
    asignarRol.mutate({ userId, role });
  };

  const handleRemoverRol = (userId: string, role: string) => {
    removerRol.mutate({ userId, role: role as any });
  };

  const handleCrearUsuario = (email: string, password: string, roles: any[]) => {
    crearUsuario.mutate({ email, password, roles });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-8 w-8" />
            Usuarios y Roles
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los usuarios del sistema y sus roles de acceso
          </p>
        </div>
        <CrearUsuarioDialog onCrear={handleCrearUsuario} />
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
              <p className="text-2xl font-bold">{usuarios?.length || 0}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold">
                {usuarios?.filter((u) => u.roles.includes("admin")).length || 0}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supervisores</p>
              <p className="text-2xl font-bold">
                {usuarios?.filter((u) => u.roles.includes("supervisor")).length || 0}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {usuariosFiltrados?.map((usuario) => (
          <div key={usuario.id} className="space-y-2">
            <UsuarioCard usuario={usuario} onRemoverRol={handleRemoverRol} />
            {rolesDisponibles && (
              <AsignarRolDialog
                usuario={usuario}
                rolesDisponibles={rolesDisponibles}
                onAsignar={handleAsignarRol}
              />
            )}
          </div>
        ))}
      </div>

      {usuariosFiltrados?.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No se encontraron usuarios que coincidan con la búsqueda
          </p>
        </div>
      )}
    </div>
  );
}
