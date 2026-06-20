import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, Views, View, SlotInfo } from "react-big-calendar";
import withDragAndDrop, { withDragAndDropProps } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addHours, differenceInMilliseconds } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { supabase } from "@/integrations/supabase/client";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { detectarConflictosAsignacion } from "@/lib/asignaciones-conflictos";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar as any);

interface OTEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

export default function Calendario() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filtros, setFiltros] = useState({ estado: "todos", tipo_trabajo: "todos" });
  const [tecnicoId, setTecnicoId] = useState<string>("todos");
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());
  const [calendarKey, setCalendarKey] = useState(0);

  const { data: ordenesResp, isLoading } = useOrdenesServicio(filtros);
  const ordenes = ordenesResp?.data;
  const { data: estados } = useParametrosSistema("service_statuses");
  const { data: tipos } = useParametrosSistema("work_types");

  // Técnicos disponibles
  const { data: tecnicos } = useQuery({
    queryKey: ["personal_fichas_calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_fichas")
        .select("user_id, nombre_completo")
        .eq("activo", true)
        .order("nombre_completo");
      if (error) throw error;
      return data;
    },
  });

  // Asignaciones para filtrar por técnico
  const { data: asignaciones } = useQuery({
    queryKey: ["asignaciones_ot_calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones_ot")
        .select("ot_id, personal_id");
      if (error) throw error;
      return data;
    },
  });

  const asignacionesPorOT = useMemo(() => {
    const map = new Map<string, string[]>();
    (asignaciones ?? []).forEach((a) => {
      const prev = map.get(a.ot_id) ?? [];
      prev.push(a.personal_id);
      map.set(a.ot_id, prev);
    });
    return map;
  }, [asignaciones]);

  const reprogramarOT = useMutation({
    mutationFn: async ({
      otId,
      inicio,
      fin,
    }: {
      otId: string;
      inicio: Date;
      fin: Date;
    }) => {
      // Validar conflictos con técnicos asignados a esta OT
      const personalIds = asignacionesPorOT.get(otId) ?? [];
      if (personalIds.length > 0) {
        const conflictos = await detectarConflictosAsignacion({
          personalIds,
          inicio,
          fin,
          otIdExcluida: otId,
        });
        if (conflictos.length > 0) {
          throw new Error(
            `Choca con la OT ${conflictos.map((c) => c.numero).join(", ")} del mismo técnico`
          );
        }
      }

      const { error } = await supabase
        .from("ordenes_servicio")
        .update({
          fecha_programada_inicio: inicio.toISOString(),
          fecha_programada_fin: fin.toISOString(),
        })
        .eq("id", otId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_servicio"] });
      toast.success("OT reprogramada");
    },
    onError: (err: any) => {
      toast.error("Error al reprogramar", { description: err.message });
      // Revertir visualmente el evento a su posición original
      setCalendarKey((k) => k + 1);
    },
  });

  const events: OTEvent[] = useMemo(() => {
    if (!ordenes) return [];
    return ordenes
      .filter((ot: any) => ot.fecha_programada_inicio)
      .filter((ot: any) => {
        if (tecnicoId === "todos") return true;
        const ids = asignacionesPorOT.get(ot.id) ?? [];
        return ids.includes(tecnicoId);
      })
      .map((ot: any) => {
        const start = new Date(ot.fecha_programada_inicio);
        const end = ot.fecha_programada_fin
          ? new Date(ot.fecha_programada_fin)
          : addHours(start, 1);
        const cliente = ot.clientes
          ? ot.clientes.razon_social ||
            `${ot.clientes.nombres ?? ""} ${ot.clientes.apellidos ?? ""}`.trim()
          : "";
        return {
          id: ot.id,
          title: `${ot.numero} · ${cliente || ot.tipo_trabajo}`,
          start,
          end,
          resource: ot,
        };
      });
  }, [ordenes, tecnicoId, asignacionesPorOT]);

  const handleEventDrop: withDragAndDropProps["onEventDrop"] = ({ event, start, end }) => {
    const ev = event as OTEvent;
    const s = start instanceof Date ? start : new Date(start);
    let e = end instanceof Date ? end : new Date(end);
    // Preserve duration if end missing
    if (!e || differenceInMilliseconds(e, s) <= 0) {
      e = addHours(s, 1);
    }
    reprogramarOT.mutate({ otId: ev.id, inicio: s, fin: e });
  };

  const handleEventResize: withDragAndDropProps["onEventResize"] = ({ event, start, end }) => {
    const ev = event as OTEvent;
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    reprogramarOT.mutate({ otId: ev.id, inicio: s, fin: e });
  };

  const handleSelectEvent = (event: object) => {
    const ev = event as OTEvent;
    navigate(`/ordenes-servicio/${ev.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Calendario de Servicios</h1>
            <p className="text-primary-foreground/80">
              Arrastra una OT para reprogramarla. Haz click para ver el detalle.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Select
              value={filtros.estado}
              onValueChange={(value) => setFiltros((p) => ({ ...p, estado: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estados?.map((e) => (
                  <SelectItem key={e.key} value={e.key}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filtros.tipo_trabajo}
              onValueChange={(value) => setFiltros((p) => ({ ...p, tipo_trabajo: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tipos?.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los técnicos</SelectItem>
                {tecnicos?.map((t) => (
                  <SelectItem key={t.user_id} value={t.user_id}>
                    {t.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando calendario...</div>
          ) : (
            <div style={{ height: "70vh" }}>
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onSelectEvent={handleSelectEvent}
                resizable
                popup
                culture="es"
                messages={{
                  today: "Hoy",
                  previous: "Anterior",
                  next: "Siguiente",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "Sin OT programadas en este rango",
                  showMore: (n) => `+${n} más`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
