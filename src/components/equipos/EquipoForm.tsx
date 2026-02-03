import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProveedores } from "@/hooks/useProveedores";
import { useCreateEquipo, useUpdateEquipo, generarCodigoEquipo, type Equipo } from "@/hooks/useEquipos";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode } from "lucide-react";

const formSchema = z.object({
  codigo_qr: z.string().min(1, "El código es requerido"),
  numero_serie: z.string().optional(),
  modelo: z.string().optional(),
  marca: z.string().optional(),
  descripcion: z.string().optional(),
  fecha_compra: z.string().optional(),
  fecha_garantia_fin: z.string().optional(),
  proveedor_id: z.string().optional(),
  costo_adquisicion: z.coerce.number().min(0).optional(),
  ubicacion_actual: z.string().optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EquipoFormProps {
  equipo?: Equipo | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EquipoForm({ equipo, onSuccess, onCancel }: EquipoFormProps) {
  const [generatingCode, setGeneratingCode] = useState(false);
  const { data: proveedores } = useProveedores();
  const createEquipo = useCreateEquipo();
  const updateEquipo = useUpdateEquipo();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo_qr: equipo?.codigo_qr || "",
      numero_serie: equipo?.numero_serie || "",
      modelo: equipo?.modelo || "",
      marca: equipo?.marca || "",
      descripcion: equipo?.descripcion || "",
      fecha_compra: equipo?.fecha_compra || "",
      fecha_garantia_fin: equipo?.fecha_garantia_fin || "",
      proveedor_id: equipo?.proveedor_id || "",
      costo_adquisicion: equipo?.costo_adquisicion || 0,
      ubicacion_actual: equipo?.ubicacion_actual || "",
      notas: equipo?.notas || "",
    },
  });

  useEffect(() => {
    if (!equipo) {
      handleGenerarCodigo();
    }
  }, []);

  const handleGenerarCodigo = async () => {
    setGeneratingCode(true);
    try {
      const codigo = await generarCodigoEquipo();
      form.setValue("codigo_qr", codigo);
    } catch (error) {
      console.error("Error generando código:", error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const equipoData = {
      codigo_qr: values.codigo_qr,
      numero_serie: values.numero_serie || null,
      modelo: values.modelo || null,
      marca: values.marca || null,
      descripcion: values.descripcion || null,
      ubicacion_actual: values.ubicacion_actual || null,
      notas: values.notas || null,
      proveedor_id: values.proveedor_id || null,
      fecha_compra: values.fecha_compra || null,
      fecha_garantia_fin: values.fecha_garantia_fin || null,
      costo_adquisicion: values.costo_adquisicion || null,
      item_inventario_id: null,
      tecnico_asignado_id: null,
      cliente_id: null,
      ubicacion_cliente_id: null,
      created_by: user.id,
      estado: "en_bodega" as const,
      activo: true,
    };

    if (equipo) {
      await updateEquipo.mutateAsync({ id: equipo.id, ...equipoData });
    } else {
      await createEquipo.mutateAsync(equipoData);
    }

    onSuccess?.();
  };

  const isPending = createEquipo.isPending || updateEquipo.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{equipo ? "Editar Equipo" : "Nuevo Equipo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Código QR */}
            <div className="bg-muted/50 p-4 rounded-lg border-2 border-dashed">
              <FormField
                control={form.control}
                name="codigo_qr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Código de Identificación *
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} readOnly className="font-mono text-lg" />
                      </FormControl>
                      {!equipo && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerarCodigo}
                          disabled={generatingCode}
                        >
                          {generatingCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Regenerar"
                          )}
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Samsung, LG, Carrier..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Serie</FormLabel>
                    <FormControl>
                      <Input placeholder="S/N del fabricante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proveedores?.map((prov) => (
                          <SelectItem key={prov.id} value={prov.id}>
                            {prov.razon_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fechas y costos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fecha_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Compra</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_garantia_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantía hasta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costo_adquisicion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo de Adquisición</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ubicación */}
            <FormField
              control={form.control}
              name="ubicacion_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación Actual (Bodega)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Bodega Central - Estante A3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción detallada del equipo..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones, condiciones especiales..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {equipo ? "Guardar Cambios" : "Crear Equipo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
