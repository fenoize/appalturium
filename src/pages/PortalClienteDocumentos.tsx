import { useClienteDocumentos } from "@/hooks/useClienteData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PortalClienteDocumentos() {
  const { data: documentos, isLoading } = useClienteDocumentos();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalFacturado = documentos?.reduce((sum, doc) => sum + doc.total, 0) || 0;
  const totalPagado = documentos?.reduce((sum, doc) => sum + (doc.total - doc.saldo), 0) || 0;
  const saldoPendiente = documentos?.reduce((sum, doc) => sum + doc.saldo, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentos y Pagos</h1>
        <p className="text-muted-foreground mt-2">
          Consulte sus facturas y estado de pagos
        </p>
      </div>

      {/* Resumen financiero */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalFacturado.toLocaleString("es-CL")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${totalPagado.toLocaleString("es-CL")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              ${saldoPendiente.toLocaleString("es-CL")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de documentos */}
      {documentos?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No tiene documentos registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documentos?.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{doc.numero}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {doc.tipo.replace("_", " ").toUpperCase()} - OT {doc.ordenes_servicio?.numero}
                      </p>
                    </div>
                  </div>
                  <Badge variant={doc.saldo > 0 ? "outline" : "default"}>
                    {doc.saldo > 0 ? "Pendiente" : "Pagado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha emisión:</span>
                    <span>{format(new Date(doc.fecha), "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">${doc.total.toLocaleString("es-CL")}</span>
                  </div>
                  {doc.saldo > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo pendiente:</span>
                      <span className="font-medium text-warning">
                        ${doc.saldo.toLocaleString("es-CL")}
                      </span>
                    </div>
                  )}

                  {/* Pagos */}
                  {doc.pagos && doc.pagos.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Pagos registrados</p>
                      <div className="space-y-2">
                        {doc.pagos.map((pago: any) => (
                          <div key={pago.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {format(new Date(pago.fecha), "d/MM/yyyy")} - {pago.metodo}
                            </span>
                            <span>${pago.monto.toLocaleString("es-CL")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {doc.pdf_url && (
                    <Button variant="outline" size="sm" asChild className="w-full mt-3">
                      <a href={doc.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
