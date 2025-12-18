import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Calendar, FolderPlus } from "lucide-react";
import { useTrabajosByCliente, Trabajo, EstadoTrabajo, TipoTrabajo } from "@/hooks/useTrabajos";
import { TrabajoForm } from "./TrabajoForm";

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
  const [showForm, setShowForm] = useState(false);

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
                    <div className="flex gap-2">
                      <Badge variant="outline">{tipoLabels[trabajo.tipo_trabajo]}</Badge>
                      <Badge className={estadoColors[trabajo.estado]}>
                        {estadoLabels[trabajo.estado]}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateProject(trabajo)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Crear Proyecto
                  </Button>
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
        onOpenChange={setShowForm}
        clienteId={clienteId}
      />
    </div>
  );
}
