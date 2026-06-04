import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlanesProximos } from "@/hooks/usePlanesMantenimiento";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export function MantencionesProximas() {
  const { data: planes = [], isLoading } = usePlanesProximos(30);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-5 w-5" />
          Mantenciones próximas (30 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : planes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay mantenciones planificadas en los próximos 30 días.
          </p>
        ) : (
          <ul className="divide-y">
            {planes.map((plan) => {
              const dias = differenceInDays(new Date(plan.proxima_fecha), new Date());
              const urgencia =
                dias <= 3
                  ? "destructive"
                  : dias <= 7
                  ? "default"
                  : "secondary";
              return (
                <li key={plan.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/inventario/equipos/${plan.equipo?.id}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {plan.equipo?.codigo_qr}
                      {plan.equipo?.marca ? ` · ${plan.equipo.marca}` : ""}
                      {plan.equipo?.modelo ? ` ${plan.equipo.modelo}` : ""}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(plan.proxima_fecha), "dd MMM yyyy", { locale: es })} ·{" "}
                      {plan.frecuencia}
                    </p>
                  </div>
                  <Badge variant={urgencia as any}>
                    {dias <= 0 ? "Hoy" : `en ${dias}d`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
