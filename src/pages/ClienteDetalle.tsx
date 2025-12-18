import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, User, MapPin, Phone, Mail, FileText, DollarSign, ClipboardList, Edit, Briefcase } from "lucide-react";
import { AgregarUbicacionDialog } from "@/components/clientes/AgregarUbicacionDialog";
import { CrearAccesoPortalDialog } from "@/components/clientes/CrearAccesoPortalDialog";
import { TrabajosList } from "@/components/trabajos/TrabajosList";
import { OrdenesServicioList } from "@/components/ordenes/OrdenesServicioList";
import { Trabajo } from "@/hooks/useTrabajos";

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
  segmento: string | null;
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
  created_at: string;
};

type Ubicacion = {
  id: string;
  direccion: string;
  referencia: string | null;
  comuna: string;
  region: string;
  ciudad: string;
  es_principal: boolean;
  por_defecto: boolean;
  activo: boolean;
  alias: string;
  tipo: string;
  horario_atencion: string | null;
};

type Contacto = {
  id: string;
  nombre: string;
  rol_contextual: string | null;
  cargo_rol: string | null;
  telefono: string | null;
  email: string | null;
  es_principal: boolean;
  recibe_notificaciones: boolean;
  tipo_contacto_empresa: string | null;
  tipo_contacto_persona: string | null;
};

