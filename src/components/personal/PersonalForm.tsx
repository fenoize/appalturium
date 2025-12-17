import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import type { PersonalConUsuario } from "@/hooks/usePersonal";
import { useUsuarios } from "@/hooks/useUsuarios";
import { usePersonal } from "@/hooks/usePersonal";
import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const personalSchema = z.object({
  user_id: z.string().min(1, "Debe seleccionar un usuario"),
  nombre_completo: z.string().min(1, "El nombre completo es requerido"),
  rut: z.string().min(1, "El RUT es requerido"),
  domicilio: z.string().optional(),
  estado_civil: z
    .enum(["soltero", "casado", "viudo", "divorciado", "union_libre"])
    .optional(),
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
  contacto_emergencia_relacion: z.string().optional(),
  escolaridad: z.string().optional(),
  sexo: z.enum(["masculino", "femenino", "otro"]).optional(),
  comentarios: z.string().optional(),
  fecha_ingreso: z.string(),
  fecha_termino: z.string().optional(),
  rol_operativo: z.enum([
    "tecnico",
    "operario",
    "despachador",
    "supervisor",
    "administrador",
    "otro",
  ]),
});

type PersonalFormValues = z.infer<typeof personalSchema>;

interface PersonalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  personal?: PersonalConUsuario | null;
}

export function PersonalForm({
  open,
  onClose,
  onSubmit,
  personal,
}: PersonalFormProps) {
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  const { data: usuarios, isLoading: loadingUsuarios } = useUsuarios();
  const { data: personalExistente } = usePersonal();

  // Filtrar usuarios que NO tienen ficha de personal (para nuevos)
  const usuariosDisponibles = usuarios?.filter(
    (u) => !personalExistente?.some((p) => p.user_id === u.id)
  );

  const contactoEmergencia =
    typeof personal?.contacto_emergencia === "object" &&
    personal?.contacto_emergencia !== null
      ? (personal.contacto_emergencia as any)
      : { nombre: "", telefono: "", relacion: "" };

  const form = useForm<PersonalFormValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      user_id: personal?.user_id || "",
      nombre_completo: personal?.nombre_completo || "",
      rut: personal?.rut || "",
      domicilio: personal?.domicilio || "",
      estado_civil: personal?.estado_civil || undefined,
      contacto_emergencia_nombre: contactoEmergencia.nombre || "",
      contacto_emergencia_telefono: contactoEmergencia.telefono || "",
      contacto_emergencia_relacion: contactoEmergencia.relacion || "",
      escolaridad: personal?.escolaridad || "",
      sexo: personal?.sexo || undefined,
      comentarios: personal?.comentarios || "",
      fecha_ingreso: personal?.fecha_ingreso || new Date().toISOString().split("T")[0],
      fecha_termino: personal?.fecha_termino || "",
      rol_operativo: personal?.rol_operativo || "tecnico",
    },
  });

  // Reset form when dialog opens/closes or personal changes
  useEffect(() => {
    if (open) {
      setEspecialidades(personal?.especialidad || []);
      setEtiquetas(personal?.etiquetas || []);
      form.reset({
        user_id: personal?.user_id || "",
        nombre_completo: personal?.nombre_completo || "",
        rut: personal?.rut || "",
        domicilio: personal?.domicilio || "",
        estado_civil: personal?.estado_civil || undefined,
        contacto_emergencia_nombre: contactoEmergencia.nombre || "",
        contacto_emergencia_telefono: contactoEmergencia.telefono || "",
        contacto_emergencia_relacion: contactoEmergencia.relacion || "",
        escolaridad: personal?.escolaridad || "",
        sexo: personal?.sexo || undefined,
        comentarios: personal?.comentarios || "",
        fecha_ingreso: personal?.fecha_ingreso || new Date().toISOString().split("T")[0],
        fecha_termino: personal?.fecha_termino || "",
        rol_operativo: personal?.rol_operativo || "tecnico",
      });
    }
  }, [open, personal]);
  const handleSubmit = (values: PersonalFormValues) => {
    const {
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      contacto_emergencia_relacion,
      ...rest
    } = values;

    const data = {
      ...rest,
      especialidad: especialidades,
      etiquetas: etiquetas,
      contacto_emergencia: {
        nombre: contacto_emergencia_nombre,
        telefono: contacto_emergencia_telefono,
        relacion: contacto_emergencia_relacion,
      },
      fecha_termino: values.fecha_termino || null,
    };

    onSubmit(data);
    onClose();
  };

  const agregarEspecialidad = () => {
    if (nuevaEspecialidad && !especialidades.includes(nuevaEspecialidad)) {
      setEspecialidades([...especialidades, nuevaEspecialidad]);
      setNuevaEspecialidad("");
    }
  };

  const quitarEspecialidad = (esp: string) => {
    setEspecialidades(especialidades.filter((e) => e !== esp));
  };

  const agregarEtiqueta = () => {
    if (nuevaEtiqueta && !etiquetas.includes(nuevaEtiqueta)) {
      setEtiquetas([...etiquetas, nuevaEtiqueta]);
      setNuevaEtiqueta("");
    }
  };

  const quitarEtiqueta = (tag: string) => {
    setEtiquetas(etiquetas.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {personal ? "Editar Personal" : "Nueva Ficha de Personal"}
          </DialogTitle>
          <DialogDescription>
            Complete la información del personal
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Usuario vinculado (solo para nuevo personal) */}
            {!personal && (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario del Sistema *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUsuarios ? "Cargando..." : "Seleccionar usuario"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usuariosDisponibles?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.email}
                          </SelectItem>
                        ))}
                        {usuariosDisponibles?.length === 0 && (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            No hay usuarios disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Solo usuarios sin ficha de personal asignada
                    </p>
                  </FormItem>
                )}
              />
            )}

            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="font-semibold">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_completo"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12.345.678-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sexo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_civil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="union_libre">
                            Unión Libre
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domicilio"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Domicilio</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información Laboral */}
            <div className="space-y-4">
              <h3 className="font-semibold">Información Laboral</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rol_operativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol Operativo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="operario">Operario</SelectItem>
                          <SelectItem value="despachador">Despachador</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="administrador">
                            Administrador
                          </SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="escolaridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolaridad</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_ingreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Ingreso *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_termino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Término</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Especialidades */}
                <div className="col-span-2 space-y-2">
                  <FormLabel>Especialidades</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={nuevaEspecialidad}
                      onChange={(e) => setNuevaEspecialidad(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          agregarEspecialidad();
                        }
                      }}
                      placeholder="Ej: Climatización, Electricidad"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={agregarEspecialidad}
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {especialidades.map((esp) => (
                      <Badge key={esp} variant="outline">
                        {esp}
                        <button
                          type="button"
                          onClick={() => quitarEspecialidad(esp)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="col-span-2 space-y-2">
                  <FormLabel>Etiquetas</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={nuevaEtiqueta}
                      onChange={(e) => setNuevaEtiqueta(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          agregarEtiqueta();
                        }
                      }}
                      placeholder="Ej: Bilingüe, Licencia Clase B"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={agregarEtiqueta}
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {etiquetas.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => quitarEtiqueta(tag)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contacto de Emergencia</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contacto_emergencia_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_emergencia_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_emergencia_relacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relación</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Cónyuge, Padre" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Comentarios */}
            <FormField
              control={form.control}
              name="comentarios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {personal ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
