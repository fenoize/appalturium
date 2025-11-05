import { useClienteData } from "@/hooks/useClienteData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Building, User, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PortalClientePerfil() {
  const navigate = useNavigate();
  const { data: cliente, isLoading } = useClienteData();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/portal-cliente")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gestione su información de contacto y ubicaciones
        </p>
      </div>

      {/* Información del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {cliente?.tipo === "empresa" ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cliente?.tipo === "empresa" ? (
            <>
              <div>
                <p className="text-sm font-medium">Razón Social</p>
                <p className="text-sm text-muted-foreground">{cliente.razon_social}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Giro</p>
                <p className="text-sm text-muted-foreground">{cliente.giro || "No especificado"}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm font-medium">Nombre</p>
              <p className="text-sm text-muted-foreground">
                {cliente?.nombres} {cliente?.apellidos}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">RUT</p>
            <p className="text-sm text-muted-foreground">{cliente?.rut}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{cliente?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Teléfono</p>
            <p className="text-sm text-muted-foreground">{cliente?.telefono}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para ubicaciones y contactos */}
      <Tabs defaultValue="ubicaciones">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
        </TabsList>

        <TabsContent value="ubicaciones" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Gestione las direcciones donde requiere servicios
            </p>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Ubicación
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {cliente?.ubicaciones?.map((ubicacion) => (
              <Card key={ubicacion.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {ubicacion.alias}
                  </CardTitle>
                  {ubicacion.por_defecto && (
                    <CardDescription>Ubicación principal</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{ubicacion.direccion}</p>
                  <p className="text-muted-foreground">
                    {ubicacion.comuna}, {ubicacion.ciudad}
                  </p>
                  <p className="text-muted-foreground">{ubicacion.region}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contactos" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Personas de contacto para sus servicios
            </p>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Contacto
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {cliente?.contactos?.map((contacto) => (
              <Card key={contacto.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {contacto.nombre}
                  </CardTitle>
                  {contacto.es_principal && (
                    <CardDescription>Contacto principal</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {contacto.email && (
                    <p className="text-muted-foreground">{contacto.email}</p>
                  )}
                  {contacto.telefono && (
                    <p className="text-muted-foreground">{contacto.telefono}</p>
                  )}
                  {contacto.rol_contextual && (
                    <p className="text-xs text-muted-foreground">
                      Rol: {contacto.rol_contextual}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
