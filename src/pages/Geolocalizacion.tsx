import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapaTecnicos } from "@/components/geolocalizacion/MapaTecnicos";
import { BotonesEstadoPersonal } from "@/components/geolocalizacion/BotonesEstadoPersonal";
import { TecnicosCercanos } from "@/components/geolocalizacion/TecnicosCercanos";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Geolocalizacion() {
  const [otSeleccionada, setOtSeleccionada] = useState<string>("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("scheduled");
  const { data: estadosOT } = useParametrosSistema("service_statuses");
  const { data: ordenesResp } = useOrdenesServicio({ estado: estadoFiltro });
  const ordenes = ordenesResp?.data;

  const ordenSeleccionada = ordenes?.find((o) => o.id === otSeleccionada);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Geolocalización</h1>
        <p className="text-muted-foreground">
          Control de ubicación del personal y asignación por cercanía
        </p>
      </div>

      <Tabs defaultValue="mapa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="personal">Mi Estado</TabsTrigger>
          <TabsTrigger value="asignacion">Asignación por Cercanía</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <MapaTecnicos />
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <BotonesEstadoPersonal />
            <Card>
              <CardHeader>
                <CardTitle>Instrucciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. En ruta</h3>
                  <p className="text-sm text-muted-foreground">
                    Inicia la captura automática de GPS cada 60 segundos. Úsalo cuando
                    te dirijas a una OT.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Llegué</h3>
                  <p className="text-sm text-muted-foreground">
                    Marca tu llegada a la ubicación con timestamp y coordenadas exactas.
                    Disponible solo cuando estás "En ruta".
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Cerrar e informar</h3>
                  <p className="text-sm text-muted-foreground">
                    Finaliza el proceso en la OT. Después de esto puedes proceder a
                    crear el informe final.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="asignacion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar OT para Asignación</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={otSeleccionada} onValueChange={setOtSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una OT programada" />
                </SelectTrigger>
                <SelectContent>
                  {ordenes?.map((orden) => (
                    <SelectItem key={orden.id} value={orden.id}>
                      {orden.numero} - {orden.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {ordenSeleccionada && (
            <TecnicosCercanos
              direccion={ordenSeleccionada?.ubicaciones?.direccion}
            />
          )}
          {!ordenSeleccionada && (
            <TecnicosCercanos />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
