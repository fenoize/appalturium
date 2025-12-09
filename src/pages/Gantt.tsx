import { useState, useMemo, useRef, useEffect, useCallback, type FC } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProyectos, useActualizarProyecto } from "@/hooks/useProyectos";
import { useTareas, useActualizarTarea } from "@/hooks/useTareas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  GanttChart,
  Calendar as CalendarViewIcon,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ListTodo,
  Eye,
  X,
  Download,
  FileImage,
  FileText,
  Loader2,
  GripVertical,
} from "lucide-react";

type VistaRango = "semana" | "mes" | "trimestre";
type OrdenarPor = "nombre" | "fecha_inicio" | "fecha_fin" | "prioridad" | "estado";
type Direccion = "asc" | "desc";
type TipoVista = "gantt" | "calendario";
type MostrarEntidades = "proyectos" | "tareas" | "ambos";

const prioridadOrden = { urgente: 0, alta: 1, media: 2, baja: 3 };
const estadoOrdenProyecto = { en_progreso: 0, planificacion: 1, pausado: 2, completado: 3, cancelado: 4 };
const estadoOrdenTarea = { en_progreso: 0, pendiente: 1, revision: 2, completada: 3, cancelada: 4 };

const coloresPrioridad: Record<string, string> = {
  urgente: "hsl(0 84% 60%)",
  alta: "hsl(25 95% 53%)",
  media: "hsl(217 91% 60%)",
  baja: "hsl(142 71% 45%)",
};

const coloresEstadoProyecto: Record<string, string> = {
  planificacion: "hsl(217 91% 60%)",
  en_progreso: "hsl(142 71% 45%)",
  pausado: "hsl(45 93% 47%)",
  completado: "hsl(142 71% 35%)",
  cancelado: "hsl(0 0% 60%)",
};

const coloresEstadoTarea: Record<string, string> = {
  pendiente: "hsl(217 91% 60%)",
  en_progreso: "hsl(142 71% 45%)",
  revision: "hsl(45 93% 47%)",
  completada: "hsl(142 71% 35%)",
  cancelada: "hsl(0 0% 60%)",
};

interface GanttItem {
  id: string;
  tipo: "proyecto" | "tarea";
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  prioridad: string;
  estado: string;
  proyectoNombre?: string;
  proyecto_id?: string;
}

