import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Building2, FolderKanban, Phone, Mail, Calendar, DollarSign, Clock } from "lucide-react";
import type { Servicio } from "@/hooks/useServicios";
import { formatCurrency } from "@/lib/formatCurrency";

interface ServicioCardProps {
  servicio: Servicio;
  onEdit: (servicio: Servicio) => void;
  onDelete: (id: string) => void;
}

const estadoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  activo: { label: "Activo", variant: "default" },
  pausado: { label: "Pausado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  finalizado: { label: "Finalizado", variant: "outline" },
};

const tipoLabels: Record<string, string> = {
  mantencion: "Mantención",
  consultoria: "Consultoría",
  soporte: "Soporte",
  desarrollo: "Desarrollo",
  instalacion: "Instalación",
  capacitacion: "Capacitación",
  otro: "Otro",
};

const frecuenciaLabels: Record<string, string> = {
  unico: "Único",
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export function ServicioCard({ servicio, onEdit, onDelete }: ServicioCardProps) {
  const estadoInfo = estadoConfig[servicio.estado] || { label: servicio.estado, variant: "outline" as const };

  return (
    <Card className={`transition-all hover:shadow-md ${!servicio.activo ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{servicio.nombre}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{servicio.codigo}</span>
              <Badge variant="outline">{tipoLabels[servicio.tipo]}</Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(servicio)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(servicio.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
          {servicio.renovacion_automatica && (
            <Badge variant="outline" className="text-xs">Renovación Auto</Badge>
          )}
        </div>

        {servicio.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">{servicio.descripcion}</p>
        )}

        <div className="grid gap-2 text-sm">
          {servicio.proveedor && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{servicio.proveedor.nombre_fantasia || servicio.proveedor.razon_social}</span>
            </div>
          )}

          {servicio.proyecto && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              <span>{servicio.proyecto.nombre}</span>
            </div>
          )}

          {servicio.monto_base > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                {formatCurrency(servicio.monto_base, servicio.moneda)} / {frecuenciaLabels[servicio.frecuencia_facturacion]}
              </span>
            </div>
          )}

          {(servicio.fecha_inicio_contrato || servicio.fecha_fin_contrato) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {servicio.fecha_inicio_contrato && new Date(servicio.fecha_inicio_contrato).toLocaleDateString("es-CL")}
                {servicio.fecha_inicio_contrato && servicio.fecha_fin_contrato && " - "}
                {servicio.fecha_fin_contrato && new Date(servicio.fecha_fin_contrato).toLocaleDateString("es-CL")}
              </span>
            </div>
          )}

          {(servicio.sla_tiempo_respuesta_horas || servicio.sla_tiempo_resolucion_horas) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                {servicio.sla_tiempo_respuesta_horas && `Resp: ${servicio.sla_tiempo_respuesta_horas}h`}
                {servicio.sla_tiempo_respuesta_horas && servicio.sla_tiempo_resolucion_horas && " | "}
                {servicio.sla_tiempo_resolucion_horas && `Resol: ${servicio.sla_tiempo_resolucion_horas}h`}
              </span>
            </div>
          )}

          {servicio.contacto_nombre && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{servicio.contacto_nombre}</span>
            </div>
          )}

          {servicio.contacto_email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{servicio.contacto_email}</span>
            </div>
          )}
        </div>

        {servicio.etiquetas && servicio.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {servicio.etiquetas.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
