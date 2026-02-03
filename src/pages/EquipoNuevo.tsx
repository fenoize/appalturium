import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EquipoForm } from "@/components/equipos/EquipoForm";

export default function EquipoNuevo() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Registrar Nuevo Equipo</h1>
      </div>

      <EquipoForm
        onSuccess={() => navigate("/inventario")}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
