import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectTemplate {
  id: string;
  nombre: string;
  tipo: string | null;
  descripcion: string | null;
  activo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateFase {
  id: string;
  template_id: string;
  nombre: string;
  orden: number;
  duracion_dias: number | null;
  created_at: string;
  tareas?: TemplateTarea[];
}

export interface TemplateTarea {
  id: string;
  template_fase_id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  duracion_dias: number | null;
  orden: number;
  created_at: string;
}

export interface TemplateWithFases extends ProjectTemplate {
  fases: TemplateFase[];
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: ["project_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      return data as ProjectTemplate[];
    },
  });
}

export function useTemplateWithFases(templateId: string | null) {
  return useQuery({
    queryKey: ["project_template", templateId],
    queryFn: async () => {
      if (!templateId) return null;

      // Get template
      const { data: template, error: templateError } = await supabase
        .from("project_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      // Get fases with tareas
      const { data: fases, error: fasesError } = await supabase
        .from("template_fases")
        .select(`
          *,
          tareas:template_tareas(*)
        `)
        .eq("template_id", templateId)
        .order("orden");

      if (fasesError) throw fasesError;

      return {
        ...template,
        fases: fases || [],
      } as TemplateWithFases;
    },
    enabled: !!templateId,
  });
}

export function useCloneTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      templateId, 
      proyectoId, 
      fechaInicio 
    }: { 
      templateId: string; 
      proyectoId: string; 
      fechaInicio?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      // Get template fases with tareas
      const { data: templateFases, error: fasesError } = await supabase
        .from("template_fases")
        .select(`
          *,
          tareas:template_tareas(*)
        `)
        .eq("template_id", templateId)
        .order("orden");

      if (fasesError) throw fasesError;
      if (!templateFases || templateFases.length === 0) return;

      let currentStartDate = fechaInicio ? new Date(fechaInicio) : new Date();

      // Create fases and their tareas
      for (const templateFase of templateFases) {
        const faseStartDate = new Date(currentStartDate);
        let faseEndDate: Date | null = null;

        if (templateFase.duracion_dias) {
          faseEndDate = new Date(currentStartDate);
          faseEndDate.setDate(faseEndDate.getDate() + templateFase.duracion_dias);
          currentStartDate = new Date(faseEndDate);
        }

        // Create fase
        const { data: newFase, error: faseError } = await supabase
          .from("fases_proyecto")
          .insert({
            proyecto_id: proyectoId,
            nombre: templateFase.nombre,
            orden: templateFase.orden,
            fecha_inicio: faseStartDate.toISOString().split('T')[0],
            fecha_fin_estimada: faseEndDate ? faseEndDate.toISOString().split('T')[0] : null,
            estado: 'pendiente',
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (faseError) throw faseError;

        // Create tareas for this fase
        const tareas = (templateFase as any).tareas || [];
        if (tareas.length > 0) {
          const tareasToInsert = tareas.map((tarea: TemplateTarea) => ({
            proyecto_id: proyectoId,
            fase_id: newFase.id,
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            prioridad: tarea.prioridad,
            estado: 'pendiente',
            orden: tarea.orden,
            created_by: userData.user.id,
          }));

          const { error: tareasError } = await supabase
            .from("tareas")
            .insert(tareasToInsert);

          if (tareasError) throw tareasError;
        }
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fases_proyecto", variables.proyectoId] });
      queryClient.invalidateQueries({ queryKey: ["tareas", variables.proyectoId] });
      queryClient.invalidateQueries({ queryKey: ["proyecto", variables.proyectoId] });
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      toast({ title: "Template aplicado exitosamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al aplicar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
