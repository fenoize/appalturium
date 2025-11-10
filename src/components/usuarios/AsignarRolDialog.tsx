import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import type { UsuarioConRoles } from "@/hooks/useUsuarios";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AsignarRolDialogProps {
  usuario: UsuarioConRoles;
  rolesDisponibles: AppRole[];
  onAsignar: (userId: string, role: AppRole) => void;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  cliente: "Cliente",
};

export function AsignarRolDialog({
  usuario,
  rolesDisponibles,
  onAsignar,
}: AsignarRolDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");

  const rolesNoAsignados = rolesDisponibles.filter(
    (role) => !usuario.roles.includes(role)
  );

  const handleSubmit = () => {
    if (selectedRole) {
      onAsignar(usuario.id, selectedRole);
      setSelectedRole("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={rolesNoAsignados.length === 0}>
          <UserPlus className="h-4 w-4 mr-2" />
          Asignar Rol
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Rol</DialogTitle>
          <DialogDescription>
            Asignar un nuevo rol a {usuario.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as AppRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {rolesNoAsignados.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role] || role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedRole}>
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
