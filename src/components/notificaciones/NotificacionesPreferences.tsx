import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone, TestTube } from "lucide-react";
import { toast } from "sonner";
import { useNotificationsPush } from "@/hooks/useNotificationsPush";

export function NotificacionesPreferences() {
  const queryClient = useQueryClient();
  const { supported, isSubscribed, loading, requestPermission, unsubscribe } = useNotificationsPush();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_notification_prefs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Si no existe, crear preferencias por defecto
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("user_notification_prefs")
          .insert({
            user_id: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs;
      }

      return data;
    },
  });

  const updatePref = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("user_notification_prefs")
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
      toast.success("Preferencia actualizada");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const testNotification = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No autenticado");

      const { data, error } = await supabase.functions.invoke("test-notification", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.mensaje || "Notificación de prueba enviada");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando preferencias...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Notificaciones por Email</CardTitle>
          </div>
          <CardDescription>
            Configura qué eventos deseas recibir por correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_ot_creada" className="cursor-pointer">
              Orden de Servicio Creada
            </Label>
            <Switch
              id="email_ot_creada"
              checked={prefs?.email_ot_creada ?? true}
              onCheckedChange={(val) => updatePref.mutate({ key: "email_ot_creada", value: val })}
              disabled={updatePref.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email_asignacion" className="cursor-pointer">
              Asignación de Personal
            </Label>
            <Switch
              id="email_asignacion"
              checked={prefs?.email_asignacion ?? true}
              onCheckedChange={(val) => updatePref.mutate({ key: "email_asignacion", value: val })}
              disabled={updatePref.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email_cambio_estado" className="cursor-pointer">
              Cambio de Estado de OT
            </Label>
            <Switch
              id="email_cambio_estado"
              checked={prefs?.email_cambio_estado ?? true}
              onCheckedChange={(val) => updatePref.mutate({ key: "email_cambio_estado", value: val })}
              disabled={updatePref.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email_recordatorio" className="cursor-pointer">
              Recordatorios de Mantenimiento
            </Label>
            <Switch
              id="email_recordatorio"
              checked={prefs?.email_recordatorio ?? true}
              onCheckedChange={(val) => updatePref.mutate({ key: "email_recordatorio", value: val })}
              disabled={updatePref.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <CardTitle>Notificaciones Push</CardTitle>
          </div>
          <CardDescription>
            Recibe notificaciones en tiempo real en tu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!supported ? (
            <div className="text-sm text-muted-foreground">
              Las notificaciones push no están soportadas en este navegador.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado de Notificaciones Push</Label>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed ? "Activadas" : "Desactivadas"}
                  </p>
                </div>
                {isSubscribed ? (
                  <Button
                    variant="outline"
                    onClick={() => unsubscribe()}
                    disabled={loading}
                  >
                    Desactivar
                  </Button>
                ) : (
                  <Button
                    onClick={() => requestPermission()}
                    disabled={loading}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Activar
                  </Button>
                )}
              </div>

              {isSubscribed && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push_asignacion" className="cursor-pointer">
                      Asignación de Personal
                    </Label>
                    <Switch
                      id="push_asignacion"
                      checked={prefs?.push_asignacion ?? true}
                      onCheckedChange={(val) => updatePref.mutate({ key: "push_asignacion", value: val })}
                      disabled={updatePref.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="push_cambio_estado" className="cursor-pointer">
                      Cambio de Estado de OT
                    </Label>
                    <Switch
                      id="push_cambio_estado"
                      checked={prefs?.push_cambio_estado ?? true}
                      onCheckedChange={(val) => updatePref.mutate({ key: "push_cambio_estado", value: val })}
                      disabled={updatePref.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="push_recordatorio" className="cursor-pointer">
                      Recordatorios
                    </Label>
                    <Switch
                      id="push_recordatorio"
                      checked={prefs?.push_recordatorio ?? true}
                      onCheckedChange={(val) => updatePref.mutate({ key: "push_recordatorio", value: val })}
                      disabled={updatePref.isPending}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            <CardTitle>Probar Notificaciones</CardTitle>
          </div>
          <CardDescription>
            Envía una notificación de prueba a tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => testNotification.mutate()}
            disabled={testNotification.isPending}
            variant="outline"
          >
            <Mail className="h-4 w-4 mr-2" />
            {testNotification.isPending ? "Enviando..." : "Enviar Notificación de Prueba"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
