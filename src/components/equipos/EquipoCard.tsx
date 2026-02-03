import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Eye, MapPin, User, Building2 } from "lucide-react";
import { type Equipo, estadoEquipoLabels } from "@/hooks/useEquipos";
import { Link } from "react-router-dom";

interface EquipoCardProps {
  equipo: Equipo;
}

const estadoColors: Record<string, string> = {
  en_bodega: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  asignado_tecnico: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  instalado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  en_mantenimiento: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  dado_de_baja: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function EquipoCard({ equipo }: EquipoCardProps) {
  const clienteNombre = equipo.cliente
    ? equipo.cliente.razon_social || `${equipo.cliente.nombres} ${equipo.cliente.apellidos || ""}`
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono font-semibold">{equipo.codigo_qr}</span>
          </div>
          <Badge className={estadoColors[equipo.estado]}>
            {estadoEquipoLabels[equipo.estado]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-lg">
            {equipo.marca} {equipo.modelo}
          </p>
          {equipo.numero_serie && (
            <p className="text-sm text-muted-foreground">S/N: {equipo.numero_serie}</p>
          )}
        </div>

        {equipo.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {equipo.descripcion}
          </p>
        )}

        <div className="space-y-1 text-sm">
          {equipo.ubicacion_actual && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{equipo.ubicacion_actual}</span>
            </div>
          )}
          
          {equipo.tecnico && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Técnico: {equipo.tecnico.nombre_completo}</span>
            </div>
          )}
          
          {clienteNombre && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Cliente: {clienteNombre}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to={`/inventario/equipos/${equipo.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Ficha Completa
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