// Draggable Bar Component
function DraggableBar({
  item,
  position,
  color,
  rangoStart,
  totalDias,
  onDragEnd,
}: {
  item: GanttItem;
  position: { left: string; width: string };
  color: string;
  rangoStart: Date;
  totalDias: number;
  onDragEnd: (id: string, tipo: "proyecto" | "tarea", newStart: Date, newEnd: Date) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"start" | "end" | null>(null);
  const dragOffset = useRef({ x: 0, startLeft: 0, startWidth: 0 });

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize-start" | "resize-end") => {
    e.preventDefault();
    e.stopPropagation();

    if (!barRef.current) return;

    const startLeft = parseFloat(position.left);
    const startWidth = parseFloat(position.width);

    dragOffset.current = {
      x: e.clientX,
      startLeft,
      startWidth,
    };

    if (action === "drag") {
      setIsDragging(true);
    } else if (action === "resize-start") {
      setIsResizing("start");
    } else {
      setIsResizing("end");
    }
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current || !barRef.current.parentElement) return;

      const parentRect = barRef.current.parentElement.getBoundingClientRect();
      const deltaX = e.clientX - dragOffset.current.x;
      const deltaPercent = (deltaX / parentRect.width) * 100;

      if (isDragging) {
        const newLeft = Math.max(0, Math.min(100 - dragOffset.current.startWidth, dragOffset.current.startLeft + deltaPercent));
        barRef.current.style.left = `${newLeft}%`;
      } else if (isResizing === "end") {
        const newWidth = Math.max(2, Math.min(100 - dragOffset.current.startLeft, dragOffset.current.startWidth + deltaPercent));
        barRef.current.style.width = `${newWidth}%`;
      } else if (isResizing === "start") {
        const newLeft = Math.max(0, dragOffset.current.startLeft + deltaPercent);
        const newWidth = Math.max(2, dragOffset.current.startWidth - deltaPercent);
        if (newLeft + newWidth <= 100) {
          barRef.current.style.left = `${newLeft}%`;
          barRef.current.style.width = `${newWidth}%`;
        }
      }
    };

    const handleMouseUp = () => {
      if (!barRef.current) return;

      const newLeft = parseFloat(barRef.current.style.left);
      const newWidth = parseFloat(barRef.current.style.width);

      const startDayOffset = Math.round((newLeft / 100) * totalDias);
      const durationDays = Math.round((newWidth / 100) * totalDias);

      const newStartDate = addDays(rangoStart, startDayOffset);
      const newEndDate = addDays(newStartDate, Math.max(0, durationDays - 1));

      onDragEnd(item.id, item.tipo, newStartDate, newEndDate);

      setIsDragging(false);
      setIsResizing(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, totalDias, rangoStart, item.id, item.tipo, onDragEnd]);

  const isTarea = item.tipo === "tarea";

  return (
    <div
      ref={barRef}
      className={cn(
        "absolute flex items-center shadow-sm group/bar",
        "hover:shadow-md transition-shadow select-none",
        isTarea ? "h-6 top-4 rounded-sm" : "h-8 top-3 rounded-md",
        (isDragging || isResizing) && "opacity-80 shadow-lg z-20"
      )}
      style={{
        left: position.left,
        width: position.width,
        backgroundColor: color,
        color: "white",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      title={`${item.nombre}\n${item.fecha_inicio ? format(new Date(item.fecha_inicio), "d MMM", { locale: es }) : "Sin fecha"} - ${item.fecha_fin ? format(new Date(item.fecha_fin), "d MMM", { locale: es }) : "Sin fecha"}\n(Arrastrar para mover, bordes para redimensionar)`}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 hover:bg-black/20 rounded-l-md transition-opacity"
        onMouseDown={(e) => handleMouseDown(e, "resize-start")}
      />

      <div className="flex items-center px-2 gap-1 w-full overflow-hidden">
        <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
        <span className="text-xs font-medium truncate">{item.nombre}</span>
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 hover:bg-black/20 rounded-r-md transition-opacity"
        onMouseDown={(e) => handleMouseDown(e, "resize-end")}
      />
    </div>
  );
}

export default function Gantt() {
  const { data: proyectos = [], isLoading: loadingProyectos } = useProyectos();
  const { data: tareas = [], isLoading: loadingTareas } = useTareas();
  const actualizarProyecto = useActualizarProyecto();
  const actualizarTarea = useActualizarTarea();

  const [tipoVista, setTipoVista] = useState<TipoVista>("gantt");
  const [vistaRango, setVistaRango] = useState<VistaRango>("mes");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("fecha_inicio");
  const [direccion, setDireccion] = useState<Direccion>("asc");
  const [mostrar, setMostrar] = useState<MostrarEntidades>("ambos");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const ganttRef = useRef<HTMLDivElement>(null);

  // Calcular rango de fechas según vista
  const rangoFechas = useMemo(() => {
    if (vistaRango === "semana") {
      return {
        start: startOfWeek(fechaActual, { locale: es }),
        end: endOfWeek(fechaActual, { locale: es }),
      };
    } else if (vistaRango === "mes") {
      return {
        start: startOfMonth(fechaActual),
        end: endOfMonth(fechaActual),
      };
    } else {
      return {
        start: startOfMonth(fechaActual),
        end: endOfMonth(addMonths(fechaActual, 2)),
      };
    }
  }, [fechaActual, vistaRango]);

  const dias = useMemo(() => eachDayOfInterval(rangoFechas), [rangoFechas]);

  // Navegación
  const navegar = (direccionNav: "prev" | "next") => {
    if (vistaRango === "semana") {
      setFechaActual(direccionNav === "prev" ? subWeeks(fechaActual, 1) : addWeeks(fechaActual, 1));
    } else if (vistaRango === "mes") {
      setFechaActual(direccionNav === "prev" ? subMonths(fechaActual, 1) : addMonths(fechaActual, 1));
    } else {
      setFechaActual(direccionNav === "prev" ? subMonths(fechaActual, 3) : addMonths(fechaActual, 3));
    }
  };

  // Handle drag end - update dates
  const handleDragEnd = useCallback(
    async (id: string, tipo: "proyecto" | "tarea", newStart: Date, newEnd: Date) => {
      const startStr = format(newStart, "yyyy-MM-dd");
      const endStr = format(newEnd, "yyyy-MM-dd");

      try {
        if (tipo === "proyecto") {
          await actualizarProyecto.mutateAsync({
            id,
            fecha_inicio: startStr,
            fecha_fin_estimada: endStr,
          });
        } else {
          await actualizarTarea.mutateAsync({
            id,
            fecha_inicio: startStr,
            fecha_vencimiento: endStr,
          });
        }
        toast.success("Fechas actualizadas correctamente");
      } catch (error) {
        toast.error("Error al actualizar las fechas");
      }
    },
    [actualizarProyecto, actualizarTarea]
  );

  // Export functions
  const exportAsImage = async (formatType: "png" | "jpeg") => {
    if (!ganttRef.current) {
      toast.error("No se encontró el contenido para exportar");
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(ganttRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `gantt-${format(new Date(), "yyyy-MM-dd")}.${formatType}`;
      link.href = canvas.toDataURL(`image/${formatType}`, 0.95);
      link.click();

      toast.success(`Diagrama exportado como ${formatType.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error al exportar el diagrama");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!ganttRef.current) {
      toast.error("No se encontró el contenido para exportar");
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(ganttRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Gantt - ${format(new Date(), "yyyy-MM-dd")}</title>
              <style>
                @page { size: landscape; margin: 10mm; }
                body { margin: 0; padding: 20px; }
                img { max-width: 100%; height: auto; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Gantt Chart" />
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      toast.success("Abriendo diálogo de impresión para PDF");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error al exportar el diagrama");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrar y ordenar datos
  const datosFiltrados = useMemo(() => {
    const items: GanttItem[] = [];

    if (mostrar === "proyectos" || mostrar === "ambos") {
      proyectos.forEach((p) => {
        items.push({
          id: p.id,
          tipo: "proyecto",
          nombre: p.nombre,
          fecha_inicio: p.fecha_inicio,
          fecha_fin: p.fecha_fin_estimada,
          prioridad: p.prioridad,
          estado: p.estado,
        });
      });
    }

    if (mostrar === "tareas" || mostrar === "ambos") {
      tareas.forEach((t) => {
        items.push({
          id: t.id,
          tipo: "tarea",
          nombre: t.titulo,
          fecha_inicio: t.fecha_inicio,
          fecha_fin: t.fecha_vencimiento,
          prioridad: t.prioridad,
          estado: t.estado,
          proyectoNombre: t.proyecto?.nombre,
          proyecto_id: t.proyecto_id,
        });
      });
    }

    // Filtrar
    let filtrados = items.filter((item) => {
      if (filtroTexto && !item.nombre.toLowerCase().includes(filtroTexto.toLowerCase())) {
        return false;
      }
      if (filtroPrioridad !== "todas" && item.prioridad !== filtroPrioridad) {
        return false;
      }
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) {
        return false;
      }
      if (filtroProyecto !== "todos") {
        if (item.tipo === "proyecto" && item.id !== filtroProyecto) return false;
        if (item.tipo === "tarea" && item.proyecto_id !== filtroProyecto) return false;
      }
      return true;
    });

    // Ordenar
    filtrados.sort((a, b) => {
      let comparacion = 0;
      switch (ordenarPor) {
        case "nombre":
          comparacion = a.nombre.localeCompare(b.nombre);
          break;
        case "fecha_inicio":
          comparacion = (a.fecha_inicio || "9999").localeCompare(b.fecha_inicio || "9999");
          break;
        case "fecha_fin":
          comparacion = (a.fecha_fin || "9999").localeCompare(b.fecha_fin || "9999");
          break;
        case "prioridad":
          comparacion = (prioridadOrden[a.prioridad as keyof typeof prioridadOrden] ?? 99) -
            (prioridadOrden[b.prioridad as keyof typeof prioridadOrden] ?? 99);
          break;
        case "estado":
          if (a.tipo === "proyecto") {
            comparacion = (estadoOrdenProyecto[a.estado as keyof typeof estadoOrdenProyecto] ?? 99) -
              (estadoOrdenProyecto[b.estado as keyof typeof estadoOrdenProyecto] ?? 99);
          } else {
            comparacion = (estadoOrdenTarea[a.estado as keyof typeof estadoOrdenTarea] ?? 99) -
              (estadoOrdenTarea[b.estado as keyof typeof estadoOrdenTarea] ?? 99);
          }
          break;
      }
      return direccion === "asc" ? comparacion : -comparacion;
    });

    return filtrados;
  }, [proyectos, tareas, mostrar, filtroTexto, filtroPrioridad, filtroEstado, filtroProyecto, ordenarPor, direccion]);

  // Calcular posición de barra en Gantt
  const getBarraPosition = (inicio: string | null, fin: string | null) => {
    if (!inicio) return null;
    
    const inicioDate = new Date(inicio);
    const finDate = fin ? new Date(fin) : addDays(inicioDate, 1);
    const totalDias = dias.length;
    
    const offsetDias = Math.max(0, differenceInDays(inicioDate, rangoFechas.start));
    const duracionDias = Math.max(1, differenceInDays(finDate, inicioDate) + 1);
    
    const leftPercent = (offsetDias / totalDias) * 100;
    const widthPercent = Math.min((duracionDias / totalDias) * 100, 100 - leftPercent);
    
    if (leftPercent >= 100 || widthPercent <= 0) return null;
    
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getColor = (item: GanttItem) => {
    if (item.tipo === "proyecto") {
      return coloresEstadoProyecto[item.estado] || "hsl(var(--muted))";
    }
    return coloresEstadoTarea[item.estado] || "hsl(var(--muted))";
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroPrioridad("todas");
    setFiltroEstado("todos");
    setFiltroProyecto("todos");
  };

  const hayFiltrosActivos = filtroTexto || filtroPrioridad !== "todas" || filtroEstado !== "todos" || filtroProyecto !== "todos";

  const isLoading = loadingProyectos || loadingTareas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gantt y Calendario</h1>
          <p className="text-muted-foreground">
            Visualización de proyectos y tareas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAsImage("png")} className="gap-2">
                <FileImage className="h-4 w-4" />
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAsImage("jpeg")} className="gap-2">
                <FileImage className="h-4 w-4" />
                Exportar como JPEG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsPDF} className="gap-2">
                <FileText className="h-4 w-4" />
                Imprimir / Guardar como PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs value={tipoVista} onValueChange={(v) => setTipoVista(v as TipoVista)}>
            <TabsList>
              <TabsTrigger value="gantt" className="gap-2">
                <GanttChart className="h-4 w-4" />
                Gantt
              </TabsTrigger>
              <TabsTrigger value="calendario" className="gap-2">
                <CalendarViewIcon className="h-4 w-4" />
                Calendario
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Navegación de fechas */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navegar("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[180px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vistaRango === "semana" && format(fechaActual, "'Semana del' d MMM yyyy", { locale: es })}
                    {vistaRango === "mes" && format(fechaActual, "MMMM yyyy", { locale: es })}
                    {vistaRango === "trimestre" && `${format(fechaActual, "MMM", { locale: es })} - ${format(addMonths(fechaActual, 2), "MMM yyyy", { locale: es })}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaActual}
                    onSelect={(date) => date && setFechaActual(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={() => navegar("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setFechaActual(new Date())}>
                Hoy
              </Button>
            </div>

            {/* Vista de rango */}
            <div className="flex items-center gap-2">
              <Select value={vistaRango} onValueChange={(v) => setVistaRango(v as VistaRango)}>
                <SelectTrigger className="w-[130px]">
                  <Eye className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mostrar} onValueChange={(v) => setMostrar(v as MostrarEntidades)}>
                <SelectTrigger className="w-[140px]">
                  <Layers className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambos">Proyectos y Tareas</SelectItem>
                  <SelectItem value="proyectos">Solo Proyectos</SelectItem>
                  <SelectItem value="tareas">Solo Tareas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="flex items-center gap-2">
              <Select value={ordenarPor} onValueChange={(v) => setOrdenarPor(v as OrdenarPor)}>
                <SelectTrigger className="w-[150px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="fecha_inicio">Fecha Inicio</SelectItem>
                  <SelectItem value="fecha_fin">Fecha Fin</SelectItem>
                  <SelectItem value="prioridad">Prioridad</SelectItem>
                  <SelectItem value="estado">Estado</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setDireccion(direccion === "asc" ? "desc" : "asc")}
              >
                {direccion === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>

              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hayFiltrosActivos && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Buscar por nombre..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="planificacion">Planificación</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="revision">En Revisión</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {proyectos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hayFiltrosActivos && (
                <div className="col-span-full flex justify-end">
                  <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="gap-2">
                    <X className="h-4 w-4" />
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">Cargando datos...</div>
          </CardContent>
        </Card>
      ) : tipoVista === "gantt" ? (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="w-full">
              <div className="min-w-[800px]" ref={ganttRef}>
                {/* Encabezado de fechas */}
                <div className="flex border-b pb-2 sticky top-0 bg-background z-10">
                  <div className="w-64 flex-shrink-0 font-semibold text-sm px-2">
                    Elemento ({datosFiltrados.length})
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex">
                      {dias.map((dia, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex-1 text-center text-xs border-l first:border-l-0 py-1",
                            isToday(dia) && "bg-primary/10 font-semibold",
                            !isSameMonth(dia, fechaActual) && vistaRango !== "trimestre" && "text-muted-foreground/50"
                          )}
                        >
                          <div>{format(dia, "d", { locale: es })}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {format(dia, "EEE", { locale: es })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filas */}
                <div className="space-y-1 pt-2">
                  {datosFiltrados.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay elementos para mostrar
                    </div>
                  ) : (
                    datosFiltrados.map((item) => {
                      const position = getBarraPosition(item.fecha_inicio, item.fecha_fin);

                      return (
                        <div
                          key={`${item.tipo}-${item.id}`}
                          className="flex items-center group hover:bg-accent/50 rounded transition-colors"
                        >
                          <div className="w-64 flex-shrink-0 py-2 px-2 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] h-5">
                                {item.tipo === "proyecto" ? (
                                  <Layers className="h-3 w-3 mr-1" />
                                ) : (
                                  <ListTodo className="h-3 w-3 mr-1" />
                                )}
                                {item.tipo === "proyecto" ? "Proyecto" : "Tarea"}
                              </Badge>
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: coloresPrioridad[item.prioridad] }}
                                title={item.prioridad}
                              />
                            </div>
                            <div className="text-sm font-medium truncate" title={item.nombre}>
                              {item.nombre}
                            </div>
                            {item.proyectoNombre && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.proyectoNombre}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 relative h-14 border-l">
                            {/* Líneas de guía */}
                            <div className="absolute inset-0 flex">
                              {dias.map((dia, index) => (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex-1 border-l first:border-l-0",
                                    isToday(dia) && "bg-primary/5"
                                  )}
                                />
                              ))}
                            </div>

                            {/* Barra draggable */}
                            {position ? (
                              <DraggableBar
                                item={item}
                                position={position}
                                color={getColor(item)}
                                rangoStart={rangoFechas.start}
                                totalDias={dias.length}
                                onDragEnd={handleDragEnd}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">Sin fechas</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        /* Vista Calendario */
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {/* Encabezados días */}
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => (
                <div key={dia} className="text-center font-semibold text-sm py-2 text-muted-foreground">
                  {dia}
                </div>
              ))}

              {/* Días del mes */}
              {(() => {
                const inicio = startOfWeek(startOfMonth(fechaActual), { locale: es });
                const fin = endOfWeek(endOfMonth(fechaActual), { locale: es });
                const diasCalendario = eachDayOfInterval({ start: inicio, end: fin });

                return diasCalendario.map((dia, index) => {
                  const itemsDelDia = datosFiltrados.filter((item) => {
                    if (!item.fecha_inicio) return false;
                    const inicioItem = new Date(item.fecha_inicio);
                    const finItem = item.fecha_fin ? new Date(item.fecha_fin) : inicioItem;
                    return dia >= inicioItem && dia <= finItem;
                  });

                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[100px] border rounded-lg p-1",
                        !isSameMonth(dia, fechaActual) && "bg-muted/30",
                        isToday(dia) && "ring-2 ring-primary"
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium mb-1",
                          !isSameMonth(dia, fechaActual) && "text-muted-foreground",
                          isToday(dia) && "text-primary"
                        )}
                      >
                        {format(dia, "d")}
                      </div>
                      <div className="space-y-1">
                        {itemsDelDia.slice(0, 3).map((item) => (
                          <div
                            key={`${item.tipo}-${item.id}`}
                            className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: getColor(item),
                              color: "white",
                            }}
                            title={item.nombre}
                          >
                            {item.tipo === "proyecto" ? "📁" : "✓"} {item.nombre}
                          </div>
                        ))}
                        {itemsDelDia.length > 3 && (
                          <div className="text-[10px] text-muted-foreground text-center">
                            +{itemsDelDia.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leyenda</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Prioridad:</span>
              <div className="flex gap-2">
                {Object.entries(coloresPrioridad).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Estado:</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(coloresEstadoProyecto).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs capitalize">{key.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Arrastra las barras para mover fechas, o usa los bordes para redimensionar la duración.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
