import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle, AlertCircle, Calendar, FileText, Receipt, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type ActivityItem = {
  id: string;
  type: "ot" | "ot_estado" | "cotizacion" | "documento" | "cliente";
  title: string;
  description: string;
  createdAt: string;
  status: "completed" | "scheduled" | "pending" | "warning" | "info";
};

const statusConfig = {
  completed: { color: "success", label: "Completado" },
  scheduled: { color: "primary", label: "Programado" },
  pending: { color: "warning", label: "Pendiente" },
  warning: { color: "destructive", label: "Atención" },
  info: { color: "secondary", label: "Info" },
};

const iconByType = {
  ot: Calendar,
  ot_estado: CheckCircle,
  cotizacion: FileText,
  documento: Receipt,
  cliente: UserPlus,
} as const;

function mapOtEstado(estado: string): ActivityItem["status"] {
  if (estado === "finalizado") return "completed";
  if (estado === "en_curso") return "scheduled";
  if (estado === "cancelado") return "warning";
  return "pending";
}

export function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ots, logs, cots, docs, clis] = await Promise.all([
      supabase.from("ordenes_servicio").select("id, numero, tipo_trabajo, estado, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("ot_estado_logs").select("id, ot_id, estado_nuevo, created_at, ordenes_servicio(numero)").order("created_at", { ascending: false }).limit(5),
      supabase.from("cotizaciones").select("id, numero, estado, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("documentos_venta").select("id, numero, tipo, total, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("clientes").select("id, tipo, razon_social, nombres, apellidos, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const merged: ActivityItem[] = [];

    ots.data?.forEach((o: any) => merged.push({
      id: `ot-${o.id}`,
      type: "ot",
      title: `OT ${o.numero} creada`,
      description: o.tipo_trabajo || "Nueva orden de servicio",
      createdAt: o.created_at,
      status: mapOtEstado(o.estado),
    }));

    logs.data?.forEach((l: any) => merged.push({
      id: `log-${l.id}`,
      type: "ot_estado",
      title: `OT ${l.ordenes_servicio?.numero ?? ""} → ${l.estado_nuevo}`,
      description: "Cambio de estado",
      createdAt: l.created_at,
      status: mapOtEstado(l.estado_nuevo),
    }));

    cots.data?.forEach((c: any) => merged.push({
      id: `cot-${c.id}`,
      type: "cotizacion",
      title: `Cotización ${c.numero}`,
      description: `Estado: ${c.estado}`,
      createdAt: c.created_at,
      status: c.estado === "aceptada" ? "completed" : c.estado === "rechazada" ? "warning" : "info",
    }));

    docs.data?.forEach((d: any) => merged.push({
      id: `doc-${d.id}`,
      type: "documento",
      title: `${d.tipo?.toUpperCase()} ${d.numero}`,
      description: `Total: $${Number(d.total).toLocaleString("es-CL")}`,
      createdAt: d.created_at,
      status: "info",
    }));

    clis.data?.forEach((c: any) => {
      const nombre = c.tipo === "empresa"
        ? (c.razon_social || "Sin nombre")
        : [c.nombres, c.apellidos].filter(Boolean).join(" ") || "Sin nombre";
      merged.push({
        id: `cli-${c.id}`,
        type: "cliente",
        title: `Nuevo cliente: ${nombre}`,
        description: "Cliente registrado",
        createdAt: c.created_at,
        status: "info",
      });
    });

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(merged.slice(0, 8));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("dashboard-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "ordenes_servicio" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "ot_estado_logs" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "cotizaciones" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "documentos_venta" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <p className="text-sm text-muted-foreground">Cargando actividad…</p>
        )}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
        )}
        {items.map((activity) => {
          const Icon = iconByType[activity.type] ?? AlertCircle;
          const status = statusConfig[activity.status];
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground truncate">{activity.title}</p>
                  <Badge variant={status.color as any} className="ml-2">
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
