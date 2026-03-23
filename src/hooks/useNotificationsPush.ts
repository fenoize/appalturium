import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useNotificationsPush() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(isSupported);

    if (isSupported) {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await (registration as any).pushManager.getSubscription();
      setSubscription(existingSub);
    } catch (error) {
      console.error("Error al verificar suscripción:", error);
    }
  };

  const requestPermission = async () => {
    if (!supported) {
      toast.error("Las notificaciones push no están soportadas en este navegador");
      return null;
    }

    setLoading(true);

    try {
      // Solicitar permiso de notificaciones
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error("Permiso de notificaciones denegado");
        setLoading(false);
        return null;
      }

      // Registrar service worker si no está registrado
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Nota: Para producción, necesitarás configurar VAPID keys
      // Por ahora usamos userVisibleOnly sin applicationServerKey
      const sub = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
      });

      setSubscription(sub);

      // Guardar subscription en BD
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("push_subscriptions")
          .upsert({
            user_id: user.id,
            subscription: sub.toJSON() as any,
          });

        if (error) {
          console.error("Error al guardar suscripción:", error);
          toast.error("Error al guardar suscripción");
        } else {
          toast.success("Notificaciones push activadas");
        }
      }

      setLoading(false);
      return sub;

    } catch (error: any) {
      console.error("Error al solicitar permiso:", error);
      toast.error(`Error: ${error.message}`);
      setLoading(false);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) {
      return;
    }

    setLoading(true);

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Eliminar subscription de BD
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("Error al eliminar suscripción:", error);
        }
      }

      toast.success("Notificaciones push desactivadas");
      setLoading(false);

    } catch (error: any) {
      console.error("Error al desuscribirse:", error);
      toast.error(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  return {
    supported,
    subscription,
    loading,
    requestPermission,
    unsubscribe,
    isSubscribed: !!subscription,
  };
}
