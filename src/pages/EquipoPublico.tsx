import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  QrCode,
  Calendar,
  Building2,
  User,
  MapPin,
  Tag,
  Shield,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  useEquipoPorCodigo,
  useEquipoMovimientos,
  useEquipoIntervenciones,
  estadoEquipoLabels,
  tipoIntervencionLabels,
  tipoMovimientoLabels,
} from "@/hooks/useEquipos";

const estadoColors: Record<string, string> = {
  en_bodega: "bg-blue-100 text-blue-800",
  asignado_tecnico: "bg-yellow-100 text-yellow-800",
  instalado: "bg-green-100 text-green-800",
  en_mantenimiento: "bg-orange-100 text-orange-800",
  dado_de_baja: "bg-red-100 text-red-800",
};

export default function EquipoPublico() {
  const { codigo } = useParams();
  const { data: equipo, isLoading, error } = useEquipoPorCodigo(codigo);
  const { data: movimientos } = useEquipoMovimientos(equipo?.id);
  const { data: intervenciones } = useEquipoIntervenciones(equipo?.id);

  if (isLoading) {
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
              El código QR escaneado no corresponde a ningún equipo registrado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clienteNombre = equipo.cliente
    ? equipo.cliente.razon_social || `${equipo.cliente.nombres} ${equipo.cliente.apellidos || ""}`
    : null;

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <span className="font-mono text-xl font-bold">{equipo.codigo_qr}</span>
              </div>
              <Badge className={estadoColors[equipo.estado]}>
                {estadoEquipoLabels[equipo.estado]}
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
          </CardContent>
        </Card>

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipo.proveedor && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Proveedor</p>
                  <p>{equipo.proveedor.razon_social}</p>
                </div>
              </div>
            )}

            {equipo.fecha_compra && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                  <p>{format(new Date(equipo.fecha_compra), "dd MMMM yyyy", { locale: es })}</p>
                </div>
              </div>
            )}

            {equipo.fecha_garantia_fin && (
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Garantía hasta</p>
                  <p>{format(new Date(equipo.fecha_garantia_fin), "dd MMMM yyyy", { locale: es })}</p>
                </div>
              </div>
            )}

            {equipo.ubicacion_actual && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p>{equipo.ubicacion_actual}</p>
                </div>
              </div>
            )}

            {equipo.tecnico && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Técnico Asignado</p>
                  <p>{equipo.tecnico.nombre_completo}</p>
                </div>
              </div>
            )}

            {clienteNombre && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p>{clienteNombre}</p>
                </div>
              </div>
            )}

            {equipo.descripcion && (
              <>
                <Separator />
                <p className="text-sm">{equipo.descripcion}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Intervenciones */}
        {intervenciones && intervenciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Historial de Intervenciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {intervenciones.slice(0, 5).map((interv) => (
                  <div key={interv.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline">
                        {tipoIntervencionLabels[interv.tipo]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interv.fecha), "dd/MM/yyyy", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm">{interv.descripcion}</p>
                    {interv.tecnico && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Técnico: {interv.tecnico.nombre_completo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movimientos */}
        {movimientos && movimientos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {movimientos.slice(0, 5).map((mov) => (
                  <div key={mov.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(mov.fecha), "dd/MM/yy", { locale: es })}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {tipoMovimientoLabels[mov.tipo] || mov.tipo}
                    </Badge>
                    {mov.ubicacion_destino && (
                      <>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>{mov.ubicacion_destino}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Ficha técnica del equipo • Última actualización:{" "}
          {format(new Date(equipo.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
        </p>
      </div>
    </div>
  );
}
