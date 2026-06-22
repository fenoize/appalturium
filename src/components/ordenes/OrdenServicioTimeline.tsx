import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  History,
  FileText,
  ClipboardCheck,
  Layers,
  CheckCircle2,
  PlayCircle,
  UserPlus,
  RefreshCw,
  Lock,
  Globe,
  UserCog,
} from "lucide-react";

interface TimelineEvent {
  ts: string;
  icon: typeof FileText;
  title: string;
  description?: string;
  actor?: string | null;
  badge?: { label: string; variant?: "default" | "secondary" | "outline" };
}

interface OrdenServicioTimelineProps {
  otId: string;
}

export function OrdenServicioTimeline({ otId }: OrdenServicioTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["ot_timeline", otId],
    queryFn: async () => {
      // OT principal
      const { data: ot } = await supabase
        .from("ordenes_servicio")
        .select("id, numero, estado, created_at, created_by_user_id")
        .eq("id", otId)
        .maybeSingle();

      // Cotización de origen (vinculada por ot_id)
      const { data: cotizacion } = await supabase
        .from("cotizaciones")
        .select(
          "id, numero, created_at, created_by, aceptada_ts, aceptada_por_nombre, aceptada_por_email, rechazada_ts, rechazo_motivo, solicitud_cotizacion_id"
        )
        .eq("ot_id", otId)
        .maybeSingle();

      // Presupuestos asociados (cot o sc)
      let presupuestos: any[] = [];
      if (cotizacion?.id) {
        const { data } = await supabase
          .from("presupuestos")
          .select("id, estado, created_at, aprobado_ts")
          .or(
            `cotizacion_id.eq.${cotizacion.id}${cotizacion.solicitud_cotizacion_id ? `,solicitud_cotizacion_id.eq.${cotizacion.solicitud_cotizacion_id}` : ""}`
          );
        presupuestos = data ?? [];
      }

      // Opciones de cotización
      let opciones: any[] = [];
      if (cotizacion?.id) {
        const { data } = await supabase
          .from("cotizacion_opciones")
          .select("id, etiqueta, estado, created_at, presentada_ts, aceptada_ts, rechazada_ts")
          .eq("cotizacion_id", cotizacion.id);
        opciones = data ?? [];
      }

      // Asignaciones
      const { data: asignaciones } = await supabase
        .from("asignaciones_ot")
        .select("id, personal_id, rol_en_ot, created_at")
        .eq("ot_id", otId);

      // Cambios de estado
      const { data: logsEstado } = await supabase
        .from("ot_estado_logs")
        .select("id, estado_anterior, estado_nuevo, cambio_realizado_por, created_at")
        .eq("ot_id", otId);

      // Cierre
      const { data: cierre } = await supabase
        .from("cierres_ot")
        .select("id, fecha_revision, revisado_por, conforme, observaciones")
        .eq("ot_id", otId)
        .maybeSingle();

      // Resolver nombres de usuarios (personal_fichas.user_id -> nombre_completo)
      const userIds = new Set<string>();
      if (ot?.created_by_user_id) userIds.add(ot.created_by_user_id);
      if (cotizacion?.created_by) userIds.add(cotizacion.created_by);
      (asignaciones ?? []).forEach((a) => a.personal_id && userIds.add(a.personal_id));
      (logsEstado ?? []).forEach((l) => l.cambio_realizado_por && userIds.add(l.cambio_realizado_por));
      if (cierre?.revisado_por) userIds.add(cierre.revisado_por);

      let userMap = new Map<string, string>();
      if (userIds.size > 0) {
        const { data: fichas } = await supabase
          .from("personal_fichas")
          .select("user_id, nombre_completo")
          .in("user_id", Array.from(userIds));
        (fichas ?? []).forEach((f: any) => {
          if (f.user_id) userMap.set(f.user_id, f.nombre_completo);
        });
      }

      return { ot, cotizacion, presupuestos, opciones, asignaciones: asignaciones ?? [], logsEstado: logsEstado ?? [], cierre, userMap };
    },
    enabled: !!otId,
  });

  if (isLoading || !data?.ot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Línea de tiempo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Cargando historia de la OT…</CardContent>
      </Card>
    );
  }

  const { ot, cotizacion, presupuestos, opciones, asignaciones, logsEstado, cierre, userMap } = data;
  const nombreDe = (uid?: string | null) => (uid ? userMap.get(uid) ?? null : null);

  const events: TimelineEvent[] = [];

  // Cotización
  if (cotizacion) {
    events.push({
      ts: cotizacion.created_at,
      icon: FileText,
      title: `Cotización ${cotizacion.numero} creada`,
      actor: nombreDe(cotizacion.created_by),
    });

    // Presupuesto interno aprobado
    const presupAprob = presupuestos.find((p) => p.estado === "aprobado" && p.aprobado_ts);
    if (presupAprob) {
      events.push({
        ts: presupAprob.aprobado_ts,
        icon: ClipboardCheck,
        title: "Presupuesto interno aprobado",
      });
    } else if (presupuestos.length > 0) {
      const first = presupuestos.sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      events.push({
        ts: first.created_at,
        icon: ClipboardCheck,
        title: "Presupuesto interno creado",
      });
    }

    // Opciones generadas (primer created_at de las opciones)
    if (opciones.length > 0) {
      const primera = opciones.reduce((min, o) => (o.created_at < min ? o.created_at : min), opciones[0].created_at);
      events.push({
        ts: primera,
        icon: Layers,
        title: `Opciones de cotización generadas (${opciones.length})`,
        description: opciones.map((o) => o.etiqueta).filter(Boolean).join(", "),
      });

      // Presentaciones
      opciones
        .filter((o) => o.presentada_ts)
        .forEach((o) =>
          events.push({
            ts: o.presentada_ts,
            icon: PlayCircle,
            title: `Opción ${o.etiqueta} presentada al cliente`,
          })
        );
    }

    // Aceptación / rechazo de cotización
    if (cotizacion.aceptada_ts) {
      const viaPortal = !!cotizacion.aceptada_por_email;
      events.push({
        ts: cotizacion.aceptada_ts,
        icon: CheckCircle2,
        title: viaPortal ? "Cotización aceptada por el cliente" : "Cotización aceptada (interno)",
        description: viaPortal
          ? `${cotizacion.aceptada_por_nombre ?? "Cliente"}${cotizacion.aceptada_por_email ? ` <${cotizacion.aceptada_por_email}>` : ""}`
          : undefined,
        badge: viaPortal
          ? { label: "Portal cliente", variant: "default" }
          : { label: "Manual", variant: "secondary" },
      });
    }
    if (cotizacion.rechazada_ts) {
      events.push({
        ts: cotizacion.rechazada_ts,
        icon: Lock,
        title: "Cotización rechazada",
        description: cotizacion.rechazo_motivo ?? undefined,
      });
    }
  }

  // Creación OT
  events.push({
    ts: ot.created_at,
    icon: FileText,
    title: `Orden de Trabajo ${ot.numero} creada`,
    actor: nombreDe(ot.created_by_user_id),
  });

  // Asignaciones
  asignaciones.forEach((a) => {
    events.push({
      ts: a.created_at,
      icon: UserPlus,
      title: `Técnico asignado${a.rol_en_ot ? ` (${a.rol_en_ot})` : ""}`,
      actor: nombreDe(a.personal_id),
    });
  });

  // Cambios de estado
  logsEstado.forEach((l) => {
    events.push({
      ts: l.created_at,
      icon: RefreshCw,
      title: `Estado: ${l.estado_anterior ?? "—"} → ${l.estado_nuevo}`,
      actor: nombreDe(l.cambio_realizado_por),
    });
  });

  // Cierre
  if (cierre) {
    events.push({
      ts: cierre.fecha_revision,
      icon: Lock,
      title: cierre.conforme ? "OT cerrada conforme" : "OT cerrada no conforme",
      actor: nombreDe(cierre.revisado_por),
      description: cierre.observaciones ?? undefined,
    });
  }

  // Ordenar cronológicamente
  events.sort((a, b) => a.ts.localeCompare(b.ts));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Línea de tiempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-6">
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-medium text-sm">{e.title}</p>
                    {e.badge && (
                      <Badge variant={e.badge.variant ?? "outline"} className="text-xs">
                        {e.badge.variant === "default" ? <Globe className="h-3 w-3 mr-1" /> : <UserCog className="h-3 w-3 mr-1" />}
                        {e.badge.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(e.ts), "dd MMM yyyy, HH:mm", { locale: es })}
                    {e.actor ? ` · ${e.actor}` : ""}
                  </p>
                  {e.description && (
                    <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
