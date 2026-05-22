import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, MapPin, Plus } from "lucide-react";
import { useOrdenesServicio, OrdenServicio } from "@/hooks/useOrdenesServicio";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

interface OrdenesServicioListProps {
  clienteId?: string;
  proyectoId?: string;
  tareaId?: string;
  limit?: number;
  showCreateButton?: boolean;
}

export function OrdenesServicioList({ 
  clienteId, 
  proyectoId, 
  tareaId,
  limit,
  showCreateButton = false 
}: OrdenesServicioListProps) {
  const navigate = useNavigate();
  const { data: ordenesResp, isLoading } = useOrdenesServicio({ cliente_id: clienteId });
  const ordenes = ordenesResp?.data;

  // Filter by proyecto or tarea if specified
  let filteredOrdenes = ordenes || [];
  if (proyectoId) {
    filteredOrdenes = filteredOrdenes.filter(o => o.proyecto_id === proyectoId);
  }
  if (tareaId) {
    filteredOrdenes = filteredOrdenes.filter(o => o.tarea_id === tareaId);
  }
  if (limit) {
    filteredOrdenes = filteredOrdenes.slice(0, limit);
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-4">Cargando órdenes...</p>;
  }

  if (filteredOrdenes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay órdenes de servicio</p>
          {showCreateButton && (
            <Button className="mt-4" onClick={() => navigate("/ordenes-servicio/nueva")}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {showCreateButton && (
        <div className="flex justify-end">
          <Button onClick={() => navigate("/ordenes-servicio/nueva")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      )}
      {filteredOrdenes.map((orden) => (
        <Card 
          key={orden.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/ordenes-servicio/${orden.id}`)}
        >
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{orden.numero}</span>
                  <StatusBadge status={orden.estado} />
                  <PriorityBadge priority={orden.prioridad} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {orden.descripcion}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {orden.ubicaciones && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {orden.ubicaciones.alias}
                    </span>
                  )}
                  {orden.fecha_programada_inicio && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(orden.fecha_programada_inicio), "dd MMM yyyy", { locale: es })}
                    </span>
                  )}
                  {orden.proyectos && (
                    <Badge variant="outline" className="text-xs">
                      {orden.proyectos.nombre}
                    </Badge>
                  )}
                  {orden.tareas && (
                    <Badge variant="secondary" className="text-xs">
                      {orden.tareas.titulo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
