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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Proyecto, ProyectoInput } from "@/hooks/useProyectos";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  cliente_id: z.string().optional(),
  estado: z.enum(["planificacion", "en_progreso", "pausado", "completado", "cancelado"]),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]),
  fecha_inicio: z.string().optional(),
  fecha_fin_estimada: z.string().optional(),
  presupuesto: z.coerce.number().min(0).optional(),
  responsable_id: z.string().optional(),
  notas: z.string().optional(),
});

interface ProyectoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProyectoInput) => void;
  proyecto?: Proyecto | null;
  isLoading?: boolean;
}

export function ProyectoForm({ open, onOpenChange, onSubmit, proyecto, isLoading }: ProyectoFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: proyecto?.nombre || "",
      descripcion: proyecto?.descripcion || "",
      cliente_id: proyecto?.cliente_id || "",
      estado: proyecto?.estado || "planificacion",
      prioridad: proyecto?.prioridad || "media",
      fecha_inicio: proyecto?.fecha_inicio || "",
      fecha_fin_estimada: proyecto?.fecha_fin_estimada || "",
      presupuesto: proyecto?.presupuesto || 0,
      responsable_id: proyecto?.responsable_id || "",
      notas: proyecto?.notas || "",
    },
  });

  const { data: clientes } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, razon_social, nombres, apellidos")
        .order("razon_social");
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
      nombre: values.nombre,
      descripcion: values.descripcion,
      cliente_id: values.cliente_id || undefined,
      estado: values.estado,
      prioridad: values.prioridad,
      fecha_inicio: values.fecha_inicio,
      fecha_fin_estimada: values.fecha_fin_estimada,
      presupuesto: values.presupuesto,
      responsable_id: values.responsable_id || undefined,
      notas: values.notas,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proyecto ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proyecto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Implementación Sistema ERP" {...field} />
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
                      placeholder="Descripción detallada del proyecto..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.razon_social || `${cliente.nombres} ${cliente.apellidos}`}
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
                name="responsable_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar responsable" />
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
            </div>

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
                        <SelectItem value="planificacion">Planificación</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
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
                name="fecha_fin_estimada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin Estimada</FormLabel>
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
              name="presupuesto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : proyecto ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
