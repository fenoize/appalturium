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
import { Plus, Search, CheckSquare, LayoutGrid, List } from "lucide-react";
import { 
  useTareas, 
  useCrearTarea, 
  useActualizarTarea, 
  useEliminarTarea,
  Tarea,
  TareaInput
} from "@/hooks/useTareas";
import { TareaCard } from "@/components/tareas/TareaCard";
import { TareaForm } from "@/components/tareas/TareaForm";
import { TareaKanban } from "@/components/tareas/TareaKanban";

export default function Tareas() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todos");
  const [vista, setVista] = useState<"kanban" | "lista">("kanban");
  const [formOpen, setFormOpen] = useState(false);
  const [tareaEditar, setTareaEditar] = useState<Tarea | null>(null);
  const [tareaEliminar, setTareaEliminar] = useState<string | null>(null);

  const { data: tareas = [], isLoading } = useTareas();
  const crearTarea = useCrearTarea();
  const actualizarTarea = useActualizarTarea();
  const eliminarTarea = useEliminarTarea();

  const tareasFiltradas = tareas.filter((t) => {
    const matchBusqueda = t.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.proyecto?.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === "todos" || t.estado === filtroEstado;
    const matchPrioridad = filtroPrioridad === "todos" || t.prioridad === filtroPrioridad;
    return matchBusqueda && matchEstado && matchPrioridad;
  });

  const handleCrear = (data: TareaInput) => {
    crearTarea.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEditar = (data: TareaInput) => {
    if (!tareaEditar) return;
    actualizarTarea.mutate({ id: tareaEditar.id, ...data }, {
      onSuccess: () => {
        setTareaEditar(null);
        setFormOpen(false);
      },
    });
  };

  const handleToggleComplete = (tarea: Tarea) => {
    const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada';
    actualizarTarea.mutate({ id: tarea.id, estado: nuevoEstado });
  };

  const handleConfirmDelete = () => {
    if (tareaEliminar) {
      eliminarTarea.mutate(tareaEliminar, {
        onSuccess: () => setTareaEliminar(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            Tareas
          </h1>
          <p className="text-muted-foreground">
            Gestiona y organiza todas las tareas de tus proyectos
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="revision">En Revisión</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Button
            variant={vista === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setVista("kanban")}
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
        <p className="text-muted-foreground text-center py-12">Cargando tareas...</p>
      ) : tareasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {busqueda || filtroEstado !== "todos" || filtroPrioridad !== "todos"
              ? "No se encontraron tareas con los filtros aplicados"
              : "No hay tareas creadas"}
          </p>
          {!busqueda && filtroEstado === "todos" && filtroPrioridad === "todos" && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera tarea
            </Button>
          )}
        </div>
      ) : vista === "kanban" ? (
        <TareaKanban
          tareas={tareasFiltradas}
          onEdit={(tarea) => {
            setTareaEditar(tarea);
            setFormOpen(true);
          }}
          onDelete={setTareaEliminar}
          onToggleComplete={handleToggleComplete}
        />
      ) : (
        <div className="space-y-3">
          {tareasFiltradas.map((tarea) => (
            <TareaCard
              key={tarea.id}
              tarea={tarea}
              onEdit={(t) => {
                setTareaEditar(t);
                setFormOpen(true);
              }}
              onDelete={setTareaEliminar}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <TareaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setTareaEditar(null);
        }}
        onSubmit={tareaEditar ? handleEditar : handleCrear}
        tarea={tareaEditar}
        isLoading={crearTarea.isPending || actualizarTarea.isPending}
      />

      <AlertDialog open={!!tareaEliminar} onOpenChange={() => setTareaEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
