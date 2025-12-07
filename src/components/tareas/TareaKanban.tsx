import { Tarea } from "@/hooks/useTareas";
import { TareaCard } from "./TareaCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TareaKanbanProps {
  tareas: Tarea[];
  onEdit?: (tarea: Tarea) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (tarea: Tarea) => void;
  onViewComments?: (tarea: Tarea) => void;
}

const columnas = [
  { id: 'pendiente', label: 'Pendiente', className: 'border-t-muted-foreground' },
  { id: 'en_progreso', label: 'En Progreso', className: 'border-t-blue-500' },
  { id: 'revision', label: 'En Revisión', className: 'border-t-purple-500' },
  { id: 'completada', label: 'Completada', className: 'border-t-green-500' },
];

export function TareaKanban({ tareas, onEdit, onDelete, onToggleComplete, onViewComments }: TareaKanbanProps) {
  const getTareasByEstado = (estado: string) => {
    return tareas.filter(t => t.estado === estado);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columnas.map((columna) => {
        const tareasColumna = getTareasByEstado(columna.id);
        
        return (
          <div 
            key={columna.id}
            className={cn(
              "flex-shrink-0 w-80 bg-muted/30 rounded-lg border-t-4",
              columna.className
            )}
          >
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{columna.label}</h3>
                <Badge variant="secondary">{tareasColumna.length}</Badge>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="p-3 space-y-3">
                {tareasColumna.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sin tareas
                  </p>
                ) : (
                  tareasColumna.map((tarea) => (
                    <TareaCard
                      key={tarea.id}
                      tarea={tarea}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleComplete={onToggleComplete}
                      onViewComments={onViewComments}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
