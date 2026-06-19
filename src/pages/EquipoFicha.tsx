import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  QrCode,
  Calendar,
  Building2,
  User,
  MapPin,
  Tag,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEquipo, estadoEquipoLabels } from "@/hooks/useEquipos";
import { EquipoQRCode } from "@/components/equipos/EquipoQRCode";
import { EquipoMovimientos } from "@/components/equipos/EquipoMovimientos";
import { EquipoIntervenciones } from "@/components/equipos/EquipoIntervenciones";
import { EquipoMateriales } from "@/components/equipos/EquipoMateriales";
import { PlanMantenimientoCard } from "@/components/equipos/PlanMantenimientoCard";
import { formatCurrency } from "@/lib/formatCurrency";

const estadoColors: Record<string, string> = {
  en_bodega: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  asignado_tecnico: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  instalado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  en_mantenimiento: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  dado_de_baja: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function EquipoFicha() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: equipo, isLoading } = useEquipo(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Equipo no encontrado</p>
          <Button asChild>
            <Link to="/inventario">Volver a Inventario</Link>
          </Button>
        </div>
      </div>
    );
  }

  const clienteNombre = equipo.cliente
    ? equipo.cliente.razon_social || `${equipo.cliente.nombres} ${equipo.cliente.apellidos || ""}`
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <QrCode className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold font-mono">{equipo.codigo_qr}</h1>
              <Badge className={estadoColors[equipo.estado]}>
                {estadoEquipoLabels[equipo.estado]}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              {equipo.marca} {equipo.modelo}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/inventario/equipos/${equipo.id}/editar`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipo.numero_serie && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Serie</p>
                      <p className="font-mono">{equipo.numero_serie}</p>
                    </div>
                  </div>
                )}

                {equipo.proveedor && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Proveedor</p>
                      <p>{equipo.proveedor.razon_social}</p>
                    </div>
                  </div>
                )}

                {equipo.fecha_compra && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                      <p>{format(new Date(equipo.fecha_compra), "dd MMMM yyyy", { locale: es })}</p>
                    </div>
                  </div>
                )}

                {equipo.fecha_garantia_fin && (
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Garantía hasta</p>
                      <p>{format(new Date(equipo.fecha_garantia_fin), "dd MMMM yyyy", { locale: es })}</p>
                    </div>
                  </div>
                )}

                {equipo.costo_adquisicion && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Costo de Adquisición</p>
                      <p className="font-medium">{formatCurrency(equipo.costo_adquisicion)}</p>
                    </div>
                  </div>
                )}

                {equipo.ubicacion_actual && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ubicación Actual</p>
                      <p>{equipo.ubicacion_actual}</p>
                    </div>
                  </div>
                )}

                {equipo.tecnico && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Técnico Asignado</p>
                      <p>{equipo.tecnico.nombre_completo}</p>
                    </div>
                  </div>
                )}

                {clienteNombre && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente Instalado</p>
                      <p>{clienteNombre}</p>
                    </div>
                  </div>
                )}
              </div>

              {equipo.descripcion && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                  <p>{equipo.descripcion}</p>
                </div>
              )}

              {equipo.notas && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-muted-foreground italic">{equipo.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs de historial */}
          <Tabs defaultValue="movimientos">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
              <TabsTrigger value="intervenciones">Intervenciones</TabsTrigger>
              <TabsTrigger value="materiales">Materiales</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            <TabsContent value="movimientos" className="mt-4">
              <EquipoMovimientos
                equipoId={equipo.id}
                estadoActual={equipo.estado}
                ubicacionActual={equipo.ubicacion_actual}
              />
            </TabsContent>
            <TabsContent value="intervenciones" className="mt-4">
              <EquipoIntervenciones equipoId={equipo.id} />
            </TabsContent>
            <TabsContent value="materiales" className="mt-4">
              <EquipoMateriales equipoId={equipo.id} />
            </TabsContent>
            <TabsContent value="historial" className="mt-4">
              <HistorialInformes equipoId={equipo.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <EquipoQRCode
            codigo={equipo.codigo_qr}
            marca={equipo.marca}
            modelo={equipo.modelo}
          />
          <PlanMantenimientoCard equipoId={equipo.id} />
        </div>
      </div>
    </div>
  );
}
