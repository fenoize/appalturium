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
import { PersonalCard } from "@/components/personal/PersonalCard";
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
import { UserPlus, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Personal() {
  const [filtroRol, setFiltroRol] = useState<string>("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("");
  const [filtroActivo, setFiltroActivo] = useState<boolean | undefined>(true);
  const [busqueda, setBusqueda] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [personalSeleccionado, setPersonalSeleccionado] =
    useState<PersonalConUsuario | null>(null);

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

  // Filtrar por búsqueda de texto
  const personalFiltrado = personal?.filter((p) =>
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.rut.includes(busqueda) ||
    p.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

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

  const limpiarFiltros = () => {
    setFiltroRol("");
    setFiltroEspecialidad("");
    setFiltroActivo(true);
    setBusqueda("");
  };

  const totalActivos = personal?.filter((p) => p.activo).length || 0;
  const totalInactivos = personal?.filter((p) => !p.activo).length || 0;

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        {(filtroRol || filtroEspecialidad || busqueda) && (
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
          </div>
        )}
      </div>

      {/* Lista de Personal */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : personalFiltrado && personalFiltrado.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personalFiltrado.map((p) => (
            <PersonalCard
              key={p.id}
              personal={p}
              onEdit={handleEditar}
              onToggleActivo={handleToggleActivo}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            No se encontró personal con los filtros seleccionados
          </p>
          <Button variant="link" onClick={limpiarFiltros} className="mt-2">
            Limpiar filtros
          </Button>
        </div>
      )}

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
