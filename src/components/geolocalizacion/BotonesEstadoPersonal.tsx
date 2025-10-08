import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, MapPin, CheckCircle } from "lucide-react";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useRegistrarUbicacion, EstadoApp } from "@/hooks/usePersonalUbicacion";
import { useToast } from "@/hooks/use-toast";

export function BotonesEstadoPersonal() {
  const { toast } = useToast();
  const [estadoActual, setEstadoActual] = useState<EstadoApp>("offline");
  const registrarUbicacion = useRegistrarUbicacion();

  const { ubicacionActual, error, cargando } = useGeolocalizacion({
    enabled: estadoActual === "en_ruta",
    intervaloMs: 60000, // 60 segundos
    onUbicacion: (coords) => {
      // Registrar ubicación automáticamente cuando está en ruta
      if (estadoActual === "en_ruta") {
        registrarUbicacion.mutate({
          lat: coords.lat,
          lng: coords.lng,
          precision_m: coords.precision,
          estado_app: "en_ruta",
        });
      }
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error de geolocalización",
        description: err.message,
      });
    },
  });

  const handleEnRuta = () => {
    setEstadoActual("en_ruta");
    toast({
      title: "En ruta",
      description: "Iniciando captura de GPS cada 60 segundos",
    });
  };

  const handleLlegue = () => {
    if (!ubicacionActual) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener la ubicación actual",
      });
      return;
    }

    setEstadoActual("en_proceso");
    registrarUbicacion.mutate(
      {
        lat: ubicacionActual.lat,
        lng: ubicacionActual.lng,
        precision_m: ubicacionActual.precision,
        estado_app: "en_proceso",
      },
      {
        onSuccess: () => {
          toast({
            title: "Llegada registrada",
            description: "Geolocalización de inicio capturada",
          });
        },
      }
    );
  };

  const handleCerrar = () => {
    setEstadoActual("online");
    toast({
      title: "Proceso finalizado",
      description: "Puede proceder a crear el informe final",
    });
  };

  const getEstadoLabel = () => {
    switch (estadoActual) {
      case "en_ruta":
        return "En ruta";
      case "en_proceso":
        return "En proceso";
      case "online":
        return "Disponible";
      default:
        return "Offline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control de Estado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Estado actual</p>
          <p className="text-2xl font-bold">{getEstadoLabel()}</p>
          {ubicacionActual && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Lat: {ubicacionActual.lat.toFixed(6)}</p>
              <p>Lng: {ubicacionActual.lng.toFixed(6)}</p>
              {ubicacionActual.precision && (
                <p>Precisión: {ubicacionActual.precision.toFixed(0)}m</p>
              )}
            </div>
          )}
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          <Button
            onClick={handleEnRuta}
            disabled={estadoActual === "en_ruta" || cargando}
            className="w-full"
            variant={estadoActual === "en_ruta" ? "secondary" : "default"}
          >
            <Navigation className="mr-2 h-4 w-4" />
            En ruta
          </Button>

          <Button
            onClick={handleLlegue}
            disabled={estadoActual !== "en_ruta" || !ubicacionActual || cargando}
            className="w-full"
            variant={estadoActual === "en_proceso" ? "secondary" : "default"}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Llegué
          </Button>

          <Button
            onClick={handleCerrar}
            disabled={estadoActual !== "en_proceso"}
            className="w-full"
            variant="outline"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Cerrar e informar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
