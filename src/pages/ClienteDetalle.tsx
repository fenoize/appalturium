import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, User, MapPin, Phone, Mail, FileText, DollarSign, ClipboardList } from "lucide-react";

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
  notas: string | null;
  etiquetas: string[];
  created_at: string;
};

type Ubicacion = {
  id: string;
  direccion: string;
  comuna: string;
  region: string;
  por_defecto: boolean;
  alias: string;
};

type Contacto = {
  id: string;
  nombre: string;
  rol_contextual: string | null;
  telefono: string | null;
  email: string | null;
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
      setCliente(clienteData);

      // Fetch ubicaciones
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from("ubicaciones")
        .select("*")
        .eq("cliente_id", id)
        .order("por_defecto", { ascending: false });

      if (ubicacionesError) throw ubicacionesError;
      setUbicaciones(ubicacionesData || []);

      // Fetch contactos
      const { data: contactosData, error: contactosError } = await supabase
        .from("contactos")
        .select("*")
        .eq("cliente_id", id);

      if (contactosError) throw contactosError;
      setContactos(contactosData || []);

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
        <Button variant="ghost" onClick={() => navigate("/clientes")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
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
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes de Servicio</TabsTrigger>
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
          {ubicaciones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay ubicaciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ubicaciones.map((ubicacion) => (
                <Card key={ubicacion.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ubicacion.alias || "Ubicación"}</CardTitle>
                      {ubicacion.por_defecto && (
                        <Badge>Principal</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p>{ubicacion.direccion}</p>
                          <p className="text-sm text-muted-foreground">
                            {ubicacion.comuna}, {ubicacion.region}
                          </p>
                        </div>
                      </div>
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
                    <CardTitle className="text-lg">{contacto.nombre}</CardTitle>
                    {contacto.rol_contextual && (
                      <CardDescription>{contacto.rol_contextual}</CardDescription>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-4">
          {ordenes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay órdenes de servicio registradas</p>
                <Button 
                  onClick={() => navigate("/ordenes-servicio/nueva")} 
                  className="mt-4"
                >
                  Nueva Orden de Servicio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ordenes.map((orden) => (
                <Card 
                  key={orden.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/ordenes-servicio/${orden.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">{orden.numero}</p>
                            <p className="text-sm text-muted-foreground">{orden.tipo_trabajo}</p>
                          </div>
                        </div>
                      </div>
                      <Badge>{orden.estado}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
