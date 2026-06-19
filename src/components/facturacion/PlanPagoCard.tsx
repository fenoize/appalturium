import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle2, CircleDollarSign } from "lucide-react";
import { usePlanPagos, type EstadoCuota } from "@/hooks/usePlanPagos";

interface Props {
  documentoId: string;
  moneda?: string;
  onRegistrarPagoCuota: (cuota: { id: string; numero_cuota: number; monto_esperado: number }) => void;
}

const estadoMeta: Record<EstadoCuota, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pendiente: { label: "Pendiente", variant: "outline" },
  pagada: { label: "Pagada", variant: "default" },
  vencida: { label: "Vencida", variant: "destructive" },
};

function fmt(monto: number, moneda = "CLP") {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(monto);
}

export function PlanPagoCard({ documentoId, moneda = "CLP", onRegistrarPagoCuota }: Props) {
  const { data: cuotas, isLoading } = usePlanPagos(documentoId);

  if (isLoading) return null;
  if (!cuotas || cuotas.length === 0) return null;

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
                  {fmt(Number(c.monto_esperado), moneda)}
                  {c.fecha_esperada && (
                    <> · Vence {new Date(c.fecha_esperada).toLocaleDateString("es-CL")}</>
                  )}
                </div>
              </div>
              {c.estado === "pagada" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onRegistrarPagoCuota({
                      id: c.id,
                      numero_cuota: c.numero_cuota,
                      monto_esperado: Number(c.monto_esperado),
                    })
                  }
                >
                  <CircleDollarSign className="h-4 w-4 mr-1" />
                  Registrar pago de esta cuota
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
