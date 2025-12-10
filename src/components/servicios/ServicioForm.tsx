import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Servicio, ServicioInput } from "@/hooks/useServicios";
import { useEffect } from "react";

const servicioSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  tipo: z.enum(["mantencion", "consultoria", "soporte", "desarrollo", "instalacion", "capacitacion", "otro"]),
  proveedor_id: z.string().optional().nullable(),
  proyecto_id: z.string().optional().nullable(),
  estado: z.enum(["activo", "pausado", "cancelado", "finalizado"]).default("activo"),
  numero_contrato: z.string().optional().nullable(),
  fecha_inicio_contrato: z.string().optional().nullable(),
  fecha_fin_contrato: z.string().optional().nullable(),
  renovacion_automatica: z.boolean().default(false),
  frecuencia_facturacion: z.enum(["unico", "mensual", "trimestral", "semestral", "anual"]).default("mensual"),
  monto_base: z.coerce.number().min(0).default(0),
  moneda: z.enum(["CLP", "UF", "USD"]).default("CLP"),
  sla_tiempo_respuesta_horas: z.coerce.number().optional().nullable(),
  sla_tiempo_resolucion_horas: z.coerce.number().optional().nullable(),
  contacto_nombre: z.string().optional().nullable(),
  contacto_email: z.string().email().optional().nullable().or(z.literal("")),
  contacto_telefono: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

type ServicioFormData = z.infer<typeof servicioSchema>;

interface ServicioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServicioInput) => void;
  servicio?: Servicio | null;
  isLoading?: boolean;
}

export function ServicioForm({ open, onOpenChange, onSubmit, servicio, isLoading }: ServicioFormProps) {
  const form = useForm<ServicioFormData>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      tipo: "otro",
      proveedor_id: null,
      proyecto_id: null,
      estado: "activo",
      numero_contrato: "",
      fecha_inicio_contrato: "",
      fecha_fin_contrato: "",
      renovacion_automatica: false,
      frecuencia_facturacion: "mensual",
      monto_base: 0,
      moneda: "CLP",
      sla_tiempo_respuesta_horas: null,
      sla_tiempo_resolucion_horas: null,
      contacto_nombre: "",
      contacto_email: "",
      contacto_telefono: "",
      notas: "",
    },
  });

  useEffect(() => {
    if (servicio) {
      form.reset({
        codigo: servicio.codigo,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || "",
        tipo: servicio.tipo,
        proveedor_id: servicio.proveedor_id,
        proyecto_id: servicio.proyecto_id,
        estado: servicio.estado,
        numero_contrato: servicio.numero_contrato || "",
        fecha_inicio_contrato: servicio.fecha_inicio_contrato || "",
        fecha_fin_contrato: servicio.fecha_fin_contrato || "",
        renovacion_automatica: servicio.renovacion_automatica,
        frecuencia_facturacion: servicio.frecuencia_facturacion,
        monto_base: servicio.monto_base,
        moneda: servicio.moneda,
        sla_tiempo_respuesta_horas: servicio.sla_tiempo_respuesta_horas,
        sla_tiempo_resolucion_horas: servicio.sla_tiempo_resolucion_horas,
        contacto_nombre: servicio.contacto_nombre || "",
        contacto_email: servicio.contacto_email || "",
        contacto_telefono: servicio.contacto_telefono || "",
        notas: servicio.notas || "",
      });
    } else {
      form.reset();
    }
  }, [servicio, form]);

  const { data: proveedores } = useQuery({
    queryKey: ["proveedores-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("id, razon_social, nombre_fantasia")
        .eq("activo", true)
        .order("razon_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: proyectos } = useQuery({
    queryKey: ["proyectos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = (values: ServicioFormData) => {
    const input: ServicioInput = {
      codigo: values.codigo,
      nombre: values.nombre,
      tipo: values.tipo,
      descripcion: values.descripcion || null,
      proveedor_id: values.proveedor_id || null,
      proyecto_id: values.proyecto_id || null,
      estado: values.estado,
      numero_contrato: values.numero_contrato || null,
      fecha_inicio_contrato: values.fecha_inicio_contrato || null,
      fecha_fin_contrato: values.fecha_fin_contrato || null,
      renovacion_automatica: values.renovacion_automatica,
      frecuencia_facturacion: values.frecuencia_facturacion,
      monto_base: values.monto_base,
      moneda: values.moneda,
      sla_tiempo_respuesta_horas: values.sla_tiempo_respuesta_horas,
      sla_tiempo_resolucion_horas: values.sla_tiempo_resolucion_horas,
      contacto_nombre: values.contacto_nombre || null,
      contacto_email: values.contacto_email || null,
      contacto_telefono: values.contacto_telefono || null,
      notas: values.notas || null,
    };
    onSubmit(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{servicio ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="SRV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del servicio" {...field} />
                    </FormControl>
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
                    <Textarea placeholder="Descripción del servicio" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mantencion">Mantención</SelectItem>
                        <SelectItem value="consultoria">Consultoría</SelectItem>
                        <SelectItem value="soporte">Soporte</SelectItem>
                        <SelectItem value="desarrollo">Desarrollo</SelectItem>
                        <SelectItem value="instalacion">Instalación</SelectItem>
                        <SelectItem value="capacitacion">Capacitación</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
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
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
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
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "__none__" ? null : val)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin proveedor</SelectItem>
                        {proveedores?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre_fantasia || p.razon_social}
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
                name="proyecto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proyecto</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "__none__" ? null : val)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proyecto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin proyecto</SelectItem>
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
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contrato</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numero_contrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Contrato</FormLabel>
                      <FormControl>
                        <Input placeholder="CTR-001" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_inicio_contrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_fin_contrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="renovacion_automatica"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 mt-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Renovación automática</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Facturación</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="monto_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Base</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="moneda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLP">CLP</SelectItem>
                          <SelectItem value="UF">UF</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frecuencia_facturacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unico">Único</SelectItem>
                          <SelectItem value="mensual">Mensual</SelectItem>
                          <SelectItem value="trimestral">Trimestral</SelectItem>
                          <SelectItem value="semestral">Semestral</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">SLA</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sla_tiempo_respuesta_horas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo Respuesta (horas)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sla_tiempo_resolucion_horas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo Resolución (horas)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contacto</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contacto_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contacto_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contacto_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
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
                {servicio ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
