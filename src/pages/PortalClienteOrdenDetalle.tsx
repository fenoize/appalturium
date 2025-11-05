import { useParams, useNavigate } from "react-router-dom";
import { useOrdenServicioDetalle } from "@/hooks/useOrdenServicioDetalle";
import { usePresupuestoOT } from "@/hooks/usePresupuestos";
import { useInformeFinal } from "@/hooks/useOrdenServicioDetalle";
import { useDocumentosOT } from "@/hooks/useDocumentosVenta";
import { useAprobarPresupuesto } from "@/hooks/useClienteActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ordenes/StatusBadge";
import { ArrowLeft, Download, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PortalClienteOrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: orden, isLoading: loadingOrden } = useOrdenServicioDetalle(id!);
  const { data: presupuesto } = usePresupuestoOT(id);
  const { data: informe } = useInformeFinal(id!);
  const { data: documentos } = useDocumentosOT(id);
  const aprobarPresupuesto = useAprobarPresupuesto();

  if (loadingOrden) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/portal-cliente/ordenes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Alert>
          <AlertDescription>No se encontró la orden de servicio</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAprobarPresupuesto = () => {
    if (!presupuesto) return;
    aprobarPresupuesto.mutate({
      presupuestoId: presupuesto.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/portal-cliente/ordenes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{orden.numero}</h1>
          <StatusBadge status={orden.estado} />
        </div>
        <p className="text-muted-foreground">{orden.tipo_trabajo}</p>
      </div>

      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Descripción</p>
              <p className="text-sm text-muted-foreground">{orden.descripcion}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Ubicación</p>
              <p className="text-sm text-muted-foreground">
                {orden.ubicaciones?.alias} - {orden.ubicaciones?.direccion}, {orden.ubicaciones?.comuna}
              </p>
            </div>
            {orden.fecha_programada_inicio && (
              <div>
                <p className="text-sm font-medium">Fecha Programada</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(orden.fecha_programada_inicio), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Prioridad</p>
              <Badge variant={orden.prioridad === "urgente" ? "destructive" : "outline"}>
                {orden.prioridad}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presupuesto */}
      {presupuesto && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Presupuesto</CardTitle>
                <CardDescription>
                  Válido por {presupuesto.validez_dias} días
                </CardDescription>
              </div>
              <Badge
                variant={
                  presupuesto.estado === "aprobado" ? "default" :
                  presupuesto.estado === "enviado" ? "outline" :
                  "secondary"
                }
              >
                {presupuesto.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Detalle</p>
              <div className="border rounded-lg divide-y">
                {(presupuesto.items as any[])?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.descripcion}</p>
                      <p className="text-muted-foreground">
                        {item.cantidad} x ${item.precio_unitario?.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.cantidad * item.precio_unitario)?.toLocaleString("es-CL")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Mano de obra</span>
                <span>${presupuesto.mano_obra?.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Insumos</span>
                <span>${presupuesto.insumos?.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${presupuesto.subtotal?.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (19%)</span>
                <span>${presupuesto.impuestos?.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${presupuesto.total?.toLocaleString("es-CL")}</span>
              </div>
            </div>

            {/* Acción de aprobar */}
            {presupuesto.estado === "enviado" && (
              <Button
                className="w-full"
                onClick={handleAprobarPresupuesto}
                disabled={aprobarPresupuesto.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar Presupuesto
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informe final */}
      {informe && (
        <Card>
          <CardHeader>
            <CardTitle>Informe Final</CardTitle>
            <CardDescription>
              Generado el {format(new Date(informe.created_at), "d 'de' MMMM, yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Resumen Técnico</p>
              <p className="text-sm text-muted-foreground">{informe.resumen_tecnico}</p>
            </div>
            {informe.recomendaciones && (
              <div>
                <p className="text-sm font-medium mb-2">Recomendaciones</p>
                <p className="text-sm text-muted-foreground">{informe.recomendaciones}</p>
              </div>
            )}
            {informe.pdf_url && (
              <Button variant="outline" asChild>
                <a href={informe.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentos y pagos */}
      {documentos && documentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos de Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.tipo} - {format(new Date(doc.fecha), "d/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${doc.total?.toLocaleString("es-CL")}</p>
                    {doc.saldo > 0 && (
                      <p className="text-sm text-warning">
                        Saldo: ${doc.saldo?.toLocaleString("es-CL")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
