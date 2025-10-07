import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

type CalendarView = "day" | "week" | "month" | "gantt";

interface ReprogramarOTParams {
  otId: string;
  nuevaFechaInicio: Date;
  duracionDias: number;
}

export function useCalendario() {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getVisibleDateRange = useCallback(() => {
    switch (view) {
      case "day":
        return { start: currentDate, end: currentDate };
      case "week":
        return { 
          start: startOfWeek(currentDate, { weekStartsOn: 1 }), 
          end: endOfWeek(currentDate, { weekStartsOn: 1 }) 
        };
      case "month":
        return { 
          start: startOfMonth(currentDate), 
          end: endOfMonth(currentDate) 
        };
      case "gantt":
        return { 
          start: startOfMonth(currentDate), 
          end: addDays(endOfMonth(currentDate), 30) 
        };
    }
  }, [view, currentDate]);

  const getDaysInView = useCallback(() => {
    const range = getVisibleDateRange();
    return eachDayOfInterval({ start: range.start, end: range.end });
  }, [getVisibleDateRange]);

  const reprogramarOT = useMutation({
    mutationFn: async ({ otId, nuevaFechaInicio, duracionDias }: ReprogramarOTParams) => {
      const nuevaFechaFin = addDays(nuevaFechaInicio, duracionDias);

      // Verificar solapamiento con asignaciones existentes
      const { data: asignaciones } = await supabase
        .from("asignaciones_ot")
        .select("personal_id")
        .eq("ot_id", otId);

      if (asignaciones && asignaciones.length > 0) {
        const personalIds = asignaciones.map(a => a.personal_id);
        
        // Buscar solapamientos
        const { data: solapamientos } = await supabase
          .from("asignaciones_ot")
          .select(`
            id,
            ordenes_servicio!inner(
              numero,
              fecha_programada_inicio,
              fecha_programada_fin
            )
          `)
          .in("personal_id", personalIds)
          .neq("ot_id", otId)
          .not("ordenes_servicio.fecha_programada_inicio", "is", null)
          .not("ordenes_servicio.fecha_programada_fin", "is", null);

        if (solapamientos && solapamientos.length > 0) {
          // Verificar si hay conflictos reales
          const conflictos = solapamientos.filter((s: any) => {
            const inicio = new Date(s.ordenes_servicio.fecha_programada_inicio);
            const fin = new Date(s.ordenes_servicio.fecha_programada_fin);
            return (
              (nuevaFechaInicio >= inicio && nuevaFechaInicio <= fin) ||
              (nuevaFechaFin >= inicio && nuevaFechaFin <= fin) ||
              (nuevaFechaInicio <= inicio && nuevaFechaFin >= fin)
            );
          });

          if (conflictos.length > 0) {
            throw new Error(`Conflicto: El personal está asignado a otras OT en estas fechas`);
          }
        }
      }

      // Actualizar la OT
      const { data, error } = await supabase
        .from("ordenes_servicio")
        .update({
          fecha_programada_inicio: nuevaFechaInicio.toISOString(),
          fecha_programada_fin: nuevaFechaFin.toISOString(),
        })
        .eq("id", otId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_servicio"] });
      toast({
        title: "OT reprogramada",
        description: "Las fechas se actualizaron correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al reprogramar",
        description: error.message,
      });
    },
  });

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    getVisibleDateRange,
    getDaysInView,
    reprogramarOT,
  };
}
