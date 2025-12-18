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
import { useCrearTrabajo } from "@/hooks/useTrabajos";

const formSchema = z.object({
  nombre_trabajo: z.string().min(1, "El nombre es requerido").max(200),
  tipo_trabajo: z.enum(["simple", "complejo", "mantencion"]),
  descripcion: z.string().max(2000).optional(),
  fecha_inicio_estimada: z.string().optional(),
  fecha_fin_estimada: z.string().optional(),
  estado: z.enum(["pendiente", "en_ejecucion", "finalizado", "cancelado"]),
});

interface TrabajoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
}

export function TrabajoForm({ open, onOpenChange, clienteId }: TrabajoFormProps) {
  const crearTrabajo = useCrearTrabajo();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_trabajo: "",
      tipo_trabajo: "simple",
      descripcion: "",
      fecha_inicio_estimada: "",
      fecha_fin_estimada: "",
      estado: "pendiente",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await crearTrabajo.mutateAsync({
      cliente_id: clienteId,
      nombre_trabajo: values.nombre_trabajo,
      tipo_trabajo: values.tipo_trabajo,
      descripcion: values.descripcion || undefined,
      fecha_inicio_estimada: values.fecha_inicio_estimada || undefined,
      fecha_fin_estimada: values.fecha_fin_estimada || undefined,
      estado: values.estado,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Trabajo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_trabajo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Trabajo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Instalación de equipos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_trabajo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="complejo">Complejo</SelectItem>
                        <SelectItem value="mantencion">Mantención</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="en_ejecucion">En Ejecución</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción del trabajo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_inicio_estimada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio Estimada</FormLabel>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearTrabajo.isPending}>
                {crearTrabajo.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
