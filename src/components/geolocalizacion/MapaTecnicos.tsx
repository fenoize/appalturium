import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { usePersonalUbicaciones } from "@/hooks/usePersonalUbicacion";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";

// Fix default marker icons (Leaflet + bundlers)
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CENTRO_SANTIAGO: [number, number] = [-33.4489, -70.6693];

const colorEstado = (estado: string) => {
  switch (estado) {
    case "online":
      return "#22c55e";
    case "en_ruta":
      return "#3b82f6";
    case "en_proceso":
      return "#f59e0b";
    default:
      return "#9ca3af";
  }
};

const iconoTecnico = (estado: string) =>
  L.divIcon({
    className: "tecnico-marker",
    html: `<div style="background:${colorEstado(
      estado
    )};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const iconoOT = L.divIcon({
  className: "ot-marker",
  html: `<div style="background:hsl(0,72%,51%);color:white;width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center;border:2px solid white;font-weight:bold;font-size:11px;box-shadow:0 0 0 1px rgba(0,0,0,0.3);">OT</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapaTecnicosProps {
  estadoFiltro?: string;
}

export function MapaTecnicos({ estadoFiltro = "pendiente" }: MapaTecnicosProps) {
  const { data: ubicaciones, isLoading: loadingUbicaciones } = usePersonalUbicaciones();
  const { data: ordenesResp, isLoading: loadingOrdenes } = useOrdenesServicio({
    estado: estadoFiltro,
  });

  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date();
  finDia.setHours(23, 59, 59, 999);

  const ordenesDelDia = (ordenesResp?.data ?? []).filter((o) => {
    if (!o.fecha_programada_inicio) return false;
    const fecha = new Date(o.fecha_programada_inicio);
    return fecha >= inicioDia && fecha <= finDia;
  });

  const tecnicosActivos = (ubicaciones ?? []).filter((u) => u.estado_app !== "offline");

  if (loadingUbicaciones || loadingOrdenes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Técnicos y OT del día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Técnicos y OT del día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Disponible
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> En ruta
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> En proceso
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400" /> Offline
          </span>
          <span className="ml-auto text-muted-foreground">
            {tecnicosActivos.length} técnicos activos · {ordenesDelDia.length} OTs hoy
          </span>
        </div>

        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={CENTRO_SANTIAGO}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {tecnicosActivos.map((u) => (
              <Marker
                key={`tec-${u.id}`}
                position={[Number(u.lat), Number(u.lng)]}
                icon={iconoTecnico(u.estado_app)}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">
                      {u.personal?.nombre_completo || "Técnico"}
                    </p>
                    <p className="text-muted-foreground">{u.estado_app}</p>
                    {u.personal?.rol_operativo && (
                      <p className="text-muted-foreground">{u.personal.rol_operativo}</p>
                    )}
                    <p className="text-muted-foreground">
                      {new Date(u.captured_at).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {ordenesDelDia
              .filter((o) => o.ubicaciones?.lat && o.ubicaciones?.lng)
              .map((o) => (
                <Marker
                  key={`ot-${o.id}`}
                  position={[Number(o.ubicaciones!.lat), Number(o.ubicaciones!.lng)]}
                  icon={iconoOT}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold">{o.numero}</p>
                      <p>{o.descripcion}</p>
                      <p className="text-muted-foreground">{o.ubicaciones?.direccion}</p>
                      {o.fecha_programada_inicio && (
                        <p className="text-muted-foreground">
                          {new Date(o.fecha_programada_inicio).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
