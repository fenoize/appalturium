import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import type { UsuarioConRoles } from "@/hooks/useUsuarios";

interface EditarUsuarioDialogProps {
  usuario: UsuarioConRoles;
  onEditar: (userId: string, email?: string, password?: string) => void;
}

export function EditarUsuarioDialog({ usuario, onEditar }: EditarUsuarioDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(usuario.email);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) {
      setEmail(usuario.email);
      setPassword("");
    }
  }, [open, usuario.email]);

  const handleSubmit = () => {
    const newEmail = email !== usuario.email ? email : undefined;
    const newPassword = password.length > 0 ? password : undefined;
    
    if (newEmail || newPassword) {
      onEditar(usuario.id, newEmail, newPassword);
    }
    setOpen(false);
  };

  const hasChanges = email !== usuario.email || password.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario {usuario.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Nueva Contraseña</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="Dejar vacío para mantener la actual"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Solo completa si deseas cambiar la contraseña
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
