import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KPIData } from "@/hooks/useReportes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReportesTableProps {
  data: KPIData[];
}

function getSemaforoColor(semaforo?: string) {
  switch (semaforo) {
    case 'verde':
      return 'bg-success text-success-foreground';
    case 'amarillo':
      return 'bg-warning text-warning-foreground';
    case 'rojo':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getSemaforoLabel(semaforo?: string) {
  switch (semaforo) {
    case 'verde':
      return '✓ Cumple';
    case 'amarillo':
      return '~ Tolerancia';
    case 'rojo':
      return '✗ Excedido';
    default:
      return 'Sin dato';
  }
}

function formatMinutes(minutes?: number) {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function ReportesTable({ data }: ReportesTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay datos para mostrar con los filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OT</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo Trabajo</TableHead>
            <TableHead>Comuna</TableHead>
            <TableHead className="text-right">TTR</TableHead>
            <TableHead className="text-right">TTS</TableHead>
            <TableHead className="text-center">Cumplimiento</TableHead>
            <TableHead className="text-right">Facturado</TableHead>
            <TableHead className="text-right">Margen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.ot_id}>
              <TableCell className="font-medium">{row.ot_numero}</TableCell>
              <TableCell>
                {format(new Date(row.fecha_creacion), "dd/MM/yyyy", { locale: es })}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {row.cliente_razon_social || row.cliente_nombre || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {row.tipo_trabajo}
                </Badge>
              </TableCell>
              <TableCell>{row.comuna || 'N/A'}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatMinutes(row.tiempo_respuesta_min)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatMinutes(row.tiempo_servicio_min)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn("font-medium", getSemaforoColor(row.semaforo))}>
                  {getSemaforoLabel(row.semaforo)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                ${row.facturado.toLocaleString('es-CL')}
              </TableCell>
              <TableCell className={cn(
                "text-right font-mono font-medium",
                row.margen > 0 ? "text-success" : row.margen < 0 ? "text-destructive" : ""
              )}>
                ${row.margen.toLocaleString('es-CL')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
