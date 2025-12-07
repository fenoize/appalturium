import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  User, 
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Tarea } from "@/hooks/useTareas";
import { cn } from "@/lib/utils";

interface TareaCardProps {
  tarea: Tarea;
  onEdit?: (tarea: Tarea) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (tarea: Tarea) => void;
  onViewComments?: (tarea: Tarea) => void;
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-muted text-muted-foreground" },
  en_progreso: { label: "En Progreso", className: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  revision: { label: "En Revisión", className: "bg-purple-500/20 text-purple-700 dark:text-purple-300" },
  completada: { label: "Completada", className: "bg-green-500/20 text-green-700 dark:text-green-300" },
  cancelada: { label: "Cancelada", className: "bg-destructive/20 text-destructive" },
};

const prioridadConfig: Record<string, { label: string; className: string }> = {
  baja: { label: "Baja", className: "bg-muted text-muted-foreground" },
  media: { label: "Media", className: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  alta: { label: "Alta", className: "bg-orange-500/20 text-orange-700 dark:text-orange-300" },
  urgente: { label: "Urgente", className: "bg-destructive/20 text-destructive" },
};

export function TareaCard({ tarea, onEdit, onDelete, onToggleComplete, onViewComments }: TareaCardProps) {
  const isCompleted = tarea.estado === 'completada';
  const isOverdue = tarea.fecha_vencimiento && isPast(new Date(tarea.fecha_vencimiento)) && !isCompleted;
  const isDueToday = tarea.fecha_vencimiento && isToday(new Date(tarea.fecha_vencimiento));

  return (
    <Card className={cn(
      "hover:shadow-smooth-md transition-all duration-200",
      isCompleted && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleComplete?.(tarea)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={cn(
                  "font-medium text-foreground",
                  isCompleted && "line-through"
                )}>
                  {tarea.titulo}
                </h4>
                {tarea.proyecto && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tarea.proyecto.nombre}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewComments?.(tarea)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comentarios
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(tarea)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(tarea.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {tarea.descripcion && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {tarea.descripcion}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge className={estadoConfig[tarea.estado]?.className}>
                {estadoConfig[tarea.estado]?.label || tarea.estado}
              </Badge>
              <Badge className={prioridadConfig[tarea.prioridad]?.className}>
                {prioridadConfig[tarea.prioridad]?.label || tarea.prioridad}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              {tarea.fecha_vencimiento && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive",
                  isDueToday && "text-orange-600 dark:text-orange-400"
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(tarea.fecha_vencimiento), "dd MMM", { locale: es })}
                    {isOverdue && " (Vencida)"}
                    {isDueToday && " (Hoy)"}
                  </span>
                </div>
              )}
              
              {tarea.horas_estimadas > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{tarea.horas_reales}/{tarea.horas_estimadas}h</span>
                </div>
              )}

              {tarea.asignado && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{tarea.asignado.nombre_completo}</span>
                </div>
              )}
            </div>

            {tarea.etiquetas && tarea.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tarea.etiquetas.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
