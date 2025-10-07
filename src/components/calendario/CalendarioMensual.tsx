import { format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { OrdenServicio } from "@/hooks/useOrdenesServicio";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CalendarioMensualProps {
  ordenes: OrdenServicio[];
  dias: Date[];
  currentDate: Date;
  onDiaClick: (fecha: Date) => void;
}

export function CalendarioMensual({ ordenes, dias, currentDate, onDiaClick }: CalendarioMensualProps) {
  const getOrdenesDelDia = (fecha: Date) => {
    return ordenes.filter(ot => {
      if (!ot.fecha_programada_inicio) return false;
      return isSameDay(new Date(ot.fecha_programada_inicio), fecha);
    });
  };

  const primerDia = startOfMonth(currentDate);

  return (
    <div className="space-y-4">
      {/* Encabezados de días */}
      <div className="grid grid-cols-7 gap-2">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => (
          <div key={dia} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {dia}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia, index) => {
          const ordenesDelDia = getOrdenesDelDia(dia);
          const esHoy = isSameDay(dia, new Date());
          const esMesActual = isSameMonth(dia, currentDate);

          return (
            <button
              key={index}
              onClick={() => onDiaClick(dia)}
              className={cn(
                "border rounded-lg p-2 min-h-[100px] text-left hover:bg-accent transition-colors",
                !esMesActual && "bg-muted/30 text-muted-foreground",
                esHoy && "ring-2 ring-primary"
              )}
            >
              <div className={cn(
                "text-sm font-semibold mb-1",
                esHoy && "text-primary"
              )}>
                {format(dia, "d", { locale: es })}
              </div>
              <div className="space-y-1">
                {ordenesDelDia.slice(0, 3).map((orden) => (
                  <Badge
                    key={orden.id}
                    variant="outline"
                    className="text-xs w-full justify-start truncate"
                  >
                    {orden.numero}
                  </Badge>
                ))}
                {ordenesDelDia.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{ordenesDelDia.length - 3} más
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
