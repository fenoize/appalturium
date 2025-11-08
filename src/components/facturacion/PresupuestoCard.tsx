import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Send, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Presupuesto } from "@/hooks/usePresupuestos";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatCurrency";

interface PresupuestoCardProps {
  presupuesto: Presupuesto;
  onEnviar?: () => void;
  onAprobar?: () => void;
  onRechazar?: () => void;
  canEdit?: boolean;
}

const estadoBadge = {
  borrador: { variant: "secondary" as const, label: "Borrador", icon: FileText },
  enviado: { variant: "default" as const, label: "Enviado", icon: Send },
  aprobado: { variant: "default" as const, label: "Aprobado", icon: CheckCircle },
  rechazado: { variant: "destructive" as const, label: "Rechazado", icon: XCircle },
};

export function PresupuestoCard({
  presupuesto,
  onEnviar,
  onAprobar,
  onRechazar,
  canEdit = false,
}: PresupuestoCardProps) {
  const estadoConfig = estadoBadge[presupuesto.estado];
  const EstadoIcon = estadoConfig.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Presupuesto
          </CardTitle>
          <Badge 
            variant={estadoConfig.variant}
            className={presupuesto.estado === "aprobado" ? "bg-green-500 hover:bg-green-600" : undefined}
          >
            <EstadoIcon className="h-3 w-3 mr-1" />
            {estadoConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totales */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Moneda</p>
            <p className="text-lg font-semibold">{presupuesto.moneda}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-lg font-semibold">{formatCurrency(presupuesto.subtotal, presupuesto.moneda)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">IVA (19%)</p>
            <p className="text-lg font-semibold">{formatCurrency(presupuesto.impuestos, presupuesto.moneda)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(presupuesto.total, presupuesto.moneda)}</p>
          </div>
        </div>

        {/* Detalles */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Válido por {presupuesto.validez_dias} días
            </span>
          </div>
          {presupuesto.items.length > 0 && (
            <div>
              <p className="font-medium mb-1">Items:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {presupuesto.items.map((item, index) => (
                  <li key={index}>
                    {item.concepto} ({item.cantidad}x {formatCurrency(item.precio_unit, presupuesto.moneda)})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {presupuesto.aprobado_ts && (
            <p className="text-muted-foreground">
              Aprobado el {format(new Date(presupuesto.aprobado_ts), "dd 'de' MMMM, yyyy", { locale: es })}
            </p>
          )}
        </div>

        {/* Acciones */}
        {canEdit && (
          <div className="flex gap-2 pt-4 border-t">
            {presupuesto.estado === "borrador" && onEnviar && (
              <Button onClick={onEnviar} size="sm" className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            )}
            {presupuesto.estado === "enviado" && (
              <>
                {onAprobar && (
                  <Button onClick={onAprobar} size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                )}
                {onRechazar && (
                  <Button onClick={onRechazar} size="sm" variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
