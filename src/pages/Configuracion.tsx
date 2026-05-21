import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificacionesPreferences } from "@/components/notificaciones/NotificacionesPreferences";
import { IntegracionesConfig } from "@/components/configuracion/IntegracionesConfig";
import { GestionUsuarios } from "@/components/configuracion/GestionUsuarios";
import { useConfiguracionEmpresa, ConfiguracionEmpresa } from "@/hooks/useConfiguracionEmpresa";
import {
  Settings,
  Building,
  Users,
  Shield,
  Database,
  Palette
} from "lucide-react";

const Configuracion = () => {
  const { data: empresaData, isLoading: loadingEmpresa, guardar, isSaving } = useConfiguracionEmpresa();
  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa>({
    nombre: "",
    rut: "",
    direccion: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    if (empresaData) setEmpresa(empresaData);
  }, [empresaData]);

  const handleGuardarEmpresa = async () => {
    try {
      await guardar(empresa);
      toast.success("Información de la empresa actualizada");
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
            <p className="text-primary-foreground/80">
              Administra la configuración general de ALTURIUM
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-primary" />
                  <span>Información de la Empresa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nombre de la Empresa</Label>
                  <Input id="company-name" defaultValue="ALTURIUM" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-rut">RUT</Label>
                  <Input id="company-rut" placeholder="12.345.678-9" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Dirección</Label>
                  <Input id="company-address" placeholder="Dirección de la empresa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Teléfono</Label>
                  <Input id="company-phone" placeholder="+56 9 1234 5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input id="company-email" type="email" placeholder="info@alturium.cl" />
                </div>
                <Button className="w-full">Guardar Cambios</Button>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <span>Preferencias del Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tema Oscuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Cambiar a modo oscuro
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones de Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones por correo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-guardado</Label>
                    <p className="text-sm text-muted-foreground">
                      Guardar cambios automáticamente
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Backup & Database */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Respaldos y Base de Datos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Último respaldo</Label>
                  <p className="text-sm text-muted-foreground">
                    12 de Septiembre, 2025 - 14:30
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Respaldo Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realizar respaldo diario automático
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Button variant="outline" className="w-full">
                  Crear Respaldo Manual
                </Button>
                <Button variant="outline" className="w-full">
                  Restaurar desde Respaldo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios">
          <GestionUsuarios />
        </TabsContent>

        <TabsContent value="integraciones">
          <IntegracionesConfig />
        </TabsContent>

        <TabsContent value="notificaciones">
          <NotificacionesPreferences />
        </TabsContent>

        <TabsContent value="seguridad" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 w-5 text-primary" />
                  <span>Configuración de Seguridad</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-muted-foreground">
                      Activar 2FA para mayor seguridad
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Tiempo de Sesión</Label>
                  <Input defaultValue="8 horas" />
                </div>
                
                <Button variant="outline" className="w-full">
                  Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracion;