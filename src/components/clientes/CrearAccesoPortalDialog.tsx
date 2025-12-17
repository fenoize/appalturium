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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface CrearAccesoPortalDialogProps {
  clienteId: string;
  clienteEmail: string | null;
  clienteName: string;
  hasAccess: boolean;
  onSuccess?: () => void;
}

export function CrearAccesoPortalDialog({
  clienteId,
  clienteEmail,
  clienteName,
  hasAccess,
  onSuccess,
}: CrearAccesoPortalDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(clienteEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Ingrese email y contraseña",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "create_for_cliente",
          email,
          password,
          clienteId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Acceso creado",
        description: `Se ha creado el acceso al portal para ${clienteName}`,
      });

      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error al crear acceso",
        description: error.message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess) {
    return (
      <Button variant="outline" disabled>
        <KeyRound className="h-4 w-4 mr-2" />
        Ya tiene acceso al portal
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound className="h-4 w-4 mr-2" />
          Crear Acceso al Portal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Acceso al Portal</DialogTitle>
          <DialogDescription>
            Crear credenciales de acceso al portal de clientes para {clienteName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Acceso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
