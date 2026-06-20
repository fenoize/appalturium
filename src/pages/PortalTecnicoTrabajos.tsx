import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ordenes/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, User } from "lucide-react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";

export default function PortalTecnicoTrabajos() {
  const navigate = useNavigate();

  const { data: trabajos, isLoading } = useQuery({
    queryKey: ["portal_tecnico_trabajos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("asignaciones_ot")
        .select(`
          ot_id,
          ordenes_servicio!inner (
            id, numero, estado, descripcion,
            fecha_programada_inicio, fecha_programada_fin,
            clientes ( razon_social, nombres, apellidos ),
            ubicaciones ( alias, direccion, comuna )
          )
        `)
        .eq("personal_id", user.id);

      if (error) throw error;

      const items = (data ?? [])
        .map((a: any) => a.ordenes_servicio)
        .filter(Boolean);

      // Sort: today first, then by fecha_programada_inicio asc
      items.sort((a: any, b: any) => {
        const da = a.fecha_programada_inicio ? new Date(a.fecha_programada_inicio) : null;
        const db = b.fecha_programada_inicio ? new Date(b.fecha_programada_inicio) : null;
        const aToday = da ? isToday(da) : false;
        const bToday = db ? isToday(db) : false;
        if (aToday !== bToday) return aToday ? -1 : 1;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });

      return items;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Trabajos</h1>
        <p className="text-muted-foreground mt-2">
          Órdenes de trabajo asignadas a ti
        </p>
      </div>

      {(!trabajos || trabajos.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tienes trabajos asignados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trabajos.map((ot: any) => {
            const cliente =
              ot.clientes?.razon_social ||
              `${ot.clientes?.nombres ?? ""} ${ot.clientes?.apellidos ?? ""}`.trim() ||
              "Sin cliente";
            const fecha = ot.fecha_programada_inicio
              ? new Date(ot.fecha_programada_inicio)
              : null;
            const hoy = fecha ? isToday(fecha) : false;
            return (
              <Card
                key={ot.id}
                className="cursor-pointer hover:shadow-smooth-md transition-shadow"
                onClick={() => navigate(`/portal-tecnico/trabajos/${ot.id}`)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{ot.numero}</h3>
                        {hoy && <Badge variant="default">Hoy</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {cliente}
                      </p>
                    </div>
                    <StatusBadge status={ot.estado} />
                  </div>

                  {ot.ubicaciones && (
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {ot.ubicaciones.alias} — {ot.ubicaciones.direccion}
                      {ot.ubicaciones.comuna ? `, ${ot.ubicaciones.comuna}` : ""}
                    </p>
                  )}

                  {fecha && (
                    <p className="text-sm flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(fecha, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
