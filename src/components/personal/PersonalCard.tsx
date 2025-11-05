import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, UserX, UserCheck, AlertTriangle } from "lucide-react";
import type { PersonalConUsuario } from "@/hooks/usePersonal";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface PersonalCardProps {
  personal: PersonalConUsuario;
  onEdit: (personal: PersonalConUsuario) => void;
  onToggleActivo: (id: string, activo: boolean) => void;
}

export function PersonalCard({
  personal,
  onEdit,
  onToggleActivo,
}: PersonalCardProps) {
  const getRolBadgeVariant = (rol: string) => {
    switch (rol) {
      case "tecnico":
        return "default";
      case "supervisor":
        return "secondary";
      case "administrador":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Verificar si hay alertas (contrato próximo a expirar)
  const diasHastaExpiracion = personal.fecha_termino
    ? differenceInDays(new Date(personal.fecha_termino), new Date())
    : null;

  const tieneAlerta =
    diasHastaExpiracion !== null &&
    diasHastaExpiracion >= 0 &&
    diasHastaExpiracion <= 30;

  return (
    <Card className={!personal.activo ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {personal.nombre_completo}
              </CardTitle>
              {!personal.activo && (
                <Badge variant="outline">Inactivo</Badge>
              )}
              {tieneAlerta && personal.activo && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Contrato por expirar
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              RUT: {personal.rut}
              {personal.email && ` • ${personal.email}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(personal)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleActivo(personal.id, personal.activo)}
            >
              {personal.activo ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={getRolBadgeVariant(personal.rol_operativo)}>
              {personal.rol_operativo}
            </Badge>
            {personal.especialidad?.map((esp) => (
              <Badge key={esp} variant="outline">
                {esp}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Fecha Ingreso</p>
              <p className="font-medium">
                {format(new Date(personal.fecha_ingreso), "dd/MM/yyyy", {
                  locale: es,
                })}
              </p>
            </div>
            {personal.fecha_termino && (
              <div>
                <p className="text-muted-foreground">Fecha Término</p>
                <p
                  className={`font-medium ${
                    tieneAlerta ? "text-destructive" : ""
                  }`}
                >
                  {format(new Date(personal.fecha_termino), "dd/MM/yyyy", {
                    locale: es,
                  })}
                  {tieneAlerta &&
                    ` (${diasHastaExpiracion} días restantes)`}
                </p>
              </div>
            )}
            {personal.domicilio && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Domicilio</p>
                <p className="font-medium">{personal.domicilio}</p>
              </div>
            )}
          </div>

          {personal.etiquetas && personal.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {personal.etiquetas.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
