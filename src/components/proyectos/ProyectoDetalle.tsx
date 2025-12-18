import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
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
import { 
  Calendar, 
  DollarSign, 
  User, 
  ArrowLeft, 
  Plus,
  CheckSquare,
  LayoutGrid,
  List
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Proyecto, useProyecto } from "@/hooks/useProyectos";
import { useTareas, useCrearTarea, useActualizarTarea, useEliminarTarea, Tarea, TareaInput } from "@/hooks/useTareas";
import { TareaCard } from "@/components/tareas/TareaCard";
import { TareaForm } from "@/components/tareas/TareaForm";
import { TareaKanban } from "@/components/tareas/TareaKanban";

interface ProyectoDetalleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyecto: Proyecto;
}

const estadoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planificacion: { label: "Planificación", variant: "outline" },
  en_progreso: { label: "En Progreso", variant: "default" },
  pausado: { label: "Pausado", variant: "secondary" },
  completado: { label: "Completado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function ProyectoDetalle({ open, onOpenChange, proyecto: proyectoInicial }: ProyectoDetalleProps) {
  const [vistaKanban, setVistaKanban] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [tareaEditar, setTareaEditar] = useState<Tarea | null>(null);
  const [tareaEliminar, setTareaEliminar] = useState<string | null>(null);

  // Usar hook para obtener datos actualizados del proyecto (incluyendo progreso)
  const { data: proyectoActualizado } = useProyecto(proyectoInicial.id);
  const proyecto = proyectoActualizado || proyectoInicial;

  const { data: tareas = [], isLoading } = useTareas(proyecto.id);
  const crearTarea = useCrearTarea();
  const actualizarTarea = useActualizarTarea();
  const eliminarTarea = useEliminarTarea();

  const clienteNombre = proyecto.cliente?.razon_social || 
    (proyecto.cliente?.nombres ? `${proyecto.cliente.nombres} ${proyecto.cliente.apellidos || ''}`.trim() : null);

  const handleCrearTarea = (data: TareaInput) => {
    crearTarea.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEditarTarea = (data: TareaInput) => {
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

  // Usar el progreso persistido del proyecto (calculado por trigger en DB)
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length;
  const porcentajeTareas = proyecto.progreso ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={estadoConfig[proyecto.estado]?.variant || "default"}>
                    {estadoConfig[proyecto.estado]?.label || proyecto.estado}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{proyecto.nombre}</DialogTitle>
                {clienteNombre && (
                  <p className="text-sm text-muted-foreground">{clienteNombre}</p>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-1">
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckSquare className="h-4 w-4" />
                      <span>Tareas</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{tareasCompletadas}/{tareas.length}</p>
                    <Progress value={porcentajeTareas} className="h-1 mt-2" />
                  </CardContent>
                </Card>

                {proyecto.fecha_fin_estimada && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Fecha límite</span>
                      </div>
                      <p className="text-lg font-medium mt-1">
                        {format(new Date(proyecto.fecha_fin_estimada), "dd MMM yyyy", { locale: es })}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {proyecto.presupuesto > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <DollarSign className="h-4 w-4" />
                        <span>Presupuesto</span>
                      </div>
                      <p className="text-lg font-medium mt-1">
                        ${proyecto.presupuesto.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {proyecto.responsable && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="h-4 w-4" />
                        <span>Responsable</span>
                      </div>
                      <p className="text-lg font-medium mt-1 truncate">
                        {proyecto.responsable.nombre_completo}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Tareas */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Tareas</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg border border-border overflow-hidden">
                        <Button
                          variant={vistaKanban ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setVistaKanban(true)}
                          className="rounded-none"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={!vistaKanban ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setVistaKanban(false)}
                          className="rounded-none"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button size="sm" onClick={() => setFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Nueva Tarea
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-muted-foreground text-center py-8">Cargando tareas...</p>
                  ) : tareas.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No hay tareas en este proyecto</p>
                      <Button onClick={() => setFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear primera tarea
                      </Button>
                    </div>
                  ) : vistaKanban ? (
                    <TareaKanban
                      tareas={tareas}
                      onEdit={(tarea) => {
                        setTareaEditar(tarea);
                        setFormOpen(true);
                      }}
                      onDelete={setTareaEliminar}
                      onToggleComplete={handleToggleComplete}
                    />
                  ) : (
                    <div className="space-y-3">
                      {tareas.map((tarea) => (
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
                </CardContent>
              </Card>

              {proyecto.descripcion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descripción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{proyecto.descripcion}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TareaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setTareaEditar(null);
        }}
        onSubmit={tareaEditar ? handleEditarTarea : handleCrearTarea}
        tarea={tareaEditar}
        proyectoId={proyecto.id}
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
    </>
  );
}
