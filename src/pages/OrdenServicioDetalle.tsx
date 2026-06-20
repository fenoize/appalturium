import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  DollarSign, 
  Receipt, 
  ClipboardList,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { useOrdenServicioDetalle } from "@/hooks/useOrdenServicioDetalle";
import { usePresupuestoOT, useCrearPresupuesto, useActualizarPresupuesto, useCambiarEstadoPresupuesto } from "@/hooks/usePresupuestos";
import { useDocumentosOT, useCrearDocumento } from "@/hooks/useDocumentosVenta";
import { usePagosDocumento, useRegistrarPago, useEliminarPago } from "@/hooks/usePagos";
import { PresupuestoForm } from "@/components/facturacion/PresupuestoForm";
import { PresupuestoCard } from "@/components/facturacion/PresupuestoCard";
import { DocumentoVentaForm } from "@/components/facturacion/DocumentoVentaForm";
import { DocumentoVentaCard } from "@/components/facturacion/DocumentoVentaCard";
import { PagoForm } from "@/components/facturacion/PagoForm";
import { PlanPagoCard } from "@/components/facturacion/PlanPagoCard";
import { useCrearPlanPagos, useVincularPagoCuota } from "@/hooks/usePlanPagos";
import { ListaPagos } from "@/components/facturacion/ListaPagos";
import { ResumenFinanciero } from "@/components/facturacion/ResumenFinanciero";
import { ComunicacionesTimeline } from "@/components/comunicaciones/ComunicacionesTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ordenes/StatusBadge";
import { PriorityBadge } from "@/components/ordenes/PriorityBadge";
import { InformeFinalForm } from "@/components/ordenes/InformeFinalForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AsignacionesPanel } from "@/components/ordenes/AsignacionesPanel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrdenServicioDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dialogPresupuesto, setDialogPresupuesto] = useState(false);
  const [dialogDocumento, setDialogDocumento] = useState(false);
  const [dialogPago, setDialogPago] = useState<
    | { documentoId: string; cuotaId?: string; numeroCuota?: number; monto?: number }
    | null
  >(null);

  const { data: ordenServicio, isLoading: loadingOT } = useOrdenServicioDetalle(id);
  const { data: presupuesto, isLoading: loadingPresupuesto } = usePresupuestoOT(id);
  const { data: documentos = [], isLoading: loadingDocumentos } = useDocumentosOT(id);

  const crearPresupuesto = useCrearPresupuesto();
  const actualizarPresupuesto = useActualizarPresupuesto();
  const cambiarEstadoPresupuesto = useCambiarEstadoPresupuesto();
  const crearDocumento = useCrearDocumento();
  const registrarPago = useRegistrarPago();
  const eliminarPago = useEliminarPago();
  const crearPlanPagos = useCrearPlanPagos();
  const vincularPagoCuota = useVincularPagoCuota();
  const queryClient = useQueryClient();
  const { data: estadosOT } = useParametrosSistema("service_statuses");
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!ordenServicio || nuevoEstado === ordenServicio.estado) return;
    setCambiandoEstado(true);
    const estadoAnterior = ordenServicio.estado;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error: updError } = await supabase
        .from("ordenes_servicio")
        .update({ estado: nuevoEstado })
        .eq("id", ordenServicio.id);
      if (updError) throw updError;

      // El log de cambio de estado lo inserta automáticamente el trigger
      // `ot_log_cambio_estado` en la base de datos. No insertar aquí para evitar duplicados.

      await queryClient.invalidateQueries({ queryKey: ["orden_servicio_detalle", ordenServicio.id] });
      await queryClient.invalidateQueries({ queryKey: ["ordenes_servicio"] });
      toast.success("Estado actualizado", {
        description: `La OT pasó de "${estadoAnterior}" a "${nuevoEstado}"`,
      });
    } catch (err: any) {
      toast.error("Error al cambiar estado", { description: err.message });
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (loadingOT) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!ordenServicio) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Orden de servicio no encontrada</p>
        <Button onClick={() => navigate("/ordenes-servicio")} className="mt-4">
          Volver a Órdenes
        </Button>
      </div>
    );
  }

  const handleCrearPresupuesto = (data: any) => {
    crearPresupuesto.mutate(
      { ...data, ot_id: id },
      {
        onSuccess: () => {
          setDialogPresupuesto(false);
        },
      }
    );
  };

  const handleEnviarPresupuesto = () => {
    if (presupuesto) {
      cambiarEstadoPresupuesto.mutate({ id: presupuesto.id, estado: "enviado" });
    }
  };

  const handleAprobarPresupuesto = () => {
    if (presupuesto) {
      cambiarEstadoPresupuesto.mutate({ id: presupuesto.id, estado: "aprobado" });
    }
  };

  const handleRechazarPresupuesto = () => {
    if (presupuesto) {
      cambiarEstadoPresupuesto.mutate({ id: presupuesto.id, estado: "rechazado" });
    }
  };

  const handleCrearDocumento = (data: any) => {
    const { plan_cuotas, cuota1_monto, cuota1_fecha, cuota2_monto, cuota2_fecha, ...docData } = data;
    crearDocumento.mutate(
      { ...docData, ot_id: id },
      {
        onSuccess: async (doc: any) => {
          if (plan_cuotas === "2" && doc?.id) {
            await crearPlanPagos.mutateAsync({
              documentoId: doc.id,
              cuotas: [
                { numero_cuota: 1, monto_esperado: Number(cuota1_monto), fecha_esperada: cuota1_fecha || null },
                { numero_cuota: 2, monto_esperado: Number(cuota2_monto), fecha_esperada: cuota2_fecha || null },
              ],
            });
          }
          setDialogDocumento(false);
        },
      }
    );
  };

  const handleRegistrarPago = (documentoId: string, data: any, cuotaId?: string) => {
    registrarPago.mutate(
      { ...data, documento_id: documentoId },
      {
        onSuccess: async (pago: any) => {
          if (cuotaId && pago?.id) {
            await vincularPagoCuota.mutateAsync({ cuotaId, pagoId: pago.id });
          }
          setDialogPago(null);
        },
      }
    );
  };

  const clienteNombre = ordenServicio.clientes?.razon_social || 
    `${ordenServicio.clientes?.nombres || ''} ${ordenServicio.clientes?.apellidos || ''}`.trim();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/ordenes-servicio")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Órdenes
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{ordenServicio.numero}</h1>
            <p className="text-muted-foreground mt-1">{clienteNombre}</p>
            <p className="text-sm text-muted-foreground">
              {ordenServicio.ubicaciones?.alias} - {ordenServicio.ubicaciones?.direccion}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ordenServicio.estado} />
            <PriorityBadge priority={ordenServicio.prioridad} />
            <Select
              value={ordenServicio.estado}
              onValueChange={handleCambiarEstado}
              disabled={cambiandoEstado}
            >
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                {estadosOT?.map((estado) => (
                  <SelectItem key={estado.key} value={estado.key}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={validTabs.includes(searchParams.get("tab") || "") ? (searchParams.get("tab") as string) : "resumen"}
        onValueChange={(v) => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set("tab", v); return p; }, { replace: true })}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="resumen">
            <ClipboardList className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="comunicaciones">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comunicaciones
          </TabsTrigger>
          <TabsTrigger value="asignaciones">
            <Users className="h-4 w-4 mr-2" />
            Asignaciones
          </TabsTrigger>
          <TabsTrigger value="presupuesto">
            <FileText className="h-4 w-4 mr-2" />
            Presupuesto
          </TabsTrigger>
          <TabsTrigger value="facturacion">
            <Receipt className="h-4 w-4 mr-2" />
            Facturación
          </TabsTrigger>
          <TabsTrigger value="informe">
            <DollarSign className="h-4 w-4 mr-2" />
            Informe
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Trabajo</p>
                  <p className="font-medium">{ordenServicio.tipo_trabajo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Programada</p>
                  <p className="font-medium">
                    {ordenServicio.fecha_programada_inicio
                      ? format(new Date(ordenServicio.fecha_programada_inicio), "dd/MM/yyyy", { locale: es })
                      : "No programada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costos Estimado</p>
                  <p className="font-medium">
                    ${ordenServicio.costos_estimado?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costos Real</p>
                  <p className="font-medium">
                    ${ordenServicio.costos_real?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Descripción</p>
                <p className="text-sm">{ordenServicio.descripcion}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comunicaciones */}
        <TabsContent value="comunicaciones">
          <ComunicacionesTimeline otId={id!} />
        </TabsContent>

        {/* Tab: Asignaciones */}
        <TabsContent value="asignaciones">
          <AsignacionesPanel otId={id!} />
        </TabsContent>

        {/* Tab: Presupuesto */}
        <TabsContent value="presupuesto" className="space-y-6">
          {loadingPresupuesto ? (
            <Card>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : presupuesto ? (
            <PresupuestoCard
              presupuesto={presupuesto}
              onEnviar={handleEnviarPresupuesto}
              onAprobar={handleAprobarPresupuesto}
              onRechazar={handleRechazarPresupuesto}
              canEdit={true}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">No hay presupuesto creado para esta OT</p>
                <Button onClick={() => setDialogPresupuesto(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Crear Presupuesto
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Facturación */}
        <TabsContent value="facturacion" className="space-y-6">
          <ResumenFinanciero
            ordenServicio={ordenServicio as any}
            presupuesto={presupuesto}
            documentos={documentos}
          />

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Documentos de Venta</h3>
            <Button
              onClick={() => setDialogDocumento(true)}
              disabled={!presupuesto || presupuesto.estado !== "aprobado"}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Emitir Documento
            </Button>
          </div>

          {loadingDocumentos ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ) : documentos.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {documentos.map((documento) => (
                <div key={documento.id} className="space-y-4">
                  <DocumentoVentaCard
                    documento={documento}
                    onRegistrarPago={() => setDialogPago({ documentoId: documento.id })}
                  />
                  <PlanPagoCard
                    documentoId={documento.id}
                    moneda={documento.moneda}
                    onRegistrarPagoCuota={(cuota) =>
                      setDialogPago({
                        documentoId: documento.id,
                        cuotaId: cuota.id,
                        numeroCuota: cuota.numero_cuota,
                        monto: cuota.monto_esperado,
                      })
                    }
                  />
                  <ListaPagosDocumento documentoId={documento.id} />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No hay documentos emitidos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Informe */}
        <TabsContent value="informe">
          <InformeFinalForm otId={id!} />
        </TabsContent>
      </Tabs>

      {/* Dialog: Crear Presupuesto */}
      <Dialog open={dialogPresupuesto} onOpenChange={setDialogPresupuesto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Presupuesto</DialogTitle>
          </DialogHeader>
          <PresupuestoForm
            onSubmit={handleCrearPresupuesto}
            disabled={crearPresupuesto.isPending}
            initialMoneda={presupuesto?.moneda}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear Documento */}
      <Dialog open={dialogDocumento} onOpenChange={setDialogDocumento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir Documento de Venta</DialogTitle>
          </DialogHeader>
          <DocumentoVentaForm
            onSubmit={handleCrearDocumento}
            onCancel={() => setDialogDocumento(false)}
            presupuestoTotal={presupuesto?.total}
            moneda={presupuesto?.moneda}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Pago */}
      {dialogPago && (
        <Dialog open={!!dialogPago} onOpenChange={() => setDialogPago(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Registrar Pago
                {dialogPago.numeroCuota ? ` — Cuota ${dialogPago.numeroCuota}` : ""}
              </DialogTitle>
            </DialogHeader>
            <PagoForm
              documento={documentos.find((d) => d.id === dialogPago.documentoId)!}
              defaultMonto={dialogPago.monto}
              contexto={dialogPago.numeroCuota ? `Cuota ${dialogPago.numeroCuota}` : undefined}
              onSubmit={(data) => handleRegistrarPago(dialogPago.documentoId, data, dialogPago.cuotaId)}
              onCancel={() => setDialogPago(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ListaPagosDocumento({ documentoId }: { documentoId: string }) {
  const { data: pagos = [] } = usePagosDocumento(documentoId);
  const eliminarPago = useEliminarPago();

  if (pagos.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Pagos Registrados</h4>
      <ListaPagos
        pagos={pagos}
        onEliminar={(id) => eliminarPago.mutate(id)}
        canDelete={true}
      />
    </div>
  );
}
