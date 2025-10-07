import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { OrdenServicio } from "@/hooks/useOrdenesServicio";
import { OTCard } from "./OTCard";
import { cn } from "@/lib/utils";

interface CalendarioSemanalProps {
  ordenes: OrdenServicio[];
  dias: Date[];
  onReprogramar: (otId: string, nuevaFecha: Date, duracion: number) => void;
}

export function CalendarioSemanal({ ordenes, dias, onReprogramar }: CalendarioSemanalProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const getOrdenesDelDia = (fecha: Date) => {
    return ordenes.filter(ot => {
      if (!ot.fecha_programada_inicio) return false;
      return isSameDay(new Date(ot.fecha_programada_inicio), fecha);
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const otId = active.id as string;
      const targetDate = over.id as string;
      const orden = ordenes.find(o => o.id === otId);
      
      if (orden?.fecha_programada_inicio && orden?.fecha_programada_fin) {
        const duracion = Math.ceil(
          (new Date(orden.fecha_programada_fin).getTime() - 
           new Date(orden.fecha_programada_inicio).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        onReprogramar(otId, new Date(targetDate), duracion);
      }
    }
    
    setActiveId(null);
  };

  const activeOrden = activeId ? ordenes.find(o => o.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-7 gap-2 h-full">
        {dias.map((dia) => {
          const ordenesDelDia = getOrdenesDelDia(dia);
          const esHoy = isSameDay(dia, new Date());

          return (
            <SortableContext
              key={dia.toISOString()}
              id={dia.toISOString()}
              items={ordenesDelDia.map(o => o.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className={cn(
                  "border rounded-lg p-2 bg-card min-h-[300px]",
                  esHoy && "ring-2 ring-primary"
                )}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(dia, "EEEE", { locale: es })}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold",
                      esHoy && "text-primary"
                    )}
                  >
                    {format(dia, "d", { locale: es })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(dia, "MMM", { locale: es })}
                  </div>
                </div>
                <div className="space-y-2">
                  {ordenesDelDia.map((orden) => (
                    <OTCard key={orden.id} orden={orden} />
                  ))}
                </div>
              </div>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeOrden ? <OTCard orden={activeOrden} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
