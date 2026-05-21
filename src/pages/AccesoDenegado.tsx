import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function AccesoDenegado() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 p-6">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold">Acceso denegado</h1>
      <p className="text-muted-foreground max-w-md">
        No tienes los permisos necesarios para acceder a esta sección. Si crees que es un error, contacta a un administrador.
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/auth">Ir a iniciar sesión</Link>
        </Button>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
