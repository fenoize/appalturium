import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, X, Building2, User, MapPin, Users, CreditCard } from "lucide-react";
import { formatRut, cleanRut, validateRut } from "@/lib/rut-utils";
import { REGIONES_COMUNAS, REGIONES } from "@/data/regionesComunas";

export default function ClienteNuevo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basico");
  const [tipo, setTipo] = useState<"empresa" | "persona">("empresa");
  const [etiquetaInput, setEtiquetaInput] = useState("");

  const [formData, setFormData] = useState({
    // Básico
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
    segmento: (tipo === "empresa" ? "B2B" : "B2C") as "B2B" | "B2C" | "Mixto",
    
    // Ubicación Principal
    ubicacion_tipo: (tipo === "empresa" ? "sucursal" : "domicilio") as "sucursal" | "domicilio",
    ubicacion_alias: "",
    ubicacion_direccion: "",
    ubicacion_referencia: "",
    ubicacion_comuna: "",
    ubicacion_ciudad: "",
    ubicacion_region: "",
    ubicacion_horario: "",
    ubicacion_lat: null as number | null,
    ubicacion_lng: null as number | null,
    
    
    // Contacto Principal
    contacto_nombre: "",
    contacto_email: "",
    contacto_telefono: "",
    contacto_cargo: "",
    contacto_tipo: tipo === "empresa" ? "administrador_sucursal" : "principal",
    contacto_recibe_noti: true,
    
    // Comercial
    condiciones_pago: "contado" as "contado" | "15d" | "30d" | "45d" | "60d" | "otro",
    credito_aprobado: false,
    credito_monto_max: "",
    lista_precios: "",
    descuento_acordado_pct: "",
    sla_prioridad: "normal" as "normal" | "prioritario" | "critico",
    
    // Notificaciones
    noti_email: true,
    noti_whatsapp: false,
    noti_resumen_mensual: false,
  });

  // Para clientes persona (B2C), autocompletar contacto con datos del básico
  // mientras el usuario no haya editado manualmente esos campos.
  const contactoEditado = useRef({ nombre: false, email: false, telefono: false });

  useEffect(() => {
    if (tipo !== "persona") return;
    setFormData((prev) => {
      const nombreCompleto = `${prev.nombres} ${prev.apellidos}`.trim();
      const next = { ...prev };
      if (!contactoEditado.current.nombre) next.contacto_nombre = nombreCompleto;
      if (!contactoEditado.current.email) next.contacto_email = prev.email;
      if (!contactoEditado.current.telefono) next.contacto_telefono = prev.telefono;
      return next;
    });
  }, [tipo, formData.nombres, formData.apellidos, formData.email, formData.telefono]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (tipo === "empresa" && !formData.razon_social) {
        throw new Error("La razón social es requerida para empresas");
      }
      if (tipo === "persona" && !formData.nombres) {
        throw new Error("Los nombres son requeridos para personas");
      }
      if (!formData.ubicacion_direccion) {
        throw new Error("La dirección de ubicación principal es requerida");
      }
      if (!formData.contacto_nombre || !formData.contacto_email) {
        throw new Error("Nombre y email del contacto principal son requeridos");
      }
      if (!formData.rut) {
        throw new Error("El RUT es requerido");
      }

      // Formatear RUT
      const rutFormateado = formatRut(formData.rut);

      // Verificar si el RUT ya existe
      const { data: existingClient, error: checkError } = await supabase
        .from("clientes")
        .select("id, razon_social, nombres, apellidos")
        .eq("rut", rutFormateado)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingClient) {
        const clienteName = existingClient.razon_social || `${existingClient.nombres} ${existingClient.apellidos}`;
        throw new Error(`Ya existe un cliente con este RUT: ${clienteName}`);
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Crear cliente
      const clienteData = {
        tipo,
        razon_social: tipo === "empresa" ? formData.razon_social : null,
        giro: tipo === "empresa" ? formData.giro : null,
        nombres: tipo === "persona" ? formData.nombres : null,
        apellidos: tipo === "persona" ? formData.apellidos : null,
        rut: rutFormateado,
        email: formData.email || null,
        telefono: formData.telefono || null,
        sitio_web: formData.sitio_web || null,
        industria: formData.industria || null,
        segmento: formData.segmento,
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
        creado_por_user_id: user?.id,
      };

      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .insert([clienteData])
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Crear ubicación principal
      const ubicacionData = {
        cliente_id: cliente.id,
        tipo: formData.ubicacion_tipo as "sucursal" | "domicilio",
        alias: formData.ubicacion_alias || (tipo === "empresa" ? "Oficina Principal" : "Domicilio"),
        direccion: formData.ubicacion_direccion,
        referencia: formData.ubicacion_referencia || null,
        comuna: formData.ubicacion_comuna,
        ciudad: formData.ubicacion_ciudad,
        region: formData.ubicacion_region,
        horario_atencion: formData.ubicacion_horario || null,
        lat: formData.ubicacion_lat,
        lng: formData.ubicacion_lng,
        es_principal: true,
        activo: true,
      };

      const { error: ubicacionError } = await supabase
        .from("ubicaciones")
        .insert([ubicacionData]);

      if (ubicacionError) throw ubicacionError;

      // Crear contacto principal
      const contactoData = {
        cliente_id: cliente.id,
        nombre: formData.contacto_nombre,
        email: formData.contacto_email,
        telefono: formData.contacto_telefono || null,
        rol_contextual: formData.contacto_cargo || null,
        tipo_contacto_empresa: tipo === "empresa" ? formData.contacto_tipo as any : null,
        tipo_contacto_persona: tipo === "persona" ? formData.contacto_tipo as any : null,
        es_principal: true,
        recibe_notificaciones: formData.contacto_recibe_noti,
      };

      const { error: contactoError } = await supabase
        .from("contactos")
        .insert([contactoData]);

      if (contactoError) throw contactoError;

      toast({
        title: "Cliente creado",
        description: "El cliente, ubicación y contacto se han creado exitosamente.",
      });

      navigate(`/clientes/${cliente.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear cliente",
        description: error.message,
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate("/clientes")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
        <p className="text-muted-foreground">
          Completa la información del nuevo cliente paso a paso
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tipo === "empresa" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
              Tipo de Cliente
            </CardTitle>
            <CardDescription>Selecciona si es empresa o persona natural</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={tipo} 
              onValueChange={(value: "empresa" | "persona") => {
                setTipo(value);
                setFormData({
                  ...formData,
                  segmento: (value === "empresa" ? "B2B" : "B2C") as "B2B" | "B2C" | "Mixto",
                  ubicacion_tipo: (value === "empresa" ? "sucursal" : "domicilio") as "sucursal" | "domicilio",
                  contacto_tipo: value === "empresa" ? "administrador_sucursal" : "principal",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa (B2B)</SelectItem>
                <SelectItem value="persona">Persona Natural (B2C)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabs para organizar información */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="ubicacion">Ubicación</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
          </TabsList>

          {/* Tab: Información Básica */}
          <TabsContent value="basico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tipo === "empresa" ? (
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
                    {formData.rut && !validateRut(formData.rut) ? (
                      <p className="text-xs text-destructive">RUT inválido. Verifica el dígito verificador.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Se formateará automáticamente</p>
                    )}
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

          {/* Tab: Ubicación Principal */}
          <TabsContent value="ubicacion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación Principal
                </CardTitle>
                <CardDescription>Define la ubicación principal del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_tipo">Tipo</Label>
                    <Select 
                      value={formData.ubicacion_tipo} 
                      onValueChange={(value: "sucursal" | "domicilio") => setFormData({ ...formData, ubicacion_tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sucursal">Sucursal</SelectItem>
                        <SelectItem value="domicilio">Domicilio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_alias">Alias</Label>
                    <Input
                      id="ubicacion_alias"
                      value={formData.ubicacion_alias}
                      onChange={(e) => setFormData({ ...formData, ubicacion_alias: e.target.value })}
                      placeholder={tipo === "empresa" ? "Ej: Oficina Central" : "Ej: Casa"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion_direccion">Dirección *</Label>
                  <Input
                    id="ubicacion_direccion"
                    value={formData.ubicacion_direccion}
                    onChange={(e) => setFormData({ ...formData, ubicacion_direccion: e.target.value })}
                    placeholder="Calle, número, piso, depto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion_referencia">Referencia</Label>
                  <Input
                    id="ubicacion_referencia"
                    value={formData.ubicacion_referencia}
                    onChange={(e) => setFormData({ ...formData, ubicacion_referencia: e.target.value })}
                    placeholder="Ej: Portón negro, edificio azul"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_region">Región *</Label>
                    <Select
                      value={formData.ubicacion_region}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ubicacion_region: value, ubicacion_comuna: "" })
                      }
                    >
                      <SelectTrigger id="ubicacion_region">
                        <SelectValue placeholder="Selecciona una región" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_comuna">Comuna *</Label>
                    <Select
                      value={formData.ubicacion_comuna}
                      onValueChange={(value) => setFormData({ ...formData, ubicacion_comuna: value })}
                      disabled={!formData.ubicacion_region}
                    >
                      <SelectTrigger id="ubicacion_comuna">
                        <SelectValue placeholder={formData.ubicacion_region ? "Selecciona una comuna" : "Elige región primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(REGIONES_COMUNAS[formData.ubicacion_region] ?? []).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_ciudad">Ciudad *</Label>
                    <Input
                      id="ubicacion_ciudad"
                      value={formData.ubicacion_ciudad}
                      onChange={(e) => setFormData({ ...formData, ubicacion_ciudad: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {tipo === "empresa" && (
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion_horario">Horario de Atención</Label>
                    <Input
                      id="ubicacion_horario"
                      value={formData.ubicacion_horario}
                      onChange={(e) => setFormData({ ...formData, ubicacion_horario: e.target.value })}
                      placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contacto Principal */}
          <TabsContent value="contacto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacto Principal
                </CardTitle>
                <CardDescription>Información de la persona de contacto principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contacto_nombre">Nombre Completo *</Label>
                  <Input
                    id="contacto_nombre"
                    value={formData.contacto_nombre}
                    onChange={(e) => {
                      contactoEditado.current.nombre = true;
                      setFormData({ ...formData, contacto_nombre: e.target.value });
                    }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contacto_email">Email *</Label>
                    <Input
                      id="contacto_email"
                      type="email"
                      value={formData.contacto_email}
                      onChange={(e) => {
                        contactoEditado.current.email = true;
                        setFormData({ ...formData, contacto_email: e.target.value });
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contacto_telefono">Teléfono</Label>
                    <Input
                      id="contacto_telefono"
                      value={formData.contacto_telefono}
                      onChange={(e) => {
                        contactoEditado.current.telefono = true;
                        setFormData({ ...formData, contacto_telefono: e.target.value });
                      }}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contacto_cargo">Cargo / Rol</Label>
                    <Input
                      id="contacto_cargo"
                      value={formData.contacto_cargo}
                      onChange={(e) => setFormData({ ...formData, contacto_cargo: e.target.value })}
                      placeholder={tipo === "empresa" ? "Ej: Gerente General" : "Ej: Propietario"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contacto_tipo">Tipo de Contacto</Label>
                    <Select 
                      value={formData.contacto_tipo} 
                      onValueChange={(value) => setFormData({ ...formData, contacto_tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tipo === "empresa" ? (
                          <>
                            <SelectItem value="administrador_sucursal">Administrador Sucursal</SelectItem>
                            <SelectItem value="encargado_proyecto">Encargado Proyecto</SelectItem>
                            <SelectItem value="compras">Compras</SelectItem>
                            <SelectItem value="finanzas">Finanzas</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="pareja">Pareja</SelectItem>
                            <SelectItem value="hijo">Hijo/a</SelectItem>
                            <SelectItem value="secundario">Secundario</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="contacto_recibe_noti">Recibe Notificaciones</Label>
                  <Switch
                    id="contacto_recibe_noti"
                    checked={formData.contacto_recibe_noti}
                    onCheckedChange={(checked) => setFormData({ ...formData, contacto_recibe_noti: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configuración Comercial */}
          <TabsContent value="comercial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Configuración Comercial
                </CardTitle>
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
                      placeholder="0.00"
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
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
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

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Preferencias de Notificación</h4>
                  <div className="space-y-3">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !formData.rut || !validateRut(formData.rut)}>
            {loading ? "Creando..." : "Crear Cliente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}