import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Calendar, FolderPlus, Eye, Edit, Trash2 } from "lucide-react";
import { useTrabajosByCliente, useActualizarTrabajo, useEliminarTrabajo, Trabajo, EstadoTrabajo, TipoTrabajo } from "@/hooks/useTrabajos";
import { TrabajoForm } from "./TrabajoForm";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrabajosListProps {
  clienteId: string;
  onCreateProject: (trabajo: Trabajo) => void;
}

const estadoColors: Record<EstadoTrabajo, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  en_ejecucion: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  finalizado: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const tipoLabels: Record<TipoTrabajo, string> = {
  simple: "Simple",
  complejo: "Complejo",
  mantencion: "Mantención",
};

const estadoLabels: Record<EstadoTrabajo, string> = {
  pendiente: "Pendiente",
  en_ejecucion: "En Ejecución",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export function TrabajosList({ clienteId, onCreateProject }: TrabajosListProps) {
  const { data: trabajos, isLoading } = useTrabajosByCliente(clienteId);
  const eliminarTrabajo = useEliminarTrabajo();
  const [showForm, setShowForm] = useState(false);
  const [trabajoEditar, setTrabajoEditar] = useState<Trabajo | null>(null);
  const [trabajoVer, setTrabajoVer] = useState<Trabajo | null>(null);
  const [trabajoEliminar, setTrabajoEliminar] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (trabajoEliminar) {
      eliminarTrabajo.mutate(trabajoEliminar, {
        onSuccess: () => setTrabajoEliminar(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cargando trabajos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Trabajo
        </Button>
      </div>

      {!trabajos || trabajos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay trabajos registrados</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crea un nuevo trabajo para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trabajos.map((trabajo) => (
            <Card key={trabajo.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{trabajo.nombre_trabajo}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{tipoLabels[trabajo.tipo_trabajo]}</Badge>
                      <Badge className={estadoColors[trabajo.estado]}>
                        {estadoLabels[trabajo.estado]}
                      </Badge>
                      {trabajo.origen === "portal" && (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300">
                          Portal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrabajoVer(trabajo)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTrabajoEditar(trabajo);
                        setShowForm(true);
                      }}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrabajoEliminar(trabajo.id)}
                      title="Eliminar"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateProject(trabajo)}
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Crear Proyecto
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {trabajo.descripcion && (
                  <p className="text-sm text-muted-foreground mb-3">{trabajo.descripcion}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {trabajo.fecha_inicio_estimada && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Inicio: {new Date(trabajo.fecha_inicio_estimada).toLocaleDateString()}</span>
                    </div>
                  )}
                  {trabajo.fecha_fin_estimada && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Fin: {new Date(trabajo.fecha_fin_estimada).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {trabajo.proyectos && trabajo.proyectos.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Proyectos vinculados:</p>
                    <div className="flex flex-wrap gap-2">
                      {trabajo.proyectos.map((p) => (
                        <Badge key={p.id} variant="secondary">{p.nombre}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TrabajoForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setTrabajoEditar(null);
        }}
        clienteId={clienteId}
        trabajo={trabajoEditar}
      />

      {/* Dialog Ver Detalle */}
      <Dialog open={!!trabajoVer} onOpenChange={(open) => !open && setTrabajoVer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{trabajoVer?.nombre_trabajo}</DialogTitle>
          </DialogHeader>
          {trabajoVer && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{tipoLabels[trabajoVer.tipo_trabajo]}</Badge>
                <Badge className={estadoColors[trabajoVer.estado]}>
                  {estadoLabels[trabajoVer.estado]}
                </Badge>
              </div>
              {trabajoVer.descripcion && (
                <div>
                  <p className="text-sm font-medium mb-1">Descripción</p>
                  <p className="text-sm text-muted-foreground">{trabajoVer.descripcion}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {trabajoVer.fecha_inicio_estimada && (
                  <div>
                    <p className="text-sm font-medium mb-1">Fecha inicio estimada</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trabajoVer.fecha_inicio_estimada).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {trabajoVer.fecha_fin_estimada && (
                  <div>
                    <p className="text-sm font-medium mb-1">Fecha fin estimada</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trabajoVer.fecha_fin_estimada).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {trabajoVer.proyectos && trabajoVer.proyectos.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Proyectos vinculados</p>
                  <div className="flex flex-wrap gap-2">
                    {trabajoVer.proyectos.map((p) => (
                      <Badge key={p.id} variant="secondary">{p.nombre}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog Eliminar */}
      <AlertDialog open={!!trabajoEliminar} onOpenChange={() => setTrabajoEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El trabajo será eliminado permanentemente.
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
