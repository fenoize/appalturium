import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const REGIONES_CHILE = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes y la Antártica Chilena",
];

const ubicacionSchema = z.object({
  alias: z.string().min(1, "El alias es requerido").max(100),
  direccion: z.string().min(1, "La dirección es requerida").max(255),
  comuna: z.string().min(1, "La comuna es requerida").max(100),
  ciudad: z.string().min(1, "La ciudad es requerida").max(100),
  region: z.string().min(1, "La región es requerida"),
  referencia: z.string().max(100).optional(),
  tipo: z.enum(["sucursal", "domicilio"]),
  es_principal: z.boolean().default(false),
  // Contacto asociado
  contacto_nombre: z.string().max(100).optional(),
  contacto_email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  contacto_telefono: z.string().max(20).optional(),
  contacto_cargo: z.string().max(100).optional(),
  contacto_notas: z.string().max(500).optional(),
});

type UbicacionFormData = z.infer<typeof ubicacionSchema>;

interface AgregarUbicacionDialogProps {
  clienteId: string;
  onSuccess: () => void;
}

export function AgregarUbicacionDialog({ clienteId, onSuccess }: AgregarUbicacionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UbicacionFormData>({
    resolver: zodResolver(ubicacionSchema),
    defaultValues: {
      alias: "",
      direccion: "",
      comuna: "",
      ciudad: "",
      region: "",
      referencia: "",
      tipo: "sucursal",
      es_principal: false,
      contacto_nombre: "",
      contacto_email: "",
      contacto_telefono: "",
      contacto_cargo: "",
      contacto_notas: "",
    },
  });

  const onSubmit = async (data: UbicacionFormData) => {
    setLoading(true);
    try {
      // 1. Crear la ubicación
      const { data: ubicacion, error: ubicacionError } = await supabase
        .from("ubicaciones")
        .insert({
          cliente_id: clienteId,
          alias: data.alias,
          direccion: data.direccion,
          comuna: data.comuna,
          ciudad: data.ciudad,
          region: data.region,
          referencia: data.referencia || null,
          tipo: data.tipo,
          es_principal: data.es_principal,
          por_defecto: data.es_principal,
          activo: true,
        })
        .select("id")
        .single();

      if (ubicacionError) throw ubicacionError;

      // 2. Si hay datos de contacto, crear el contacto asociado
      if (data.contacto_nombre && data.contacto_nombre.trim()) {
        const { error: contactoError } = await supabase.from("contactos").insert({
          cliente_id: clienteId,
          ubicacion_id: ubicacion.id,
          nombre: data.contacto_nombre,
          email: data.contacto_email || null,
          telefono: data.contacto_telefono || null,
          rol_contextual: data.contacto_cargo || null,
          notas: data.contacto_notas || null,
          recibe_notificaciones: true,
        });

        if (contactoError) {
          console.error("Error creating contact:", contactoError);
          // No lanzamos error, la ubicación ya fue creada
          toast({
            variant: "default",
            title: "Ubicación creada",
            description: "La ubicación se creó pero hubo un problema con el contacto.",
          });
        }
      }

      toast({
        title: "Ubicación agregada",
        description: "La ubicación se ha registrado correctamente.",
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al agregar ubicación",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ubicación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nueva Ubicación
          </DialogTitle>
          <DialogDescription>
            Agrega una nueva ubicación para este cliente con su contacto asociado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Datos de ubicación */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Datos de la Ubicación
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="alias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre / Alias *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Oficina Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sucursal">Sucursal</SelectItem>
                          <SelectItem value="domicilio">Domicilio</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Av. Principal 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Of/Depto (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Oficina 501" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comuna"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comuna *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Providencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Santiago" {...field} />
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
                      <FormLabel>Región *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar región" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGIONES_CHILE.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="es_principal"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ubicación Principal</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Marcar como ubicación principal del cliente
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Datos del contacto */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Contacto de la Ubicación (Opcional)
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contacto_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Encargado de Operaciones" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contacto_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contacto@empresa.cl" {...field} />
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
              </div>

              <FormField
                control={form.control}
                name="contacto_notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Adicional</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Información adicional sobre el contacto..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Ubicación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
