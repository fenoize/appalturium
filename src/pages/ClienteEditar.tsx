import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Building2, User } from "lucide-react";
import { formatRut } from "@/lib/rut-utils";

type Cliente = {
  id: string;
  tipo: "empresa" | "persona";
  razon_social: string | null;
  giro: string | null;
  nombres: string | null;
  apellidos: string | null;
  rut: string;
  email: string | null;
  telefono: string | null;
  sitio_web: string | null;
  industria: string | null;
  segmento: string;
  estado_cliente: string;
  notas: string | null;
  etiquetas: string[];
  condiciones_pago: string;
  credito_aprobado: boolean;
  credito_monto_max: number | null;
  lista_precios: string | null;
  descuento_acordado_pct: number | null;
  sla_prioridad: string;
  noti_email: boolean;
  noti_whatsapp: boolean;
  noti_resumen_mensual: boolean;
};

export default function ClienteEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basico");
  const [etiquetaInput, setEtiquetaInput] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState({
    razon_social: "",
    giro: "",
    nombres: "",
    apellidos: "",
    rut: "",
    email: "",
    telefono: "",
    sitio_web: "",
    industria: "",
    notas: "",
    etiquetas: [] as string[],
    segmento: "B2B" as "B2B" | "B2C" | "Mixto",
    estado_cliente: "activo" as "activo" | "suspendido" | "inactivo",
    condiciones_pago: "contado" as "contado" | "15d" | "30d" | "45d" | "60d" | "otro",
    credito_aprobado: false,
    credito_monto_max: "",
    lista_precios: "",
    descuento_acordado_pct: "",
    sla_prioridad: "normal" as "normal" | "prioritario" | "critico",
    noti_email: true,
    noti_whatsapp: false,
    noti_resumen_mensual: false,
  });

  useEffect(() => {
    if (id) {
      fetchCliente();
    }
  }, [id]);

  const fetchCliente = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setCliente(data);
      setFormData({
        razon_social: data.razon_social || "",
        giro: data.giro || "",
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        rut: data.rut || "",
        email: data.email || "",
        telefono: data.telefono || "",
        sitio_web: data.sitio_web || "",
        industria: data.industria || "",
        notas: data.notas || "",
        etiquetas: data.etiquetas || [],
        segmento: data.segmento as any,
        estado_cliente: data.estado_cliente as any,
        condiciones_pago: data.condiciones_pago as any,
        credito_aprobado: data.credito_aprobado,
        credito_monto_max: data.credito_monto_max?.toString() || "",
        lista_precios: data.lista_precios || "",
        descuento_acordado_pct: data.descuento_acordado_pct?.toString() || "",
        sla_prioridad: data.sla_prioridad as any,
        noti_email: data.noti_email,
        noti_whatsapp: data.noti_whatsapp,
        noti_resumen_mensual: data.noti_resumen_mensual,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar cliente",
        description: error.message,
      });
      navigate("/clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!cliente) return;

      // Validaciones básicas
      if (cliente.tipo === "empresa" && !formData.razon_social) {
        throw new Error("La razón social es requerida para empresas");
      }
      if (cliente.tipo === "persona" && !formData.nombres) {
        throw new Error("Los nombres son requeridos para personas");
      }
      if (!formData.rut) {
        throw new Error("El RUT es requerido");
      }

      // Formatear RUT
      const rutFormateado = formatRut(formData.rut);

      // Verificar si el RUT ya existe (excluyendo el cliente actual)
      const { data: existingClient, error: checkError } = await supabase
        .from("clientes")
        .select("id, razon_social, nombres, apellidos")
        .eq("rut", rutFormateado)
        .neq("id", id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingClient) {
        const clienteName = existingClient.razon_social || `${existingClient.nombres} ${existingClient.apellidos}`;
        throw new Error(`Ya existe un cliente con este RUT: ${clienteName}`);
      }

      const { data: { user } } = await supabase.auth.getUser();

      const updateData = {
        razon_social: cliente.tipo === "empresa" ? formData.razon_social : null,
        giro: cliente.tipo === "empresa" ? formData.giro : null,
        nombres: cliente.tipo === "persona" ? formData.nombres : null,
        apellidos: cliente.tipo === "persona" ? formData.apellidos : null,
        rut: rutFormateado,
        email: formData.email || null,
        telefono: formData.telefono || null,
        sitio_web: formData.sitio_web || null,
        industria: formData.industria || null,
        segmento: formData.segmento,
        estado_cliente: formData.estado_cliente,
        notas: formData.notas || null,
        etiquetas: formData.etiquetas,
        condiciones_pago: formData.condiciones_pago,
        credito_aprobado: formData.credito_aprobado,
        credito_monto_max: formData.credito_monto_max ? parseFloat(formData.credito_monto_max) : null,
        lista_precios: formData.lista_precios || null,
        descuento_acordado_pct: formData.descuento_acordado_pct ? parseFloat(formData.descuento_acordado_pct) : null,
        sla_prioridad: formData.sla_prioridad,
        noti_email: formData.noti_email,
        noti_whatsapp: formData.noti_whatsapp,
        noti_resumen_mensual: formData.noti_resumen_mensual,
        actualizado_por_user_id: user?.id,
      };

      const { error } = await supabase
        .from("clientes")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente actualizado",
        description: "La información del cliente se ha actualizado exitosamente.",
      });

      navigate(`/clientes/${id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar cliente",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const addEtiqueta = () => {
    if (etiquetaInput.trim() && !formData.etiquetas.includes(etiquetaInput.trim())) {
      setFormData({
        ...formData,
        etiquetas: [...formData.etiquetas, etiquetaInput.trim()],
      });
      setEtiquetaInput("");
    }
  };

  const removeEtiqueta = (etiqueta: string) => {
    setFormData({
      ...formData,
      etiquetas: formData.etiquetas.filter((e) => e !== etiqueta),
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cliente no encontrado</p>
          <Button onClick={() => navigate("/clientes")} className="mt-4">
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(`/clientes/${id}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
        <p className="text-muted-foreground">
          Actualiza la información del cliente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Cliente (solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {cliente.tipo === "empresa" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
              Tipo de Cliente
            </CardTitle>
            <CardDescription>
              {cliente.tipo === "empresa" ? "Empresa (B2B)" : "Persona Natural (B2C)"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          </TabsList>

          {/* Tab: Información Básica */}
          <TabsContent value="basico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cliente.tipo === "empresa" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="razon_social">Razón Social *</Label>
                      <Input
                        id="razon_social"
                        value={formData.razon_social}
                        onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="giro">Giro</Label>
                      <Input
                        id="giro"
                        value={formData.giro}
                        onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industria">Industria</Label>
                      <Select 
                        value={formData.industria} 
                        onValueChange={(value) => setFormData({ ...formData, industria: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una industria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="climatizacion">Climatización</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="residencial">Residencial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="hospitalaria">Hospitalaria</SelectItem>
                          <SelectItem value="educacion">Educación</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nombres">Nombres *</Label>
                      <Input
                        id="nombres"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos">Apellidos</Label>
                      <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT *</Label>
                    <Input
                      id="rut"
                      value={formData.rut}
                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                      onBlur={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, rut: formatRut(e.target.value) });
                        }
                      }}
                      placeholder="12.345.678-9"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Se formateará automáticamente</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sitio_web">Sitio Web</Label>
                    <Input
                      id="sitio_web"
                      type="url"
                      value={formData.sitio_web}
                      onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="segmento">Segmento</Label>
                    <Select 
                      value={formData.segmento} 
                      onValueChange={(value: "B2B" | "B2C" | "Mixto") => setFormData({ ...formData, segmento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                        <SelectItem value="Mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado_cliente">Estado</Label>
                    <Select 
                      value={formData.estado_cliente} 
                      onValueChange={(value: "activo" | "suspendido" | "inactivo") => setFormData({ ...formData, estado_cliente: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="suspendido">Suspendido</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etiquetas">Etiquetas</Label>
                  <div className="flex gap-2">
                    <Input
                      id="etiquetas"
                      value={etiquetaInput}
                      onChange={(e) => setEtiquetaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEtiqueta();
                        }
                      }}
                      placeholder="Agregar etiqueta"
                    />
                    <Button type="button" onClick={addEtiqueta} variant="outline">
                      Agregar
                    </Button>
                  </div>
                  {formData.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.etiquetas.map((etiqueta, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {etiqueta}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeEtiqueta(etiqueta)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configuración Comercial */}
          <TabsContent value="comercial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración Comercial</CardTitle>
                <CardDescription>Condiciones comerciales y notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condiciones_pago">Condiciones de Pago</Label>
                    <Select 
                      value={formData.condiciones_pago} 
                      onValueChange={(value: any) => setFormData({ ...formData, condiciones_pago: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contado">Contado</SelectItem>
                        <SelectItem value="15d">15 días</SelectItem>
                        <SelectItem value="30d">30 días</SelectItem>
                        <SelectItem value="45d">45 días</SelectItem>
                        <SelectItem value="60d">60 días</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sla_prioridad">Prioridad SLA</Label>
                    <Select 
                      value={formData.sla_prioridad} 
                      onValueChange={(value: any) => setFormData({ ...formData, sla_prioridad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="prioritario">Prioritario</SelectItem>
                        <SelectItem value="critico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="credito_aprobado">Crédito Aprobado</Label>
                    <p className="text-sm text-muted-foreground">Permite emitir documentos a crédito</p>
                  </div>
                  <Switch
                    id="credito_aprobado"
                    checked={formData.credito_aprobado}
                    onCheckedChange={(checked) => setFormData({ ...formData, credito_aprobado: checked })}
                  />
                </div>

                {formData.credito_aprobado && (
                  <div className="space-y-2">
                    <Label htmlFor="credito_monto_max">Monto Máximo de Crédito</Label>
                    <Input
                      id="credito_monto_max"
                      type="number"
                      value={formData.credito_monto_max}
                      onChange={(e) => setFormData({ ...formData, credito_monto_max: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lista_precios">Lista de Precios</Label>
                    <Select 
                      value={formData.lista_precios} 
                      onValueChange={(value) => setFormData({ ...formData, lista_precios: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar lista" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descuento_acordado_pct">Descuento Acordado (%)</Label>
                    <Input
                      id="descuento_acordado_pct"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.descuento_acordado_pct}
                      onChange={(e) => setFormData({ ...formData, descuento_acordado_pct: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Notificaciones */}
          <TabsContent value="notificaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificación</CardTitle>
                <CardDescription>Configuración de canales de notificación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="noti_email">Notificaciones por Email</Label>
                  <Switch
                    id="noti_email"
                    checked={formData.noti_email}
                    onCheckedChange={(checked) => setFormData({ ...formData, noti_email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="noti_whatsapp">Notificaciones por WhatsApp</Label>
                  <Switch
                    id="noti_whatsapp"
                    checked={formData.noti_whatsapp}
                    onCheckedChange={(checked) => setFormData({ ...formData, noti_whatsapp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="noti_resumen_mensual">Resumen Mensual</Label>
                  <Switch
                    id="noti_resumen_mensual"
                    checked={formData.noti_resumen_mensual}
                    onCheckedChange={(checked) => setFormData({ ...formData, noti_resumen_mensual: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/clientes/${id}`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
