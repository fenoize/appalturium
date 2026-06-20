import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ordenes/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InformeFinalForm } from "@/components/ordenes/InformeFinalForm";
import { ArrowLeft, MapPin, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const TRANSICIONES_OT: Record<string, string[]> = {
  pendiente: ["en_curso", "cancelado"],
  en_curso: ["en_pausa", "finalizado", "cancelado"],
  en_pausa: ["en_curso", "cancelado"],
  finalizado: [],
  cancelado: [],
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  en_pausa: "En pausa",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export default function PortalTecnicoTrabajoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cambiando, setCambiando] = useState(false);

  const { data: ot, isLoading } = useQuery({
    queryKey: ["portal_tecnico_ot", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes_servicio")
        .select(`
          *,
          clientes ( razon_social, nombres, apellidos, telefono, email ),
          ubicaciones ( alias, direccion, comuna, ciudad, region )
        `)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleCambiarEstado = async (nuevo: string) => {
    if (!ot || nuevo === ot.estado) return;
    setCambiando(true);
    try {
      const { error } = await supabase
        .from("ordenes_servicio")
        .update({ estado: nuevo })
        .eq("id", ot.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["portal_tecnico_ot", id] });
      await queryClient.invalidateQueries({ queryKey: ["portal_tecnico_trabajos"] });
      toast.success("Estado actualizado");
    } catch (err: any) {
      toast.error("Error al cambiar estado", { description: err.message });
    } finally {
      setCambiando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!ot) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Trabajo no encontrado</p>
        <Button onClick={() => navigate("/portal-tecnico/trabajos")} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const cliente =
    ot.clientes?.razon_social ||
    `${ot.clientes?.nombres ?? ""} ${ot.clientes?.apellidos ?? ""}`.trim() ||
    "Sin cliente";

  const transicionesValidas = TRANSICIONES_OT[ot.estado] ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate("/portal-tecnico/trabajos")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a mis trabajos
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{ot.numero}</h1>
          <p className="text-muted-foreground mt-1">{ot.tipo_trabajo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ot.estado} />
          <Select
            value={ot.estado}
            onValueChange={handleCambiarEstado}
            disabled={cambiando || transicionesValidas.length === 0}
          >
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="Cambiar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ot.estado}>{ESTADO_LABELS[ot.estado] ?? ot.estado}</SelectItem>
              {transicionesValidas.map((t) => (
                <SelectItem key={t} value={t}>
                  {ESTADO_LABELS[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-4 h-4" /> Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{cliente}</p>
          {ot.clientes?.telefono && <p className="text-muted-foreground">{ot.clientes.telefono}</p>}
          {ot.clientes?.email && <p className="text-muted-foreground">{ot.clientes.email}</p>}
        </CardContent>
      </Card>

      {ot.ubicaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{ot.ubicaciones.alias}</p>
            <p>{ot.ubicaciones.direccion}</p>
            <p className="text-muted-foreground">
              {[ot.ubicaciones.comuna, ot.ubicaciones.ciudad, ot.ubicaciones.region]
                .filter(Boolean)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      {ot.fecha_programada_inicio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Programación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Inicio:{" "}
              {format(new Date(ot.fecha_programada_inicio), "EEEE d 'de' MMMM, HH:mm", {
                locale: es,
              })}
            </p>
            {ot.fecha_programada_fin && (
              <p>
                Fin:{" "}
                {format(new Date(ot.fecha_programada_fin), "EEEE d 'de' MMMM, HH:mm", {
                  locale: es,
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {ot.descripcion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descripción del trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{ot.descripcion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
