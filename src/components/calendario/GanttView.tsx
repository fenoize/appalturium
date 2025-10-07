import { format, differenceInDays, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { OrdenServicio } from "@/hooks/useOrdenesServicio";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { cn } from "@/lib/utils";

interface GanttViewProps {
  ordenes: OrdenServicio[];
  rangoFechas: { start: Date; end: Date };
}

export function GanttView({ ordenes, rangoFechas }: GanttViewProps) {
  const { data: estados } = useParametrosSistema("service_statuses");
  
  const dias = eachDayOfInterval(rangoFechas);
  const totalDias = dias.length;

  const ordenesConFechas = ordenes.filter(
    ot => ot.fecha_programada_inicio && ot.fecha_programada_fin
  );

  const getBarraPosition = (inicio: string, fin: string) => {
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    
    const offsetDias = differenceInDays(inicioDate, rangoFechas.start);
    const duracionDias = differenceInDays(finDate, inicioDate) + 1;
    
    const leftPercent = (offsetDias / totalDias) * 100;
    const widthPercent = (duracionDias / totalDias) * 100;
    
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getNombreCliente = (orden: OrdenServicio) => {
    if (orden.clientes?.razon_social) {
      return orden.clientes.razon_social;
    }
    if (orden.clientes?.nombres && orden.clientes?.apellidos) {
      return `${orden.clientes.nombres} ${orden.clientes.apellidos}`;
    }
    return "Cliente";
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      {/* Encabezado de fechas */}
      <div className="flex border-b pb-2">
        <div className="w-64 flex-shrink-0 font-semibold text-sm">Orden de Servicio</div>
        <div className="flex-1 relative">
          <div className="flex">
            {dias.map((dia, index) => (
              <div
                key={index}
                className="flex-1 text-center text-xs text-muted-foreground border-l first:border-l-0"
              >
                <div>{format(dia, "d", { locale: es })}</div>
                <div className="text-[10px]">{format(dia, "MMM", { locale: es })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filas de OT */}
      <div className="space-y-2">
        {ordenesConFechas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay OT programadas en este período
          </div>
        ) : (
          ordenesConFechas.map((orden) => {
            const estadoData = estados?.find(e => e.key === orden.estado);
            const position = getBarraPosition(
              orden.fecha_programada_inicio!,
              orden.fecha_programada_fin!
            );

            return (
              <div key={orden.id} className="flex items-center group hover:bg-accent/50 rounded transition-colors">
                <div className="w-64 flex-shrink-0 py-2 px-2 space-y-0.5">
                  <div className="text-sm font-semibold">{orden.numero}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {getNombreCliente(orden)}
                  </div>
                </div>
                <div className="flex-1 relative h-12 border-l">
                  {/* Líneas de guía */}
                  <div className="absolute inset-0 flex">
                    {dias.map((_, index) => (
                      <div key={index} className="flex-1 border-l first:border-l-0" />
                    ))}
                  </div>
                  
                  {/* Barra de la OT */}
                  <div
                    className={cn(
                      "absolute h-8 top-2 rounded-md flex items-center px-2 shadow-sm",
                      "group-hover:shadow-md transition-shadow cursor-pointer"
                    )}
                    style={{
                      ...position,
                      backgroundColor: estadoData?.color || "hsl(var(--muted))",
                      color: "white",
                    }}
                  >
                    <span className="text-xs font-medium truncate">
                      {orden.descripcion}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
