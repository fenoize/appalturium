import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Wrench } from "lucide-react";
import { usePersonalUbicaciones } from "@/hooks/usePersonalUbicacion";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";

export function MapaTecnicos() {
  const { data: ubicaciones, isLoading: loadingUbicaciones } = usePersonalUbicaciones();
  const { data: ordenes, isLoading: loadingOrdenes } = useOrdenesServicio({
    estado: "scheduled",
  });

  if (loadingUbicaciones || loadingOrdenes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Técnicos y OT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </CardContent>
      </Card>
    );
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "online":
        return "bg-green-500";
      case "en_ruta":
        return "bg-blue-500";
      case "en_proceso":
        return "bg-amber-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Técnicos y OT
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Técnicos Activos</p>
                <p className="text-2xl font-bold">
                  {ubicaciones?.filter((u) => u.estado_app !== "offline").length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">OT Programadas</p>
                <p className="text-2xl font-bold">{ordenes?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Lista de técnicos */}
          <div>
            <h3 className="font-semibold mb-3">Técnicos en el campo</h3>
            <div className="space-y-2">
              {ubicaciones && ubicaciones.length > 0 ? (
                ubicaciones
                  .filter((u) => u.estado_app !== "offline")
                  .map((ubicacion) => (
                    <div
                      key={ubicacion.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getEstadoColor(ubicacion.estado_app)}`} />
                        <div>
                          <p className="font-medium">{ubicacion.personal?.nombre_completo || `Técnico ${ubicacion.personal_id.slice(0, 8)}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {ubicacion.estado_app === "en_ruta" && "En ruta"}
                            {ubicacion.estado_app === "en_proceso" && "En proceso"}
                            {ubicacion.estado_app === "online" && "Disponible"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Lat: {Number(ubicacion.lat).toFixed(6)}</p>
                        <p>Lng: {Number(ubicacion.lng).toFixed(6)}</p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay técnicos activos en este momento
                </p>
              )}
            </div>
          </div>

          {/* OT Pendientes */}
          <div>
            <h3 className="font-semibold mb-3">OT Programadas</h3>
            <div className="space-y-2">
              {ordenes && ordenes.length > 0 ? (
                ordenes.slice(0, 5).map((orden) => (
                  <div key={orden.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{orden.numero}</p>
                    <p className="text-sm text-muted-foreground">{orden.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {orden.ubicaciones?.direccion}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay OT programadas
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
