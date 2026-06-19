import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wrench, Hammer, RefreshCw, ClipboardCheck, AlertTriangle, MoreHorizontal } from "lucide-react";
import { OrdenServicio } from "@/hooks/useOrdenesServicio";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { cn } from "@/lib/utils";

interface OTCardProps {
  orden: OrdenServicio;
  isDragging?: boolean;
}

const tipoTrabajoIcons: Record<string, any> = {
  mantenimiento: RefreshCw,
  reparacion: Wrench,
  instalacion: Hammer,
  inspeccion: ClipboardCheck,
  emergencia: AlertTriangle,
  otro: MoreHorizontal,
};

export function OTCard({ orden, isDragging }: OTCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: orden.id,
  });

  const { data: estados } = useParametrosSistema("service_statuses");
  const estadoData = estados?.find(e => e.key === orden.estado);
  
  const TipoIcon = tipoTrabajoIcons[orden.tipo_trabajo] || MoreHorizontal;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getNombreCliente = () => {
    if (orden.clientes?.razon_social) {
      return orden.clientes.razon_social;
    }
    if (orden.clientes?.nombres && orden.clientes?.apellidos) {
      return `${orden.clientes.nombres} ${orden.clientes.apellidos}`;
    }
    return "Cliente";
  };

  const getIniciales = (nombre: string) => {
    return nombre
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-2 cursor-move hover:shadow-lg transition-all duration-200",
        isDragging && "opacity-50 shadow-2xl scale-105",
        orden.estado === "en_curso" && "animate-pulse ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1 h-full rounded-full"
          style={{ backgroundColor: estadoData?.color || "hsl(var(--muted))" }}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TipoIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold">{orden.numero}</span>
            </div>
            <Badge
              variant="outline"
              className="text-xs py-0"
              style={{
                borderColor: estadoData?.color,
                color: estadoData?.color,
              }}
            >
              {estadoData?.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{getNombreCliente()}</p>
          <p className="text-xs line-clamp-2">{orden.descripcion}</p>
          <div className="flex items-center justify-between pt-1">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {getIniciales(getNombreCliente())}
              </AvatarFallback>
            </Avatar>
            {orden.prioridad === "urgente" && (
              <AlertTriangle className="h-3 w-3 text-destructive" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
