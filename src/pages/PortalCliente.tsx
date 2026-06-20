import { useClienteData, useClienteOrdenes, useClienteDocumentos } from "@/hooks/useClienteData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Wrench, MapPin, Phone, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ordenes/StatusBadge";

export default function PortalCliente() {
  const navigate = useNavigate();
  const { data: cliente, isLoading: loadingCliente } = useClienteData();
  const { data: ordenes, isLoading: loadingOrdenes } = useClienteOrdenes();
  const { data: documentos, isLoading: loadingDocumentos } = useClienteDocumentos();

  if (loadingCliente) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const ordenesActivas = ordenes?.filter(o => !["finalizado", "cancelado"].includes(o.estado)) || [];
  const presupuestosPendientes = ordenes?.filter(o => 
    Array.isArray(o.presupuestos) && o.presupuestos.some((p: any) => p.estado === "enviado")
  ) || [];
  const saldoPendiente = documentos?.reduce((sum, doc) => sum + (doc.saldo || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal del Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido, {cliente?.tipo === "empresa" ? cliente.razon_social : `${cliente?.nombres} ${cliente?.apellidos}`}
        </p>
      </div>

      {/* Resumen de métricas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesActivas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En proceso o programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuestos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presupuestosPendientes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren su aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${saldoPendiente.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestione sus servicios y solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/portal-cliente/solicitar-mantencion")}>
            <Wrench className="mr-2 h-4 w-4" />
            Solicitar Mantención
          </Button>
          <Button variant="outline" onClick={() => navigate("/portal-cliente/ordenes")}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Mis Órdenes
          </Button>
          <Button variant="outline" onClick={() => navigate("/portal-cliente/documentos")}>
            <FileText className="mr-2 h-4 w-4" />
            Documentos y Pagos
          </Button>
          <Button variant="outline" onClick={() => navigate("/portal-cliente/perfil")}>
            <MapPin className="mr-2 h-4 w-4" />
            Editar Ubicaciones
          </Button>
        </CardContent>
      </Card>

      {/* Órdenes recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Servicio Recientes</CardTitle>
          <CardDescription>
            Sus últimas solicitudes y servicios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrdenes ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : ordenes?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tiene órdenes de servicio registradas
            </p>
          ) : (
            <div className="space-y-3">
              {ordenes?.slice(0, 5).map((orden) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/portal-cliente/ordenes/${orden.id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{orden.numero}</span>
                      <StatusBadge status={orden.estado} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {orden.tipo_trabajo} - {orden.ubicaciones?.alias}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.isArray(orden.presupuestos) && orden.presupuestos.some((p: any) => p.estado === "enviado") && (
                      <Badge variant="outline" className="border-warning text-warning">
                        Presupuesto pendiente
                      </Badge>
                    )}
                    {orden.informes_finales && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
