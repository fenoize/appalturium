import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  User, 
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Proyecto } from "@/hooks/useProyectos";

interface ProyectoCardProps {
  proyecto: Proyecto;
  onEdit?: (proyecto: Proyecto) => void;
  onDelete?: (id: string) => void;
  onView?: (proyecto: Proyecto) => void;
}

const estadoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planificacion: { label: "Planificación", variant: "outline" },
  en_progreso: { label: "En Progreso", variant: "default" },
  pausado: { label: "Pausado", variant: "secondary" },
  completado: { label: "Completado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const prioridadConfig: Record<string, { label: string; className: string }> = {
  baja: { label: "Baja", className: "bg-muted text-muted-foreground" },
  media: { label: "Media", className: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  alta: { label: "Alta", className: "bg-orange-500/20 text-orange-700 dark:text-orange-300" },
  urgente: { label: "Urgente", className: "bg-destructive/20 text-destructive" },
};

export function ProyectoCard({ proyecto, onEdit, onDelete, onView }: ProyectoCardProps) {
  const clienteNombre = proyecto.cliente?.razon_social || 
    (proyecto.cliente?.nombres ? `${proyecto.cliente.nombres} ${proyecto.cliente.apellidos || ''}`.trim() : null);

  return (
    <Card className="hover:shadow-smooth-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={estadoConfig[proyecto.estado]?.variant || "default"}>
                {estadoConfig[proyecto.estado]?.label || proyecto.estado}
              </Badge>
              <Badge className={prioridadConfig[proyecto.prioridad]?.className}>
                {prioridadConfig[proyecto.prioridad]?.label || proyecto.prioridad}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-foreground">{proyecto.nombre}</h3>
            {clienteNombre && (
              <p className="text-sm text-muted-foreground mt-1">{clienteNombre}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(proyecto)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(proyecto)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(proyecto.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {proyecto.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {proyecto.descripcion}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{proyecto.progreso}%</span>
          </div>
          <Progress value={proyecto.progreso} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {proyecto.fecha_fin_estimada && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(proyecto.fecha_fin_estimada), "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}
          {proyecto.presupuesto > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>${proyecto.presupuesto.toLocaleString()}</span>
            </div>
          )}
          {proyecto.responsable && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <User className="h-4 w-4" />
              <span>{proyecto.responsable.nombre_completo}</span>
            </div>
          )}
        </div>

        {proyecto.etiquetas && proyecto.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {proyecto.etiquetas.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
