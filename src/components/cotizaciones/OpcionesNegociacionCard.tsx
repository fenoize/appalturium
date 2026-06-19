import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  useCotizacionOpciones,
  usePresentarOpcion,
  type EstadoOpcion,
  type EtiquetaOpcion,
} from "@/hooks/useCotizacionOpciones";

const ETIQUETAS: EtiquetaOpcion[] = ["A", "B", "C"];

const estadoBadge: Record<EstadoOpcion, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
  pendiente: { label: "Pendiente", variant: "outline", icon: Clock },
  presentada: { label: "Presentada", variant: "default", icon: Send },
  aceptada: { label: "Aceptada", variant: "default", icon: CheckCircle },
  rechazada: { label: "Rechazada", variant: "destructive", icon: XCircle },
  descartada: { label: "Descartada", variant: "secondary", icon: XCircle },
};

interface Props {
  cotizacionId: string;
  moneda?: string;
  opcionActualId?: string | null;
}

export function OpcionesNegociacionCard({ cotizacionId, moneda = "CLP", opcionActualId }: Props) {
  const { data: opciones, isLoading } = useCotizacionOpciones(cotizacionId);
  const presentar = usePresentarOpcion();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Opciones de negociación</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hasta 3 alternativas (A/B/C) para presentar al cliente. La opción "actual" es la que ve el cliente.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando opciones…</p>
        ) : !opciones || opciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no se han generado opciones. Se generarán automáticamente al aprobar el presupuesto interno.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ETIQUETAS.map((etq) => {
              const op = opciones.find((o) => o.etiqueta === etq);
              if (!op) {
                return (
                  <div
                    key={etq}
                    className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground"
                  >
                    <p className="text-2xl font-bold mb-1">{etq}</p>
                    <p>No generada</p>
                  </div>
                );
              }
              const meta = estadoBadge[op.estado];
              const Icon = meta.icon;
              const esActual = opcionActualId === op.id;
              return (
                <div
                  key={op.id}
                  className={`border rounded-lg p-4 space-y-3 ${esActual ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{op.etiqueta}</span>
                      {esActual && <Badge>Actual</Badge>}
                    </div>
                    <Badge variant={meta.variant} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margen</span>
                      <span className="font-medium">{Number(op.margen_pct).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo base</span>
                      <span>{formatCurrency(op.costo_base, moneda as any)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(op.subtotal, moneda as any)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1 font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(op.total, moneda as any)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    variant={op.estado === "presentada" ? "secondary" : "default"}
                    disabled={presentar.isPending || op.estado === "aceptada" || op.estado === "rechazada"}
                    onClick={() => presentar.mutate(op)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {op.estado === "presentada" ? "Re-presentar" : "Presentar al cliente"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
