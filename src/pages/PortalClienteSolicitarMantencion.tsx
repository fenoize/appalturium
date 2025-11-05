import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useClienteData } from "@/hooks/useClienteData";
import { useSolicitarMantencion } from "@/hooks/useClienteActions";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  ubicacion_id: z.string().min(1, "Seleccione una ubicación"),
  tipo_trabajo: z.string().min(1, "Seleccione el tipo de trabajo"),
  descripcion: z.string().min(10, "Describa su solicitud (mínimo 10 caracteres)"),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]).optional(),
  fecha_programada_inicio: z.string().optional(),
});

export default function PortalClienteSolicitarMantencion() {
  const navigate = useNavigate();
  const { data: cliente, isLoading: loadingCliente } = useClienteData();
  const { data: tiposTrabajoData } = useParametrosSistema("work_types");
  const solicitarMantencion = useSolicitarMantencion();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prioridad: "media",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!cliente) return;

    await solicitarMantencion.mutateAsync({
      cliente_id: cliente.id,
      ubicacion_id: values.ubicacion_id,
      tipo_trabajo: values.tipo_trabajo,
      descripcion: values.descripcion,
      prioridad: values.prioridad,
      fecha_programada_inicio: values.fecha_programada_inicio,
    });

    navigate("/portal-cliente/ordenes");
  };

  if (loadingCliente) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/portal-cliente")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Solicitar Mantención</h1>
        <p className="text-muted-foreground mt-2">
          Complete el formulario para solicitar un servicio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Solicitud</CardTitle>
          <CardDescription>
            Proporcione la información necesaria para procesar su solicitud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="ubicacion_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación del Servicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una ubicación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cliente?.ubicaciones?.map((ubicacion) => (
                          <SelectItem key={ubicacion.id} value={ubicacion.id}>
                            {ubicacion.alias} - {ubicacion.direccion}
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
                name="tipo_trabajo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Trabajo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el tipo de trabajo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposTrabajoData?.map((tipo) => (
                          <SelectItem key={tipo.key} value={tipo.key}>
                            {tipo.label}
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
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del Problema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa detalladamente el problema o servicio que requiere..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Sea lo más específico posible para un mejor servicio
                    </FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="fecha_programada_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Preferida (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Si tiene una preferencia de fecha y hora
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={solicitarMantencion.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Solicitud
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/portal-cliente")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
