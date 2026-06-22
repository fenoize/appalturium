import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Pago } from "@/hooks/usePagos";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatCurrency";

interface ListaPagosProps {
  pagos: Pago[];
  onEliminar?: (pagoId: string) => void;
  canDelete?: boolean;
}

const metodoBadge = {
  transferencia: { label: "Transferencia", variant: "default" as const },
  tarjeta: { label: "Tarjeta", variant: "default" as const },
  efectivo: { label: "Efectivo", variant: "secondary" as const },
  cheque: { label: "Cheque", variant: "outline" as const },
  otro: { label: "Otro", variant: "outline" as const },
};

export function ListaPagos({ pagos, onEliminar, canDelete = false }: ListaPagosProps) {
  if (pagos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay pagos registrados
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Referencia</TableHead>
            {canDelete && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagos.map((pago) => {
            const metodoConfig = metodoBadge[pago.metodo];
            return (
              <TableRow key={pago.id}>
                <TableCell>
                  {format(new Date(pago.fecha), "dd/MM/yyyy", { locale: es })}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(pago.monto)}
                </TableCell>
                <TableCell>
                  <Badge variant={metodoConfig.variant}>
                    {metodoConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pago.referencia || "-"}
                </TableCell>
                {canDelete && onEliminar && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEliminar(pago.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="p-4 bg-muted/50 border-t">
        <div className="flex justify-between items-center font-semibold">
          <span>Total Pagado:</span>
          <span className="text-lg">
            {formatCurrency(pagos.reduce((acc, pago) => acc + pago.monto, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
