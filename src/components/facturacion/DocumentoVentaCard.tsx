import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, DollarSign, Calendar } from "lucide-react";
import { DocumentoVenta } from "@/hooks/useDocumentosVenta";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";

interface DocumentoVentaCardProps {
  documento: DocumentoVenta;
  onRegistrarPago?: () => void;
}

const tipoBadge = {
  boleta: { label: "Boleta", variant: "default" as const },
  factura: { label: "Factura", variant: "default" as const },
  nota_credito: { label: "N. Crédito", variant: "secondary" as const },
  nota_debito: { label: "N. Débito", variant: "secondary" as const },
  otro: { label: "Otro", variant: "outline" as const },
};

export function DocumentoVentaCard({
  documento,
  onRegistrarPago,
}: DocumentoVentaCardProps) {
  const tipoConfig = tipoBadge[documento.tipo];
  const porcentajePagado = ((documento.total - documento.saldo) / documento.total) * 100;
  const estaPagado = documento.saldo === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">{documento.numero}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(documento.fecha), "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <Badge variant={tipoConfig.variant}>
            {tipoConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Montos */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Moneda</span>
            <span className="font-medium">{documento.moneda}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">{formatCurrency(documento.total, documento.moneda)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Saldo</span>
            <span className={cn(
              "text-lg font-semibold",
              estaPagado ? "text-green-500" : "text-destructive"
            )}>
              {formatCurrency(documento.saldo, documento.moneda)}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Estado de pago</span>
            <span>{porcentajePagado.toFixed(0)}%</span>
          </div>
          <Progress 
            value={porcentajePagado} 
            className={cn(
              "h-2",
              estaPagado && "bg-green-100 dark:bg-green-900"
            )}
          />
        </div>

        {/* Badge de estado */}
        <div>
          {estaPagado ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              Pagado
            </Badge>
          ) : porcentajePagado > 0 ? (
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
              Pago Parcial
            </Badge>
          ) : (
            <Badge variant="destructive">
              Pendiente
            </Badge>
          )}
        </div>

        {/* Notas */}
        {documento.notas && (
          <p className="text-sm text-muted-foreground border-t pt-2">
            {documento.notas}
          </p>
        )}

        {/* Botón registrar pago */}
        {!estaPagado && onRegistrarPago && (
          <Button onClick={onRegistrarPago} size="sm" className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
