import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tarea, TareaInput } from "@/hooks/useTareas";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { AlertTriangle, DollarSign } from "lucide-react";

const formSchema = z.object({
  proyecto_id: z.string().min(1, "El proyecto es requerido"),
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["pendiente", "en_progreso", "revision", "completada", "cancelada"]),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]),
  task_type_id: z.string().optional(),
  asignado_a: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_vencimiento: z.string().optional(),
  horas_estimadas: z.coerce.number().min(0).optional(),
}).refine((data) => {
  // If estado is 'completada', task_type_id must be set
  if (data.estado === 'completada' && !data.task_type_id) {
    return false;
  }
  return true;
}, {
  message: "Para marcar como completada, debe seleccionar un Tipo de Tarea para el cálculo del costo",
  path: ["task_type_id"],
});

interface TareaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TareaInput) => void;
  tarea?: Tarea | null;
  proyectoId?: string;
  isLoading?: boolean;
}

export function TareaForm({ open, onOpenChange, onSubmit, tarea, proyectoId, isLoading }: TareaFormProps) {
  const { data: taskTypes } = useTaskTypes();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proyecto_id: tarea?.proyecto_id || proyectoId || "",
      titulo: tarea?.titulo || "",
      descripcion: tarea?.descripcion || "",
      estado: tarea?.estado || "pendiente",
      prioridad: tarea?.prioridad || "media",
      task_type_id: tarea?.task_type_id || "",
      asignado_a: tarea?.asignado_a || "",
      fecha_inicio: tarea?.fecha_inicio || "",
      fecha_vencimiento: tarea?.fecha_vencimiento || "",
      horas_estimadas: tarea?.horas_estimadas || 0,
    },
  });

  const watchEstado = form.watch("estado");
  const watchTaskTypeId = form.watch("task_type_id");
  const selectedTaskType = taskTypes?.find(t => t.id === watchTaskTypeId);
  const showCostWarning = watchEstado === "completada" && !watchTaskTypeId;

  const { data: proyectos } = useQuery({
    queryKey: ["proyectos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre")
        .neq("estado", "completado")
        .neq("estado", "cancelado")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const { data: personal } = useQuery({
    queryKey: ["personal-select"],
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

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      proyecto_id: values.proyecto_id,
      titulo: values.titulo,
      descripcion: values.descripcion || undefined,
      estado: values.estado,
      prioridad: values.prioridad,
      task_type_id: values.task_type_id || undefined,
      asignado_a: values.asignado_a || undefined,
      fecha_inicio: values.fecha_inicio || undefined,
      fecha_vencimiento: values.fecha_vencimiento || undefined,
      horas_estimadas: values.horas_estimadas,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tarea ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="proyecto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!proyectoId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {proyectos?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Diseñar mockups de UI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la tarea..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Type - for costing */}
            <FormField
              control={form.control}
              name="task_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Tipo de Tarea (Costeo)
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de tarea" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskTypes?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre} (${t.costo_estandar.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTaskType && (
                    <FormDescription>
                      Costo estándar: ${selectedTaskType.costo_estandar.toLocaleString()}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCostWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Para completar una tarea, debe seleccionar un Tipo de Tarea para registrar el costo automáticamente.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="revision">En Revisión</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="asignado_a"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignado a</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personal?.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_vencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="horas_estimadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horas Estimadas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show applied cost if task is completed */}
            {tarea?.costo_aplicado && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Costo aplicado: ${tarea.costo_aplicado.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : tarea ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
