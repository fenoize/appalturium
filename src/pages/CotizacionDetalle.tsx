import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCotizacion, useCambiarEstadoCotizacion, useAsignarOTaCotizacion, EstadoCotizacion } from "@/hooks/useCotizaciones";
import { useCrearOrdenServicio } from "@/hooks/useOrdenesServicio";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight,
  Copy,
  Mail,
  Link,
  ClipboardList,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoConfig: Record<EstadoCotizacion, { label: string; color: string; icon: any }> = {
  borrador: { label: "Borrador", color: "bg-gray-500", icon: FileText },
  en_revision: { label: "En Revisión", color: "bg-blue-500", icon: Clock },
  aceptada: { label: "Aceptada", color: "bg-green-500", icon: CheckCircle },
  rechazada: { label: "Rechazada", color: "bg-red-500", icon: XCircle },
  asignada_ot: { label: "Asignada a OT", color: "bg-purple-500", icon: ArrowRight },
};

export default function CotizacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cotizacion, isLoading } = useCotizacion(id);
  const cambiarEstado = useCambiarEstadoCotizacion();
  const asignarOT = useAsignarOTaCotizacion();
  const crearOT = useCrearOrdenServicio();

  const [showEnviar, setShowEnviar] = useState(false);
  const [showCrearOT, setShowCrearOT] = useState(false);
  const [otDescripcion, setOtDescripcion] = useState("");
  const [otUbicacionId, setOtUbicacionId] = useState<string>("");
  const [otTipoTrabajo, setOtTipoTrabajo] = useState<string>("Servicio");
  const [otPrioridad, setOtPrioridad] = useState<"baja" | "media" | "alta" | "urgente">("media");

  const clienteId = cotizacion?.cliente?.id;

  const { data: ubicaciones } = useQuery({
    queryKey: ["ubicaciones", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ubicaciones")
        .select("*")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId && showCrearOT,
  });

  useEffect(() => {
    if (showCrearOT && cotizacion && !otDescripcion) {
      const itemsDesc = cotizacion.items?.map(i => i.descripcion).join(", ") || "";
      setOtDescripcion(`Cotización ${cotizacion.numero}${itemsDesc ? `: ${itemsDesc}` : ""}`);
    }
  }, [showCrearOT, cotizacion]);

  useEffect(() => {
    if (ubicaciones && ubicaciones.length > 0 && !otUbicacionId) {
      const principal = ubicaciones.find((u: any) => u.es_principal) || ubicaciones[0];
      setOtUbicacionId(principal.id);
    }
  }, [ubicaciones]);

  if (isLoading) {
    return <div className="p-8 text-center">Cargando cotización...</div>;
  }

  if (!cotizacion) {
    return <div className="p-8 text-center">Cotización no encontrada</div>;
  }

  const estadoInfo = estadoConfig[cotizacion.estado];
  const Icon = estadoInfo.icon;

  const getClienteNombre = () => {
    if (!cotizacion.cliente) return "Sin cliente";
    return cotizacion.cliente.tipo === 'empresa' 
      ? cotizacion.cliente.razon_social 
      : `${cotizacion.cliente.nombres || ''} ${cotizacion.cliente.apellidos || ''}`.trim();
  };

  const handleEnviarRevision = async () => {
    try {
      await cambiarEstado.mutateAsync({
        id: cotizacion.id,
        estado: 'en_revision',
      });
      setShowEnviar(false);
    } catch (error) {
      // Error manejado en hook
    }
  };

  const handleCopiarEnlace = () => {
    const url = `${window.location.origin}/cotizacion-publica/${cotizacion.token_acceso}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace copiado al portapapeles" });
  };

  const handleCrearOT = async () => {
    if (!cotizacion.cliente?.id) {
      toast({ title: "La cotización debe tener un cliente asignado", variant: "destructive" });
      return;
    }
    if (!otUbicacionId) {
      toast({ title: "Selecciona una ubicación", variant: "destructive" });
      return;
    }

    try {
      const nuevaOT = await crearOT.mutateAsync({
        cliente_id: cotizacion.cliente.id,
        ubicacion_id: otUbicacionId,
        tipo_trabajo: otTipoTrabajo,
        descripcion: otDescripcion,
        prioridad: otPrioridad,
      } as any);

      await asignarOT.mutateAsync({
        cotizacionId: cotizacion.id,
        otId: nuevaOT.id,
      });

      setShowCrearOT(false);
      toast({ title: "Orden de servicio creada y asignada" });
      navigate(`/ordenes-servicio/${nuevaOT.id}`);
    } catch (error) {
      // Error manejado en hook
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{cotizacion.numero}</h1>
              <Badge className={`${estadoInfo.color} text-white`}>
                <Icon className="h-3 w-3 mr-1" />
                {estadoInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Creada el {format(new Date(cotizacion.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Botón editar disponible hasta que se acepte */}
          {(cotizacion.estado === 'borrador' || cotizacion.estado === 'en_revision') && (
            <Button variant="outline" onClick={() => navigate(`/cotizaciones/${cotizacion.id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}

          {cotizacion.estado === 'borrador' && (
            <Dialog open={showEnviar} onOpenChange={setShowEnviar}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar al Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Cotización al Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Elige cómo quieres compartir esta cotización con el cliente:
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleCopiarEnlace}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Copiar enlace público
                    </Button>
                    
                    {cotizacion.cliente?.email && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          const url = `${window.location.origin}/cotizacion-publica/${cotizacion.token_acceso}`;
                          const subject = encodeURIComponent(`Cotización ${cotizacion.numero}`);
                          const body = encodeURIComponent(`Hola,\n\nPuedes revisar y aceptar la cotización en el siguiente enlace:\n${url}\n\nSaludos.`);
                          window.open(`mailto:${cotizacion.cliente?.email}?subject=${subject}&body=${body}`);
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Abrir cliente de correo
                      </Button>
                    )}
                  </div>

                  <Separator />
                  
                  <p className="text-sm text-muted-foreground">
                    El cliente podrá aceptar o rechazar la cotización sin necesidad de iniciar sesión.
                  </p>

                  <Button onClick={handleEnviarRevision} className="w-full">
                    Marcar como "En Revisión"
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {cotizacion.estado === 'aceptada' && !cotizacion.ot_id && (
            <Dialog open={showCrearOT} onOpenChange={setShowCrearOT}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-md">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Crear Orden de Servicio desde esta Cotización
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear Orden de Servicio</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Se creará una OT vinculada a la cotización <span className="font-medium">{cotizacion.numero}</span> para el cliente <span className="font-medium">{getClienteNombre()}</span>.
                  </p>

                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Select value={otUbicacionId} onValueChange={setOtUbicacionId}>
                      <SelectTrigger>
                        <SelectValue placeholder={ubicaciones?.length ? "Selecciona una ubicación" : "El cliente no tiene ubicaciones"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones?.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.alias} - {u.direccion}{u.comuna ? `, ${u.comuna}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tipo de trabajo</Label>
                      <Input
                        value={otTipoTrabajo}
                        onChange={(e) => setOtTipoTrabajo(e.target.value)}
                        placeholder="Servicio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select value={otPrioridad} onValueChange={(v: any) => setOtPrioridad(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción de la OT</Label>
                    <Textarea
                      value={otDescripcion}
                      onChange={(e) => setOtDescripcion(e.target.value)}
                      placeholder="Descripción del trabajo a realizar..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCrearOT(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCrearOT}
                    disabled={crearOT.isPending || asignarOT.isPending || !otUbicacionId}
                  >
                    {crearOT.isPending || asignarOT.isPending ? "Creando..." : "Crear y Vincular OT"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}


          {cotizacion.estado === 'en_revision' && (
            <Button variant="outline" onClick={handleCopiarEnlace}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Enlace
            </Button>
          )}

          {cotizacion.ot_id && cotizacion.orden_servicio && (
            <Button variant="outline" onClick={() => navigate(`/ordenes-servicio/${cotizacion.ot_id}`)}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Ver OT {cotizacion.orden_servicio.numero}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {cotizacion.cliente ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{getClienteNombre()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RUT</p>
                    <p className="font-medium">{cotizacion.cliente.rut}</p>
                  </div>
                  {cotizacion.cliente.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{cotizacion.cliente.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Sin cliente asignado</p>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-center">Desc.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacion.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.descripcion}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.tipo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.cantidad}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.precio_unitario, cotizacion.moneda)}
                      </TableCell>
                      <TableCell className="text-center">{item.descuento_pct}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal, cotizacion.moneda)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notas */}
          {(cotizacion.notas || cotizacion.condiciones) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas y Condiciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cotizacion.notas && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notas</p>
                    <p className="whitespace-pre-wrap">{cotizacion.notas}</p>
                  </div>
                )}
                {cotizacion.condiciones && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Condiciones</p>
                    <p className="whitespace-pre-wrap">{cotizacion.condiciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha Emisión</p>
                  <p className="font-medium">
                    {format(new Date(cotizacion.fecha_emision), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vencimiento</p>
                  <p className="font-medium">
                    {format(new Date(cotizacion.fecha_vencimiento), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Moneda</p>
                  <p className="font-medium">{cotizacion.moneda}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validez</p>
                  <p className="font-medium">{cotizacion.validez_dias} días</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cotizacion.subtotal, cotizacion.moneda)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCurrency(cotizacion.impuestos, cotizacion.moneda)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(cotizacion.total, cotizacion.moneda)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info de aceptación/rechazo */}
          {cotizacion.estado === 'aceptada' && cotizacion.aceptada_ts && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Cotización Aceptada</span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Por: {cotizacion.aceptada_por_nombre || "Cliente"}</p>
                  {cotizacion.aceptada_por_email && <p>Email: {cotizacion.aceptada_por_email}</p>}
                  <p>Fecha: {format(new Date(cotizacion.aceptada_ts), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {cotizacion.estado === 'rechazada' && cotizacion.rechazada_ts && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Cotización Rechazada</span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Fecha: {format(new Date(cotizacion.rechazada_ts), "dd/MM/yyyy HH:mm")}</p>
                  {cotizacion.rechazo_motivo && <p>Motivo: {cotizacion.rechazo_motivo}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
