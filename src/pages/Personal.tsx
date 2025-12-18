import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalForm } from "@/components/personal/PersonalForm";
import {
  usePersonal,
  useCrearPersonal,
  useActualizarPersonal,
  useDesactivarPersonal,
  useReactivarPersonal,
  useEspecialidades,
  type PersonalConUsuario,
} from "@/hooks/usePersonal";
import { UserPlus, Search, Filter, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function Personal() {
  const navigate = useNavigate();
  const [filtroRol, setFiltroRol] = useState<string>("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("");
  const [filtroActivo, setFiltroActivo] = useState<boolean | undefined>(true);
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>("");
  const [busqueda, setBusqueda] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [personalSeleccionado, setPersonalSeleccionado] =
    useState<PersonalConUsuario | null>(null);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [personalDetalle, setPersonalDetalle] = useState<PersonalConUsuario | null>(null);
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false);
  const [personalAEliminar, setPersonalAEliminar] = useState<PersonalConUsuario | null>(null);

  const filtros = {
    rol_operativo: filtroRol || undefined,
    especialidad: filtroEspecialidad || undefined,
    activo: filtroActivo,
  };

  const { data: personal, isLoading } = usePersonal(filtros);
  const { data: especialidades } = useEspecialidades();
  const crearPersonal = useCrearPersonal();
  const actualizarPersonal = useActualizarPersonal();
  const desactivarPersonal = useDesactivarPersonal();
  const reactivarPersonal = useReactivarPersonal();

  // Obtener todas las etiquetas únicas
  const todasEtiquetas = Array.from(
    new Set(personal?.flatMap((p) => p.etiquetas || []) || [])
  ).sort();

  // Filtrar por búsqueda de texto y etiqueta
  const personalFiltrado = personal?.filter((p) => {
    const matchBusqueda =
      p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.rut.includes(busqueda) ||
      p.email?.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchEtiqueta = !filtroEtiqueta || p.etiquetas?.includes(filtroEtiqueta);
    
    return matchBusqueda && matchEtiqueta;
  });

  const handleCrearEditar = (data: any) => {
    if (personalSeleccionado) {
      actualizarPersonal.mutate({ id: personalSeleccionado.id, ...data });
    } else {
      crearPersonal.mutate(data);
    }
  };

  const handleToggleActivo = (id: string, activo: boolean) => {
    if (activo) {
      desactivarPersonal.mutate(id);
    } else {
      reactivarPersonal.mutate(id);
    }
  };

  const handleNuevo = () => {
    setPersonalSeleccionado(null);
    setFormOpen(true);
  };

  const handleEditar = (personal: PersonalConUsuario) => {
    setPersonalSeleccionado(personal);
    setFormOpen(true);
  };

  const handleVerDetalle = (personal: PersonalConUsuario) => {
    setPersonalDetalle(personal);
    setVerDetalleOpen(true);
  };

  const handleEliminar = (personal: PersonalConUsuario) => {
    setPersonalAEliminar(personal);
    setEliminarDialogOpen(true);
  };

  const confirmarEliminar = () => {
    if (personalAEliminar) {
      desactivarPersonal.mutate(personalAEliminar.id);
      setEliminarDialogOpen(false);
      setPersonalAEliminar(null);
    }
  };

  const limpiarFiltros = () => {
    setFiltroRol("");
    setFiltroEspecialidad("");
    setFiltroActivo(true);
    setFiltroEtiqueta("");
    setBusqueda("");
  };

  const totalActivos = personal?.filter((p) => p.activo).length || 0;
  const totalInactivos = personal?.filter((p) => !p.activo).length || 0;

  const getRolBadgeVariant = (rol: string) => {
    switch (rol) {
      case "tecnico":
        return "default";
      case "supervisor":
        return "secondary";
      case "administrador":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getAlertaContrato = (fechaTermino: string | null) => {
    if (!fechaTermino) return null;
    const dias = differenceInDays(new Date(fechaTermino), new Date());
    if (dias >= 0 && dias <= 30) return dias;
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal</h1>
          <p className="text-muted-foreground">
            Gestión de fichas de personal
          </p>
        </div>
        <Button onClick={handleNuevo}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Personal
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Personal</p>
          <p className="text-2xl font-bold">{personal?.length || 0}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-success">{totalActivos}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Inactivos</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {totalInactivos}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Filtros</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="ml-auto"
          >
            Limpiar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RUT o email"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Rol */}
          <Select 
            value={filtroRol || "todos"} 
            onValueChange={(value) => setFiltroRol(value === "todos" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="operario">Operario</SelectItem>
              <SelectItem value="despachador">Despachador</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="administrador">Administrador</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>

          {/* Especialidad */}
          <Select
            value={filtroEspecialidad || "todas"}
            onValueChange={(value) => setFiltroEspecialidad(value === "todas" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las especialidades</SelectItem>
              {especialidades?.map((esp) => (
                <SelectItem key={esp} value={esp}>
                  {esp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Etiquetas */}
          <Select
            value={filtroEtiqueta || "todas"}
            onValueChange={(value) => setFiltroEtiqueta(value === "todas" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las etiquetas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las etiquetas</SelectItem>
              {todasEtiquetas.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado */}
          <Select
            value={
              filtroActivo === undefined
                ? "todos"
                : filtroActivo
                ? "activo"
                : "inactivo"
            }
            onValueChange={(value) =>
              setFiltroActivo(
                value === "todos"
                  ? undefined
                  : value === "activo"
                  ? true
                  : false
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Badges de filtros activos */}
        {(filtroRol || filtroEspecialidad || filtroEtiqueta || busqueda) && (
          <div className="flex flex-wrap gap-2">
            {busqueda && (
              <Badge variant="secondary">
                Búsqueda: {busqueda}
                <button
                  onClick={() => setBusqueda("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filtroRol && (
              <Badge variant="secondary">
                Rol: {filtroRol}
                <button
                  onClick={() => setFiltroRol("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filtroEspecialidad && (
              <Badge variant="secondary">
                Especialidad: {filtroEspecialidad}
                <button
                  onClick={() => setFiltroEspecialidad("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filtroEtiqueta && (
              <Badge variant="secondary">
                Etiqueta: {filtroEtiqueta}
                <button
                  onClick={() => setFiltroEtiqueta("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Lista de Personal como Tabla */}
      <div className="border rounded-lg">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : personalFiltrado && personalFiltrado.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalFiltrado.map((p) => {
                const alertaDias = getAlertaContrato(p.fecha_termino);
                return (
                  <TableRow key={p.id} className={!p.activo ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.nombre_completo}</span>
                        {alertaDias !== null && p.activo && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {alertaDias}d
                          </Badge>
                        )}
                      </div>
                      {p.email && (
                        <span className="text-sm text-muted-foreground">{p.email}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.rut}</TableCell>
                    <TableCell>
                      <Badge variant={getRolBadgeVariant(p.rol_operativo)}>
                        {p.rol_operativo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.especialidad?.slice(0, 2).map((esp) => (
                          <Badge key={esp} variant="outline" className="text-xs">
                            {esp}
                          </Badge>
                        ))}
                        {(p.especialidad?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(p.especialidad?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.etiquetas?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(p.etiquetas?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(p.etiquetas?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.activo ? "default" : "outline"}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVerDetalle(p)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditar(p)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminar(p)}
                          title={p.activo ? "Desactivar" : "Reactivar"}
                          className={p.activo ? "hover:text-destructive" : "hover:text-success"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontró personal con los filtros seleccionados
            </p>
            <Button variant="link" onClick={limpiarFiltros} className="mt-2">
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Dialog Ver Detalle */}
      <Dialog open={verDetalleOpen} onOpenChange={setVerDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Personal</DialogTitle>
            <DialogDescription>
              Información completa del trabajador
            </DialogDescription>
          </DialogHeader>
          {personalDetalle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">{personalDetalle.nombre_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RUT</p>
                  <p className="font-medium font-mono">{personalDetalle.rut}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{personalDetalle.email || "No registrado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol Operativo</p>
                  <Badge variant={getRolBadgeVariant(personalDetalle.rol_operativo)}>
                    {personalDetalle.rol_operativo}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                  <p className="font-medium">
                    {format(new Date(personalDetalle.fecha_ingreso), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                {personalDetalle.fecha_termino && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Término</p>
                    <p className="font-medium">
                      {format(new Date(personalDetalle.fecha_termino), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={personalDetalle.activo ? "default" : "outline"}>
                    {personalDetalle.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {personalDetalle.domicilio && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Domicilio</p>
                    <p className="font-medium">{personalDetalle.domicilio}</p>
                  </div>
                )}
              </div>

              {personalDetalle.especialidad && personalDetalle.especialidad.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {personalDetalle.especialidad.map((esp) => (
                      <Badge key={esp} variant="outline">{esp}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {personalDetalle.etiquetas && personalDetalle.etiquetas.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {personalDetalle.etiquetas.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {personalDetalle.comentarios && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Comentarios</p>
                  <p className="text-sm">{personalDetalle.comentarios}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setVerDetalleOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => navigate(`/empleados/${personalDetalle.id}`)}>
                  Ver ficha completa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog Eliminar/Desactivar */}
      <AlertDialog open={eliminarDialogOpen} onOpenChange={setEliminarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {personalAEliminar?.activo ? "¿Desactivar trabajador?" : "¿Reactivar trabajador?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {personalAEliminar?.activo
                ? `¿Estás seguro de que deseas desactivar a ${personalAEliminar?.nombre_completo}? El registro se mantendrá en el sistema pero aparecerá como inactivo.`
                : `¿Estás seguro de que deseas reactivar a ${personalAEliminar?.nombre_completo}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarEliminar}
              className={personalAEliminar?.activo ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {personalAEliminar?.activo ? "Desactivar" : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulario */}
      <PersonalForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setPersonalSeleccionado(null);
        }}
        onSubmit={handleCrearEditar}
        personal={personalSeleccionado}
      />
    </div>
  );
}