type OrdenServicio = {
  id: string;
  numero: string;
  tipo_trabajo: string;
  estado: string;
  fecha_programada_inicio: string | null;
  created_at: string;
};

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClienteData();
    }
  }, [id]);

  const fetchClienteData = async () => {
    try {
      // Fetch cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();

      if (clienteError) throw clienteError;
      setCliente(clienteData as any);

      // Fetch ubicaciones
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from("ubicaciones")
        .select("*")
        .eq("cliente_id", id)
        .order("por_defecto", { ascending: false });

      if (ubicacionesError) throw ubicacionesError;
      setUbicaciones(ubicacionesData as any || []);

      // Fetch contactos
      const { data: contactosData, error: contactosError } = await supabase
        .from("contactos")
        .select("*")
        .eq("cliente_id", id);

      if (contactosError) throw contactosError;
      setContactos(contactosData as any || []);

      // Fetch órdenes de servicio
      const { data: ordenesData, error: ordenesError } = await supabase
        .from("ordenes_servicio")
        .select("id, numero, tipo_trabajo, estado, fecha_programada_inicio, created_at")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (ordenesError) throw ordenesError;
      setOrdenes(ordenesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar datos",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getClienteName = () => {
    if (!cliente) return "";
    if (cliente.tipo === "empresa") {
      return cliente.razon_social || "Sin nombre";
    }
    return `${cliente.nombres} ${cliente.apellidos}`;
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
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-2">
            <CrearAccesoPortalDialog
              clienteId={id!}
              clienteEmail={cliente.email}
              clienteName={getClienteName()}
              hasAccess={!!(cliente as any).user_id}
              onSuccess={fetchClienteData}
            />
            <Button onClick={() => navigate(`/clientes/${id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
          </div>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {cliente.tipo === "empresa" ? (
                <Building2 className="h-8 w-8 text-primary" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
              <h1 className="text-3xl font-bold">{getClienteName()}</h1>
              <Badge variant={cliente.tipo === "empresa" ? "default" : "secondary"}>
                {cliente.tipo === "empresa" ? "Empresa" : "Persona"}
              </Badge>
            </div>
            {cliente.tipo === "empresa" && cliente.giro && (
              <p className="text-muted-foreground">{cliente.giro}</p>
            )}
          </div>
        </div>
      </div>

        <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="trabajos">Trabajos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RUT</label>
                  <p className="text-lg">{cliente.rut}</p>
                </div>
                {cliente.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg">{cliente.email}</p>
                    </div>
                  </div>
                )}
                {cliente.telefono && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg">{cliente.telefono}</p>
                    </div>
                  </div>
                )}
                {cliente.sitio_web && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sitio Web</label>
                    <a href={cliente.sitio_web} target="_blank" rel="noopener noreferrer" className="text-lg text-primary hover:underline">
                      {cliente.sitio_web}
                    </a>
                  </div>
                )}
                {cliente.industria && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industria</label>
                    <p className="text-lg">{cliente.industria}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Segmento</label>
                  <Badge>{cliente.segmento}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <Badge variant={cliente.estado_cliente === "activo" ? "default" : cliente.estado_cliente === "suspendido" ? "destructive" : "secondary"}>
                    {cliente.estado_cliente}
                  </Badge>
                </div>
              </div>
              
              {cliente.notas && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas</label>
                  <p className="text-lg whitespace-pre-wrap">{cliente.notas}</p>
                </div>
              )}

              {cliente.etiquetas.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Etiquetas</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cliente.etiquetas.map((etiqueta, index) => (
                      <Badge key={index} variant="outline">
                        {etiqueta}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ubicaciones" className="space-y-4">
          <div className="flex justify-end">
            <AgregarUbicacionDialog clienteId={id!} onSuccess={fetchClienteData} />
          </div>
          
          {ubicaciones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay ubicaciones registradas</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Usa el botón "Agregar Ubicación" para registrar la primera.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ubicaciones.map((ubicacion) => (
                <Card key={ubicacion.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ubicacion.alias || "Ubicación"}</CardTitle>
                      <div className="flex gap-2">
                        {(ubicacion.es_principal || ubicacion.por_defecto) && (
                          <Badge>Principal</Badge>
                        )}
                        {ubicacion.activo && (
                          <Badge variant="outline">Activo</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{ubicacion.tipo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p>{ubicacion.direccion}</p>
                          {ubicacion.referencia && (
                            <p className="text-sm text-muted-foreground">{ubicacion.referencia}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {ubicacion.comuna}, {ubicacion.ciudad}, {ubicacion.region}
                          </p>
                        </div>
                      </div>
                      {ubicacion.horario_atencion && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Horario:</strong> {ubicacion.horario_atencion}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contactos" className="space-y-4">
          {contactos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay contactos registrados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contactos.map((contacto) => (
                <Card key={contacto.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{contacto.nombre}</CardTitle>
                      <div className="flex gap-2">
                        {contacto.es_principal && (
                          <Badge>Principal</Badge>
                        )}
                        {contacto.recibe_notificaciones && (
                          <Badge variant="outline">Notificaciones</Badge>
                        )}
                      </div>
                    </div>
                    {(contacto.cargo_rol || contacto.rol_contextual) && (
                      <CardDescription>{contacto.cargo_rol || contacto.rol_contextual}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {contacto.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{contacto.email}</span>
                      </div>
                    )}
                    {contacto.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contacto.telefono}</span>
                      </div>
                    )}
                    {(contacto.tipo_contacto_empresa || contacto.tipo_contacto_persona) && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Tipo:</strong> {contacto.tipo_contacto_empresa || contacto.tipo_contacto_persona}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comercial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones Comerciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condiciones de Pago</label>
                  <p className="text-lg">{cliente.condiciones_pago}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridad SLA</label>
                  <Badge variant={cliente.sla_prioridad === "crítico" ? "destructive" : cliente.sla_prioridad === "prioritario" ? "default" : "secondary"}>
                    {cliente.sla_prioridad}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Crédito Aprobado</label>
                  <Badge variant={cliente.credito_aprobado ? "default" : "secondary"}>
                    {cliente.credito_aprobado ? "Sí" : "No"}
                  </Badge>
                </div>
                {cliente.credito_aprobado && cliente.credito_monto_max && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Monto Máximo de Crédito</label>
                    <p className="text-lg">${cliente.credito_monto_max.toLocaleString()}</p>
                  </div>
                )}
                {cliente.lista_precios && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lista de Precios</label>
                    <p className="text-lg">{cliente.lista_precios}</p>
                  </div>
                )}
                {cliente.descuento_acordado_pct && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descuento Acordado</label>
                    <p className="text-lg">{cliente.descuento_acordado_pct}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones por correo electrónico</p>
                  </div>
                  <Badge variant={cliente.noti_email ? "default" : "secondary"}>
                    {cliente.noti_email ? "Activado" : "Desactivado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones por WhatsApp</p>
                  </div>
                  <Badge variant={cliente.noti_whatsapp ? "default" : "secondary"}>
                    {cliente.noti_whatsapp ? "Activado" : "Desactivado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Resumen Mensual</p>
                    <p className="text-sm text-muted-foreground">Recibir resumen mensual de actividad</p>
                  </div>
                  <Badge variant={cliente.noti_resumen_mensual ? "default" : "secondary"}>
                    {cliente.noti_resumen_mensual ? "Activado" : "Desactivado"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-4">
          <OrdenesServicioList clienteId={id!} showCreateButton />
        </TabsContent>

        <TabsContent value="trabajos" className="space-y-4">
          <TrabajosList 
            clienteId={id!} 
            onCreateProject={(trabajo: Trabajo) => {
              navigate(`/proyectos?trabajo_id=${trabajo.id}&cliente_id=${trabajo.cliente_id}&nombre=${encodeURIComponent(trabajo.nombre_trabajo)}`);
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
