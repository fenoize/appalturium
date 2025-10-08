import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { useTecnicosCercanos } from "@/hooks/usePersonalUbicacion";

interface TecnicosCercanosProps {
  lat?: number;
  lng?: number;
  direccion?: string;
}

export function TecnicosCercanos({ lat, lng, direccion }: TecnicosCercanosProps) {
  const { data: tecnicos, isLoading } = useTecnicosCercanos(lat, lng);

  if (!lat || !lng) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Técnicos Cercanos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Seleccione una ubicación para ver técnicos cercanos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Técnicos Cercanos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Calculando distancias...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Técnicos Cercanos
        </CardTitle>
        {direccion && (
          <p className="text-sm text-muted-foreground">{direccion}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tecnicos && tecnicos.length > 0 ? (
            tecnicos.slice(0, 10).map((tecnico, index) => (
              <div
                key={tecnico.personal_id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">
                      Técnico {tecnico.personal_id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{tecnico.distancia_km.toFixed(2)} km</span>
                      <span className="ml-2">
                        {tecnico.estado_app === "online" && "Disponible"}
                        {tecnico.estado_app === "en_ruta" && "En ruta"}
                        {tecnico.estado_app === "en_proceso" && "Ocupado"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Asignar
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay técnicos disponibles en este momento
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
