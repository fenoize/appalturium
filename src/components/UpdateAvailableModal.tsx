import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCw } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

interface RemoteVersion {
  version: string;
  releasedAt?: string;
  notes?: string[];
}

const SKIP_KEY = "app:skippedVersion";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

// Compara versiones semánticas simples "x.y.z"
function isNewer(remote: string, current: string): boolean {
  const r = remote.split(".").map((n) => parseInt(n, 10) || 0);
  const c = current.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(r.length, c.length);
  for (let i = 0; i < len; i++) {
    const a = r[i] ?? 0;
    const b = c[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

export function UpdateAvailableModal() {
  const [remote, setRemote] = useState<RemoteVersion | null>(null);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: RemoteVersion = await res.json();
      if (!data?.version) return;

      const skipped = localStorage.getItem(SKIP_KEY);
      if (
        isNewer(data.version, APP_VERSION) &&
        skipped !== data.version
      ) {
        setRemote(data);
        setOpen(true);
      }
    } catch {
      // silenciar errores de red
    }
  }, []);

  useEffect(() => {
    // Chequeo inicial (con pequeño delay para no competir con la carga)
    const t = setTimeout(checkVersion, 3000);
    const interval = setInterval(checkVersion, POLL_INTERVAL_MS);
    const onFocus = () => checkVersion();
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkVersion();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [checkVersion]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      // Limpiar caches del navegador
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Desregistrar service workers (excepto messaging si existiera)
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          regs.map((r) => {
            const url = r.active?.scriptURL || "";
            if (url.includes("firebase-messaging")) return Promise.resolve(true);
            return r.unregister();
          })
        );
      }
    } catch {
      // continuar igualmente
    }
    // Forzar recarga sin caché
    const url = new URL(window.location.href);
    url.searchParams.set("v", Date.now().toString());
    window.location.replace(url.toString());
  };

  const handleSkip = () => {
    if (remote?.version) {
      localStorage.setItem(SKIP_KEY, remote.version);
    }
    setOpen(false);
  };

  if (!remote) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleSkip() : setOpen(o))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Nueva actualización disponible</DialogTitle>
          </div>
          <DialogDescription>
            Versión <strong>{remote.version}</strong> lista para instalar
            {remote.releasedAt ? ` · ${remote.releasedAt}` : ""}. Estás usando la{" "}
            <strong>{APP_VERSION}</strong>.
          </DialogDescription>
        </DialogHeader>

        {remote.notes && remote.notes.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium mb-2">Novedades:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {remote.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={updating}>
            Omitir ahora
          </Button>
          <Button onClick={handleUpdate} disabled={updating}>
            {updating ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar ahora"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
