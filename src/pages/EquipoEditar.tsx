import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { EquipoForm } from "@/components/equipos/EquipoForm";
import { useEquipo } from "@/hooks/useEquipos";

export default function EquipoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: equipo, isLoading } = useEquipo(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Equipo no encontrado</p>
          <Button onClick={() => navigate("/inventario")}>Volver a Inventario</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Equipo</h1>
          <p className="text-muted-foreground font-mono">{equipo.codigo_qr}</p>
        </div>
      </div>

      <EquipoForm
        equipo={equipo}
        onSuccess={() => navigate(`/inventario/equipos/${equipo.id}`)}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
