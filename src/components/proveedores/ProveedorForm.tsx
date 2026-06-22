import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useCreateProveedor, useUpdateProveedor, type Proveedor } from "@/hooks/useProveedores";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  rut: z.string().min(1, "El RUT es requerido"),
  razon_social: z.string().min(1, "La razón social es requerida"),
  nombre_fantasia: z.string().optional(),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  region: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  sitio_web: z.string().optional(),
  contacto_nombre: z.string().optional(),
  contacto_telefono: z.string().optional(),
  contacto_email: z.string().email("Email inválido").optional().or(z.literal("")),
  condiciones_pago: z.enum(["contado", "15d", "30d", "45d", "60d", "otro"]).optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProveedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor;
}

export function ProveedorForm({ open, onOpenChange, proveedor }: ProveedorFormProps) {
  const createProveedor = useCreateProveedor();
  const updateProveedor = useUpdateProveedor();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rut: proveedor?.rut || "",
      razon_social: proveedor?.razon_social || "",
      nombre_fantasia: proveedor?.nombre_fantasia || "",
      giro: proveedor?.giro || "",
      direccion: proveedor?.direccion || "",
      ciudad: proveedor?.ciudad || "",
      region: proveedor?.region || "",
      telefono: proveedor?.telefono || "",
      email: proveedor?.email || "",
      sitio_web: proveedor?.sitio_web || "",
      contacto_nombre: proveedor?.contacto_nombre || "",
      contacto_telefono: proveedor?.contacto_telefono || "",
      contacto_email: proveedor?.contacto_email || "",
      condiciones_pago: proveedor?.condiciones_pago || "contado",
      notas: proveedor?.notas || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const data = {
      rut: values.rut,
      razon_social: values.razon_social,
      nombre_fantasia: values.nombre_fantasia || null,
      giro: values.giro || null,
      direccion: values.direccion || null,
      ciudad: values.ciudad || null,
      region: values.region || null,
      telefono: values.telefono || null,
      email: values.email || null,
      sitio_web: values.sitio_web || null,
      contacto_nombre: values.contacto_nombre || null,
      contacto_telefono: values.contacto_telefono || null,
      contacto_email: values.contacto_email || null,
      condiciones_pago: values.condiciones_pago || "contado",
      notas: values.notas || null,
      activo: true,
    };

    if (proveedor) {
      await updateProveedor.mutateAsync({ id: proveedor.id, ...data });
    } else {
      await createProveedor.mutateAsync(data);
    }
    onOpenChange(false);
    form.reset();
  };

  const isLoading = createProveedor.isPending || updateProveedor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT *</FormLabel>
                    <FormControl>
                      <Input placeholder="12.345.678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condiciones_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condiciones de Pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contado">Contado</SelectItem>
                        <SelectItem value="15d">15 días</SelectItem>
                        <SelectItem value="30d">30 días</SelectItem>
                        <SelectItem value="45d">45 días</SelectItem>
                        <SelectItem value="60d">60 días</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="razon_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre legal de la empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Fantasía</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre comercial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="giro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giro</FormLabel>
                    <FormControl>
                      <Input placeholder="Actividad comercial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Región</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una región" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGIONES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
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
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+56 9 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contacto@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sitio_web"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio Web</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Contacto Principal</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contacto_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre contacto" {...field} />
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
                        <Input placeholder="+56 9 1234 5678" {...field} />
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
                        <Input type="email" placeholder="contacto@empresa.com" {...field} />
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
                    <Textarea placeholder="Notas adicionales sobre el proveedor..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {proveedor ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
