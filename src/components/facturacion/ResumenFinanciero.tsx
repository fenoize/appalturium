import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Presupuesto } from "@/hooks/usePresupuestos";
import { DocumentoVenta } from "@/hooks/useDocumentosVenta";
import { OrdenServicio } from "@/hooks/useOrdenesServicio";
import { formatCurrency } from "@/lib/formatCurrency";

interface ResumenFinancieroProps {
  ordenServicio?: OrdenServicio;
  presupuesto?: Presupuesto | null;
  documentos: DocumentoVenta[];
}

export function ResumenFinanciero({
  ordenServicio,
  presupuesto,
  documentos,
}: ResumenFinancieroProps) {
  const moneda = presupuesto?.moneda || "CLP";
  const presupuestado = presupuesto?.total || 0;
  const costosReales = ordenServicio?.costos_real || 0;
  const totalFacturado = documentos.reduce((acc, doc) => acc + doc.total, 0);
  const totalCobrado = documentos.reduce((acc, doc) => acc + (doc.total - doc.saldo), 0);
  const saldoPendiente = documentos.reduce((acc, doc) => acc + doc.saldo, 0);

  const variacion = costosReales > 0 ? presupuestado - costosReales : 0;
  const variacionPorcentaje = costosReales > 0 ? (variacion / costosReales) * 100 : 0;

  const metricas = [
    {
      titulo: "Presupuestado",
      valor: presupuestado,
      icon: DollarSign,
      color: "text-blue-500",
    },
    {
      titulo: "Costos Reales",
      valor: costosReales,
      icon: variacion >= 0 ? TrendingDown : TrendingUp,
      color: variacion >= 0 ? "text-green-500" : "text-destructive",
      subtitulo: costosReales > 0 ? `${variacion >= 0 ? '+' : ''}${variacionPorcentaje.toFixed(1)}%` : undefined,
    },
    {
      titulo: "Total Facturado",
      valor: totalFacturado,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      titulo: "Total Cobrado",
      valor: totalCobrado,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      titulo: "Saldo Pendiente",
      valor: saldoPendiente,
      icon: AlertCircle,
      color: saldoPendiente > 0 ? "text-amber-500" : "text-muted-foreground",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Financiero</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {metricas.map((metrica) => {
            const Icon = metrica.icon;
            return (
              <div key={metrica.titulo} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${metrica.color}`} />
                  <p className="text-sm text-muted-foreground">{metrica.titulo}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrica.valor, moneda)}
                  </p>
                  {metrica.subtitulo && (
                    <p className={`text-sm ${metrica.color}`}>
                      {metrica.subtitulo}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
