import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";

export default function PortalTecnicoPerfil() {
  const navigate = useNavigate();

  const { data: ficha, isLoading } = useQuery({
    queryKey: ["portal_tecnico_ficha"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("personal_fichas")
        .select("nombre_completo, rut, especialidad, rol_operativo, domicilio, fecha_ingreso")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/portal-tecnico/trabajos")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">Información registrada en tu ficha</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!ficha ? (
            <p className="text-muted-foreground">No se encontró ficha asociada a tu usuario.</p>
          ) : (
            <>
              <div>
                <p className="font-medium">Nombre completo</p>
                <p className="text-muted-foreground">{ficha.nombre_completo}</p>
              </div>
              <div>
                <p className="font-medium">RUT</p>
                <p className="text-muted-foreground">{ficha.rut || "—"}</p>
              </div>
              <div>
                <p className="font-medium">Especialidad</p>
                <p className="text-muted-foreground">{ficha.especialidad || "—"}</p>
              </div>
              <div>
                <p className="font-medium">Rol operativo</p>
                <p className="text-muted-foreground">{ficha.rol_operativo || "—"}</p>
              </div>
              {ficha.domicilio && (
                <div>
                  <p className="font-medium">Domicilio</p>
                  <p className="text-muted-foreground">{ficha.domicilio}</p>
                </div>
              )}
              {ficha.fecha_ingreso && (
                <div>
                  <p className="font-medium">Fecha de ingreso</p>
                  <p className="text-muted-foreground">{ficha.fecha_ingreso}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
