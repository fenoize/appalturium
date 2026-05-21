import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Map, MessageCircle, Mail, Code, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntegraciones, type IntegracionesConfig as IntegracionesConfigType } from "@/hooks/useIntegraciones";

interface IntegrationStatus {
  configured: boolean;
  lastChecked?: Date;
}

const DEFAULT_CONFIG: IntegracionesConfigType = {
  mapbox_token: "",
  whatsapp_token: "",
  whatsapp_phone_id: "",
  resend_api_key: "",
  resend_from_email: "",
};

export const IntegracionesConfig = () => {
  const { toast } = useToast();
  const { data, isLoading, guardar, isSaving } = useIntegraciones();

  const [form, setForm] = useState<IntegracionesConfig>(DEFAULT_CONFIG);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({
    mapbox: { configured: false },
    whatsapp: { configured: false },
    resend: { configured: false },
  });

  // Sync form with loaded data
  useEffect(() => {
    if (data) {
      setForm({ ...DEFAULT_CONFIG, ...data });
      setIntegrations({
        mapbox: { configured: !!(data.mapbox_token), lastChecked: new Date() },
        whatsapp: { configured: !!(data.whatsapp_token && data.whatsapp_phone_id), lastChecked: new Date() },
        resend: { configured: !!(data.resend_api_key && data.resend_from_email), lastChecked: new Date() },
      });
    }
  }, [data]);

  const toggleTokenVisibility = (key: string) => {
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = (field: keyof IntegracionesConfig, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveIntegration = async (integrationName: string, fieldsToSave: (keyof IntegracionesConfig)[]) => {
    try {
      const payload: Partial<IntegracionesConfig> = {};
      for (const f of fieldsToSave) {
        payload[f] = form[f];
      }
      await guardar({ ...DEFAULT_CONFIG, ...payload } as IntegracionesConfig);
      toast({
        title: "Integración guardada",
        description: `La configuración de ${integrationName} se ha guardado correctamente.`,
      });
      setIntegrations((prev) => ({
        ...prev,
        [integrationName.toLowerCase()]: { configured: true, lastChecked: new Date() },
      }));
    } catch (e: any) {
      toast({
        title: "Error al guardar",
        description: e?.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleTestIntegration = (integrationName: string) => {
    toast({
      title: "Probando integración",
      description: `Verificando la conexión con ${integrationName}...`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Mapbox Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Map className="w-5 h-5 text-primary" />
              <span>Mapbox</span>
            </div>
            {integrations.mapbox.configured ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">API Token Público</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Obtén tu token en{" "}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                account.mapbox.com
              </a>
            </p>
            <div className="relative">
              <Input
                id="mapbox-token"
                type={showTokens.mapbox ? "text" : "password"}
                placeholder="pk.eyJ1..."
                value={form.mapbox_token}
                onChange={(e) => updateField("mapbox_token", e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleTokenVisibility("mapbox")}
              >
                {showTokens.mapbox ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleTestIntegration("Mapbox")}
            >
              Probar Conexión
            </Button>
            <Button
              className="flex-1"
              disabled={isSaving || isLoading}
              onClick={() => handleSaveIntegration("Mapbox", ["mapbox_token"])}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span>WhatsApp Business</span>
            </div>
            {integrations.whatsapp.configured ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-token">Access Token</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Configura tu API en{" "}
              <a
                href="https://developers.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Facebook Developers
              </a>
            </p>
            <div className="relative">
              <Input
                id="whatsapp-token"
                type={showTokens.whatsapp ? "text" : "password"}
                placeholder="EAAG..."
                value={form.whatsapp_token}
                onChange={(e) => updateField("whatsapp_token", e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleTokenVisibility("whatsapp")}
              >
                {showTokens.whatsapp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
            <Input
              id="whatsapp-phone-id"
              placeholder="123456789012345"
              value={form.whatsapp_phone_id}
              onChange={(e) => updateField("whatsapp_phone_id", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-business-id">Business Account ID</Label>
            <Input
              id="whatsapp-business-id"
              placeholder="123456789012345"
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleTestIntegration("WhatsApp")}
            >
              Probar Conexión
            </Button>
            <Button
              className="flex-1"
              disabled={isSaving || isLoading}
              onClick={() =>
                handleSaveIntegration("WhatsApp", ["whatsapp_token", "whatsapp_phone_id"])
              }
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resend (Email) Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-primary" />
              <span>Resend (Email)</span>
            </div>
            {integrations.resend.configured ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resend-token">API Key</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Obtén tu API key en{" "}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resend.com
              </a>
            </p>
            <div className="relative">
              <Input
                id="resend-token"
                type={showTokens.resend ? "text" : "password"}
                placeholder="re_..."
                value={form.resend_api_key}
                onChange={(e) => updateField("resend_api_key", e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleTokenVisibility("resend")}
              >
                {showTokens.resend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resend-from-email">Email de Envío</Label>
            <Input
              id="resend-from-email"
              type="email"
              placeholder="notificaciones@alturium.cl"
              value={form.resend_from_email}
              onChange={(e) => updateField("resend_from_email", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resend-from-name">Nombre de Remitente</Label>
            <Input
              id="resend-from-name"
              placeholder="ALTURIUM"
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleTestIntegration("Resend")}
            >
              Enviar Email de Prueba
            </Button>
            <Button
              className="flex-1"
              disabled={isSaving || isLoading}
              onClick={() =>
                handleSaveIntegration("Resend", ["resend_api_key", "resend_from_email"])
              }
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom API Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-primary" />
            <span>API Personalizada</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-api-name">Nombre de la Integración</Label>
            <Input
              id="custom-api-name"
              placeholder="Mi API Externa"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-api-url">URL Base</Label>
            <Input
              id="custom-api-url"
              type="url"
              placeholder="https://api.ejemplo.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-api-key">API Key</Label>
            <div className="relative">
              <Input
                id="custom-api-key"
                type={showTokens.custom ? "text" : "password"}
                placeholder="Bearer token o API key"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleTokenVisibility("custom")}
              >
                {showTokens.custom ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleTestIntegration("API Personalizada")}
            >
              Probar Conexión
            </Button>
            <Button className="flex-1" disabled={isLoading}>
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
