import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QrCode, Wrench } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const estadoColors: Record<string, string> = {
  en_bodega: "bg-blue-100 text-blue-800",
  asignado_tecnico: "bg-yellow-100 text-yellow-800",
  instalado: "bg-green-100 text-green-800",
  en_mantenimiento: "bg-orange-100 text-orange-800",
  dado_de_baja: "bg-red-100 text-red-800",
};

const estadoEquipoLabels: Record<string, string> = {
  en_bodega: "En bodega",
  asignado_tecnico: "Asignado a técnico",
  instalado: "Instalado",
  en_mantenimiento: "En mantenimiento",
  dado_de_baja: "Dado de baja",
};

const tipoIntervencionLabels: Record<string, string> = {
  instalacion: "Instalación",
  mantenimiento_preventivo: "Mantenimiento preventivo",
  mantenimiento_correctivo: "Mantenimiento correctivo",
  cambio_equipo: "Cambio de equipo",
  retiro: "Retiro",
};

interface EquipoPublicoData {
  codigo_qr: string;
  marca: string | null;
  modelo: string | null;
  estado: string;
  numero_serie: string | null;
  descripcion: string | null;
  updated_at: string;
  intervenciones: Array<{
    id: string;
    tipo: string;
    fecha: string;
    descripcion: string;
  }>;
}

export default function EquipoPublico() {
  const { codigo } = useParams();
  const [equipo, setEquipo] = useState<EquipoPublicoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!codigo) {
        setError("Código inválido");
        setLoading(false);
        return;
      }
      try {
        const resp = await fetch(
          `${FUNCTIONS_BASE}/get-equipo-publico?codigo_qr=${encodeURIComponent(codigo)}`,
          {
            method: "GET",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          },
        );
        const body = await resp.json();
        if (cancelled) return;
        if (!resp.ok) {
          setError(body?.error || "Equipo no encontrado");
        } else {
          setEquipo(body as EquipoPublicoData);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error al cargar el equipo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [codigo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !equipo) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Equipo no encontrado</h2>
            <p className="text-muted-foreground">
              {error || "El código QR escaneado no corresponde a ningún equipo registrado."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <span className="font-mono text-xl font-bold">{equipo.codigo_qr}</span>
              </div>
              <Badge className={estadoColors[equipo.estado]}>
                {estadoEquipoLabels[equipo.estado] || equipo.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h1 className="text-2xl font-bold mb-1">
              {equipo.marca} {equipo.modelo}
            </h1>
            {equipo.numero_serie && (
              <p className="text-muted-foreground font-mono">S/N: {equipo.numero_serie}</p>
            )}
            {equipo.descripcion && (
              <>
                <Separator className="my-3" />
                <p className="text-sm">{equipo.descripcion}</p>
              </>
            )}
          </CardContent>
        </Card>

        {equipo.intervenciones && equipo.intervenciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Últimas intervenciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipo.intervenciones.map((interv) => (
                  <div key={interv.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline">
                        {tipoIntervencionLabels[interv.tipo] || interv.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interv.fecha), "dd/MM/yyyy", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm">{interv.descripcion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          Ficha pública del equipo • Última actualización:{" "}
          {format(new Date(equipo.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
        </p>
      </div>
    </div>
  );
}
