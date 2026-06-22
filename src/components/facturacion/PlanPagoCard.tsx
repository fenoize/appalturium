import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { usePlanPagos, type EstadoCuota } from "@/hooks/usePlanPagos";
import { formatCurrency } from "@/lib/formatCurrency";

interface Props {
  documentoId: string;
  moneda?: string;
}

const estadoMeta: Record<EstadoCuota, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pendiente: { label: "Pendiente", variant: "outline" },
  pagada: { label: "Pagada", variant: "default" },
  vencida: { label: "Vencida", variant: "destructive" },
};

export function PlanPagoCard({ documentoId, moneda = "CLP" }: Props) {
  const { data: cuotas, isLoading } = usePlanPagos(documentoId);

  if (isLoading) return null;
  if (!cuotas || cuotas.length === 0) return null;

  const monedaSafe = (moneda as "CLP" | "UF" | "USD") || "CLP";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" /> Plan de pago ({cuotas.length} cuotas)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {cuotas.map((c) => {
          const meta = estadoMeta[c.estado];
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border rounded-md p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Cuota {c.numero_cuota}</span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(Number(c.monto_esperado), monedaSafe)}
                  {c.fecha_esperada && (
                    <> · Vence {new Date(c.fecha_esperada).toLocaleDateString("es-CL")}</>
                  )}
                </div>
              </div>
              {c.estado === "pagada" && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
