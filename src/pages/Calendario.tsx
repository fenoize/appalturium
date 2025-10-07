import { useState } from "react";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";
import { useCalendario } from "@/hooks/useCalendario";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarioSemanal } from "@/components/calendario/CalendarioSemanal";
import { CalendarioMensual } from "@/components/calendario/CalendarioMensual";
import { GanttView } from "@/components/calendario/GanttView";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  List
} from "lucide-react";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { es } from "date-fns/locale";

export default function Calendario() {
  const [filtros, setFiltros] = useState({
    estado: "",
    tipo_trabajo: "",
  });

  const {
    view,
    setView,
    currentDate,
    setCurrentDate,
    getVisibleDateRange,
    getDaysInView,
    reprogramarOT,
  } = useCalendario();

  const { data: ordenes, isLoading } = useOrdenesServicio(filtros);
  const { data: estados } = useParametrosSistema("service_statuses");
  const { data: tipos } = useParametrosSistema("work_types");

  const handlePrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, -1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, -1));
        break;
      case "month":
      case "gantt":
        setCurrentDate(addMonths(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
      case "gantt":
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleReprogramar = (otId: string, nuevaFecha: Date, duracion: number) => {
    reprogramarOT.mutate({ otId, nuevaFechaInicio: nuevaFecha, duracionDias: duracion });
  };

  const handleDiaClick = (fecha: Date) => {
    setCurrentDate(fecha);
    setView("day");
  };

  const getTituloFecha = () => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
      case "week":
        const range = getVisibleDateRange();
        return `${format(range.start, "d MMM", { locale: es })} - ${format(range.end, "d MMM yyyy", { locale: es })}`;
      case "month":
      case "gantt":
        return format(currentDate, "MMMM yyyy", { locale: es });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Calendario de Servicios</h1>
              <p className="text-primary-foreground/80">
                Programa y gestiona las órdenes de servicio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Navegación de fecha */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Hoy
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold ml-4 capitalize">
                {getTituloFecha()}
              </div>
            </div>

            {/* Vista y Filtros */}
            <div className="flex flex-wrap gap-2">
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Día
                    </div>
                  </SelectItem>
                  <SelectItem value="week">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Semana
                    </div>
                  </SelectItem>
                  <SelectItem value="month">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Mes
                    </div>
                  </SelectItem>
                  <SelectItem value="gantt">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Gantt
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.estado}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {estados?.map((estado) => (
                    <SelectItem key={estado.key} value={estado.key}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtros.tipo_trabajo}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo_trabajo: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {tipos?.map((tipo) => (
                    <SelectItem key={tipo.key} value={tipo.key}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista del calendario */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando calendario...
            </div>
          ) : ordenes ? (
            <>
              {(view === "day" || view === "week") && (
                <CalendarioSemanal
                  ordenes={ordenes}
                  dias={getDaysInView()}
                  onReprogramar={handleReprogramar}
                />
              )}
              {view === "month" && (
                <CalendarioMensual
                  ordenes={ordenes}
                  dias={getDaysInView()}
                  currentDate={currentDate}
                  onDiaClick={handleDiaClick}
                />
              )}
              {view === "gantt" && (
                <GanttView
                  ordenes={ordenes}
                  rangoFechas={getVisibleDateRange()}
                />
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
