import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Users as UsersIcon, ShieldCheck, UserCog, Eye, Pencil, KeyRound, Trash2 } from "lucide-react";
import { CrearUsuarioDialog } from "@/components/usuarios/CrearUsuarioDialog";
import { EditarUsuarioDialog } from "@/components/usuarios/EditarUsuarioDialog";
import { EliminarUsuarioDialog } from "@/components/usuarios/EliminarUsuarioDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUsuarios,
  useRolesDisponibles,
  useAsignarRol,
  useRemoverRol,
  useCrearUsuario,
  useEliminarUsuario,
  useActualizarUsuario,
  UsuarioConRoles,
} from "@/hooks/useUsuarios";

const rolColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  supervisor: "bg-primary/10 text-primary border-primary/20",
  cliente: "bg-muted text-muted-foreground border-border",
};

export function GestionUsuarios() {
  const [busqueda, setBusqueda] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioConRoles | null>(null);
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: rolesDisponibles } = useRolesDisponibles();
  const asignarRol = useAsignarRol();
  const removerRol = useRemoverRol();
  const crearUsuario = useCrearUsuario();
  const eliminarUsuario = useEliminarUsuario();
  const actualizarUsuario = useActualizarUsuario();

  const usuariosFiltrados = usuarios?.filter((usuario) =>
    usuario.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleCrearUsuario = (email: string, password: string, roles: any[]) => {
    crearUsuario.mutate({ email, password, roles });
  };

  const handleEditarUsuario = (userId: string, email?: string, password?: string) => {
    actualizarUsuario.mutate({ userId, email, password });
  };

  const handleEliminarUsuario = (userId: string) => {
    eliminarUsuario.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-6 w-6" />
            Usuarios y Roles
          </h2>
          <p className="text-muted-foreground mt-1">
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
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
              <p className="text-2xl font-bold">{usuarios?.length || 0}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold">
                {usuarios?.filter((u) => u.roles.includes("admin")).length || 0}
              </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-destructive/70" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supervisores</p>
              <p className="text-2xl font-bold">
                {usuarios?.filter((u) => u.roles.includes("supervisor")).length || 0}
              </p>
            </div>
            <UserCog className="h-8 w-8 text-primary/70" />
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosFiltrados?.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {usuario.roles.length > 0 ? (
                      usuario.roles.map((rol) => (
                        <Badge
                          key={rol}
                          variant="outline"
                          className={rolColors[rol] || ""}
                        >
                          {rol}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(usuario.created_at).toLocaleDateString("es-CL")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUsuarioSeleccionado(usuario)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <EditarUsuarioDialog
                      usuario={usuario}
                      onEditar={handleEditarUsuario}
                    />
                    <EliminarUsuarioDialog
                      usuario={usuario}
                      onEliminar={handleEliminarUsuario}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {usuariosFiltrados?.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No se encontraron usuarios que coincidan con la búsqueda
            </p>
          </div>
        )}
      </div>

      {/* Dialog para ver detalles */}
      <Dialog open={!!usuarioSeleccionado} onOpenChange={() => setUsuarioSeleccionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>
          {usuarioSeleccionado && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{usuarioSeleccionado.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{usuarioSeleccionado.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                <p>{new Date(usuarioSeleccionado.created_at).toLocaleString("es-CL")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {usuarioSeleccionado.roles.length > 0 ? (
                    usuarioSeleccionado.roles.map((rol) => (
                      <Badge
                        key={rol}
                        variant="outline"
                        className={rolColors[rol] || ""}
                      >
                        {rol}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Sin roles asignados</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
