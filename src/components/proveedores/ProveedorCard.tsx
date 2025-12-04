import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Phone, Mail, Globe, MapPin, User } from "lucide-react";
import { type Proveedor } from "@/hooks/useProveedores";

interface ProveedorCardProps {
  proveedor: Proveedor;
  onEdit: () => void;
  onDelete: () => void;
}

const condicionesPagoLabels: Record<string, string> = {
  contado: "Contado",
  "15d": "15 días",
  "30d": "30 días",
  "45d": "45 días",
  "60d": "60 días",
  otro: "Otro",
};

export function ProveedorCard({ proveedor, onEdit, onDelete }: ProveedorCardProps) {
  return (
    <Card className={!proveedor.activo ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{proveedor.razon_social}</CardTitle>
            {proveedor.nombre_fantasia && (
              <p className="text-sm text-muted-foreground truncate">
                {proveedor.nombre_fantasia}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono">
            {proveedor.rut}
          </Badge>
          {proveedor.condiciones_pago && (
            <Badge variant="secondary">
              {condicionesPagoLabels[proveedor.condiciones_pago] || proveedor.condiciones_pago}
            </Badge>
          )}
          {!proveedor.activo && (
            <Badge variant="destructive">Inactivo</Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {proveedor.telefono && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{proveedor.telefono}</span>
            </div>
          )}
          {proveedor.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{proveedor.email}</span>
            </div>
          )}
          {proveedor.sitio_web && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <a
                href={proveedor.sitio_web}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:underline text-primary"
              >
                {proveedor.sitio_web.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {(proveedor.ciudad || proveedor.region) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {[proveedor.ciudad, proveedor.region].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {proveedor.contacto_nombre && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{proveedor.contacto_nombre}</span>
            </div>
            {proveedor.contacto_telefono && (
              <p className="text-xs text-muted-foreground ml-6">
                {proveedor.contacto_telefono}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
