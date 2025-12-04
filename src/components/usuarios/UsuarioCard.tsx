import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Shield, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { UsuarioConRoles } from "@/hooks/useUsuarios";

interface UsuarioCardProps {
  usuario: UsuarioConRoles;
  onRemoverRol: (userId: string, role: string) => void;
}

const roleColors: Record<string, string> = {
  admin: "bg-destructive text-destructive-foreground",
  supervisor: "bg-primary text-primary-foreground",
  cliente: "bg-muted text-muted-foreground",
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  cliente: "Cliente",
};

export function UsuarioCard({ usuario, onRemoverRol }: UsuarioCardProps) {
  const formatDate = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return format(date, formatStr, { locale: es });
  };

  const createdAt = formatDate(usuario.created_at, "PP");
  const lastSignIn = formatDate(usuario.last_sign_in_at, "PPp");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-base">{usuario.email}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del usuario */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{usuario.email}</span>
          </div>
          {createdAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Creado: {createdAt}</span>
            </div>
          )}
          {lastSignIn && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Último acceso: {lastSignIn}</span>
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Roles asignados:</p>
          <div className="flex flex-wrap gap-2">
            {usuario.roles.length === 0 ? (
              <span className="text-sm text-muted-foreground">Sin roles asignados</span>
            ) : (
              usuario.roles.map((role) => (
                <Badge
                  key={role}
                  className={roleColors[role] || "bg-muted text-muted-foreground"}
                >
                  <span>{roleLabels[role] || role}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-2 p-0 hover:bg-transparent"
                    onClick={() => onRemoverRol(usuario.id, role)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
