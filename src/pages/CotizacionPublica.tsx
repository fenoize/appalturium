import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type TipoMoneda = "CLP" | "UF" | "USD";

interface CotizacionPublica {
  id: string;
  numero: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
  moneda: TipoMoneda;
  subtotal: number;
  impuestos: number;
  total: number;
  notas: string | null;
  condiciones: string | null;
  cliente: {
    razon_social: string | null;
    nombres: string | null;
    apellidos: string | null;
    tipo: string;
  } | null;
  items: {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento_pct: number;
    subtotal: number;
    tipo: string;
  }[];
}

export default function CotizacionPublica() {
  const { token } = useParams();
  const [cotizacion, setCotizacion] = useState<CotizacionPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAceptar, setShowAceptar] = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarCotizacion();
  }, [token]);

  const cargarCotizacion = async () => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }

    try {
      // Acceso público controlado: la edge function valida el token con service_role
      // y devuelve cotización + items. El cliente nunca accede a la tabla directamente.
      const resp = await fetch(
        `${FUNCTIONS_BASE}/respond-cotizacion?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        },
      );
      const body = await resp.json();
      if (!resp.ok) {
        setError(body?.error || "Cotización no encontrada o enlace inválido");
        setLoading(false);
        return;
      }
      setCotizacion(body as CotizacionPublica);
    } catch (err: any) {
      setError(err.message || "Error al cargar la cotización");
    } finally {
      setLoading(false);
    }
  };

  const responder = async (accion: "aceptar" | "rechazar") => {
    const { data, error } = await supabase.functions.invoke("respond-cotizacion", {
      body: {
        token_acceso: token,
        accion,
        nombre: accion === "aceptar" ? nombre : undefined,
        email: accion === "aceptar" ? email : undefined,
        motivo_rechazo: accion === "rechazar" ? motivoRechazo : undefined,
      },
    });
    if (error) {
      // Intentar extraer mensaje del body si vino como FunctionsHttpError
      let msg = error.message;
      try {
        const ctx: any = (error as any).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) msg = body.error;
        }
      } catch { /* ignore */ }
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleAceptar = async () => {
    if (!nombre || !email) {
      toast({ title: "Complete todos los campos", variant: "destructive" });
      return;
    }

    setProcesando(true);
    try {
      await responder("aceptar");
      toast({ title: "¡Cotización aceptada exitosamente!" });
      setShowAceptar(false);
      cargarCotizacion();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    setProcesando(true);
    try {
      await responder("rechazar");
      toast({ title: "Cotización rechazada" });
      setShowRechazar(false);
      cargarCotizacion();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando cotización...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground">{error || "Cotización no encontrada"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getClienteNombre = () => {
    if (!cotizacion.cliente) return "Cliente";
    return cotizacion.cliente.tipo === 'empresa' 
      ? cotizacion.cliente.razon_social 
      : `${cotizacion.cliente.nombres || ''} ${cotizacion.cliente.apellidos || ''}`.trim();
  };

  const vencida = new Date(cotizacion.fecha_vencimiento) < new Date();
  const puedeResponder = cotizacion.estado === 'en_revision' && !vencida;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Cotización {cotizacion.numero}</h1>
                <p className="text-muted-foreground">
                  Emitida el {format(new Date(cotizacion.fecha_emision), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {cotizacion.estado === 'en_revision' && (
                  <Badge className="bg-blue-500 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente de respuesta
                  </Badge>
                )}
                {cotizacion.estado === 'aceptada' && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aceptada
                  </Badge>
                )}
                {cotizacion.estado === 'rechazada' && (
                  <Badge className="bg-red-500 text-white">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rechazada
                  </Badge>
                )}
                
                {vencida && cotizacion.estado === 'en_revision' && (
                  <span className="text-sm text-red-500 font-medium">
                    Vencida el {format(new Date(cotizacion.fecha_vencimiento), "dd/MM/yyyy")}
                  </span>
                )}
                {!vencida && cotizacion.estado === 'en_revision' && (
                  <span className="text-sm text-muted-foreground">
                    Válida hasta {format(new Date(cotizacion.fecha_vencimiento), "dd/MM/yyyy")}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cliente Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estimado/a {getClienteNombre()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A continuación se presenta el detalle de nuestra cotización. 
              {puedeResponder && " Puede aceptar o rechazar esta propuesta utilizando los botones al final del documento."}
            </p>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle de la Cotización</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-center">Desc.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizacion.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.descripcion}</TableCell>
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

            <Separator className="my-4" />

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cotizacion.subtotal, cotizacion.moneda)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCurrency(cotizacion.impuestos, cotizacion.moneda)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(cotizacion.total, cotizacion.moneda)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas y Condiciones */}
        {(cotizacion.notas || cotizacion.condiciones) && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {cotizacion.notas && (
                <div>
                  <p className="font-medium mb-1">Notas</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{cotizacion.notas}</p>
                </div>
              )}
              {cotizacion.condiciones && (
                <div>
                  <p className="font-medium mb-1">Condiciones</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{cotizacion.condiciones}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        {puedeResponder && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowAceptar(true)}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Aceptar Cotización
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRechazar(true)}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Rechazar Cotización
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Diálogo Aceptar */}
        <Dialog open={showAceptar} onOpenChange={setShowAceptar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aceptar Cotización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Por favor, ingrese sus datos para confirmar la aceptación de esta cotización.
              </p>
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Su nombre"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="su@email.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAceptar(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAceptar} disabled={procesando}>
                {procesando ? "Procesando..." : "Confirmar Aceptación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Rechazar */}
        <Dialog open={showRechazar} onOpenChange={setShowRechazar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar Cotización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                ¿Está seguro que desea rechazar esta cotización?
              </p>
              <div>
                <Label>Motivo del rechazo (opcional)</Label>
                <Textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Indique el motivo..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRechazar(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRechazar} disabled={procesando}>
                {procesando ? "Procesando..." : "Confirmar Rechazo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
