import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, FolderKanban, LayoutGrid, List } from "lucide-react";
import { 
  useProyectos, 
  useCrearProyecto, 
  useActualizarProyecto, 
  useEliminarProyecto,
  Proyecto,
  ProyectoInput
} from "@/hooks/useProyectos";
import { ProyectoCard } from "@/components/proyectos/ProyectoCard";
import { ProyectoForm } from "@/components/proyectos/ProyectoForm";
import { ProyectoDetalle } from "@/components/proyectos/ProyectoDetalle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Proyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [vista, setVista] = useState<"grid" | "lista">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [proyectoEditar, setProyectoEditar] = useState<Proyecto | null>(null);
  const [proyectoVer, setProyectoVer] = useState<Proyecto | null>(null);
  const [proyectoEliminar, setProyectoEliminar] = useState<string | null>(null);

  const { data: proyectos = [], isLoading } = useProyectos();
  const crearProyecto = useCrearProyecto();
  const actualizarProyecto = useActualizarProyecto();
  const eliminarProyecto = useEliminarProyecto();

  const proyectosFiltrados = proyectos.filter((p) => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const handleCrear = (data: ProyectoInput) => {
    crearProyecto.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEditar = (data: ProyectoInput) => {
    if (!proyectoEditar) return;
    actualizarProyecto.mutate({ id: proyectoEditar.id, ...data }, {
      onSuccess: () => {
        setProyectoEditar(null);
        setFormOpen(false);
      },
    });
  };

  const handleConfirmDelete = () => {
    if (proyectoEliminar) {
      eliminarProyecto.mutate(proyectoEliminar, {
        onSuccess: () => setProyectoEliminar(null),
      });
    }
  };

  const estadoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    planificacion: { label: "Planificación", variant: "outline" },
    en_progreso: { label: "En Progreso", variant: "default" },
    pausado: { label: "Pausado", variant: "secondary" },
    completado: { label: "Completado", variant: "default" },
    cancelado: { label: "Cancelado", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Proyectos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus proyectos y su progreso
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="planificacion">Planificación</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Button
            variant={vista === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setVista("grid")}
            className="rounded-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={vista === "lista" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setVista("lista")}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Cargando proyectos...</p>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {busqueda || filtroEstado !== "todos"
              ? "No se encontraron proyectos con los filtros aplicados"
              : "No hay proyectos creados"}
          </p>
          {!busqueda && filtroEstado === "todos" && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer proyecto
            </Button>
          )}
        </div>
      ) : vista === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectosFiltrados.map((proyecto) => (
            <ProyectoCard
              key={proyecto.id}
              proyecto={proyecto}
              onView={setProyectoVer}
              onEdit={(p) => {
                setProyectoEditar(p);
                setFormOpen(true);
              }}
              onDelete={setProyectoEliminar}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Fecha límite</TableHead>
                <TableHead>Cliente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyectosFiltrados.map((proyecto) => (
                <TableRow 
                  key={proyecto.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setProyectoVer(proyecto)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{proyecto.nombre}</p>
                      {proyecto.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {proyecto.descripcion}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoConfig[proyecto.estado]?.variant || "default"}>
                      {estadoConfig[proyecto.estado]?.label || proyecto.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={proyecto.progreso} className="h-2 w-20" />
                      <span className="text-sm text-muted-foreground">{proyecto.progreso}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {proyecto.fecha_fin_estimada
                      ? format(new Date(proyecto.fecha_fin_estimada), "dd MMM yyyy", { locale: es })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {proyecto.cliente?.razon_social || 
                      (proyecto.cliente?.nombres 
                        ? `${proyecto.cliente.nombres} ${proyecto.cliente.apellidos || ''}`.trim() 
                        : "-")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modales */}
      <ProyectoForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setProyectoEditar(null);
        }}
        onSubmit={proyectoEditar ? handleEditar : handleCrear}
        proyecto={proyectoEditar}
        isLoading={crearProyecto.isPending || actualizarProyecto.isPending}
      />

      {proyectoVer && (
        <ProyectoDetalle
          open={!!proyectoVer}
          onOpenChange={(open) => !open && setProyectoVer(null)}
          proyecto={proyectoVer}
        />
      )}

      <AlertDialog open={!!proyectoEliminar} onOpenChange={() => setProyectoEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el proyecto y todas sus tareas asociadas. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
