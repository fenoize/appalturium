import { useEffect } from "react";
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
import { useCreateItem, useUpdateItem, useCategorias, type ItemInventario } from "@/hooks/useInventario";
import { useProveedores } from "@/hooks/useProveedores";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  tipo: z.enum(["material", "producto", "servicio"]),
  categoria_id: z.string().optional(),
  proveedor_id: z.string().optional(),
  unidad_medida: z.string().min(1, "La unidad de medida es requerida"),
  precio_compra: z.coerce.number().min(0),
  precio_venta: z.coerce.number().min(0),
  stock_actual: z.coerce.number().min(0),
  stock_minimo: z.coerce.number().min(0),
  stock_maximo: z.coerce.number().optional(),
  ubicacion_bodega: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InventarioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemInventario;
}

export function InventarioForm({ open, onOpenChange, item }: InventarioFormProps) {
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const { data: categorias = [] } = useCategorias();
  const { data: proveedores = [] } = useProveedores();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: item?.codigo || "",
      nombre: item?.nombre || "",
      descripcion: item?.descripcion || "",
      tipo: item?.tipo || "material",
      categoria_id: item?.categoria_id || undefined,
      proveedor_id: item?.proveedor_id || undefined,
      unidad_medida: item?.unidad_medida || "unidad",
      precio_compra: item?.precio_compra || 0,
      precio_venta: item?.precio_venta || 0,
      stock_actual: item?.stock_actual || 0,
      stock_minimo: item?.stock_minimo || 0,
      stock_maximo: item?.stock_maximo || undefined,
      ubicacion_bodega: item?.ubicacion_bodega || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const data = {
      codigo: values.codigo,
      nombre: values.nombre,
      tipo: values.tipo,
      unidad_medida: values.unidad_medida,
      precio_compra: values.precio_compra,
      precio_venta: values.precio_venta,
      stock_actual: values.stock_actual,
      stock_minimo: values.stock_minimo,
      descripcion: values.descripcion || null,
      categoria_id: values.categoria_id || null,
      proveedor_id: values.proveedor_id || null,
      stock_maximo: values.stock_maximo || null,
      ubicacion_bodega: values.ubicacion_bodega || null,
      activo: true,
    };

    if (item) {
      await updateItem.mutateAsync({ id: item.id, ...data });
    } else {
      await createItem.mutateAsync(data);
    }
    onOpenChange(false);
    form.reset();
  };

  const isLoading = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Nuevo Item de Inventario"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-001" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="producto">Producto</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del item" {...field} />
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
                    <Textarea placeholder="Descripción del item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(() => {
                          const padres = categorias.filter(
                            (c: any) => !c.categoria_padre_id
                          );
                          const hijasDe = (padreId: string) =>
                            categorias.filter(
                              (c: any) => c.categoria_padre_id === padreId
                            );
                          const huerfanas = categorias.filter(
                            (c: any) =>
                              c.categoria_padre_id &&
                              !categorias.some((p: any) => p.id === c.categoria_padre_id)
                          );
                          const ordenadas: Array<{ cat: any; nivel: number }> = [];
                          padres.forEach((p: any) => {
                            ordenadas.push({ cat: p, nivel: 0 });
                            hijasDe(p.id).forEach((h: any) =>
                              ordenadas.push({ cat: h, nivel: 1 })
                            );
                          });
                          huerfanas.forEach((h: any) =>
                            ordenadas.push({ cat: h, nivel: 1 })
                          );
                          return ordenadas.map(({ cat, nivel }) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {nivel === 0 ? (
                                <span className="font-medium">{cat.nombre}</span>
                              ) : (
                                <span className="pl-4 text-muted-foreground">
                                  — {cat.nombre}
                                </span>
                              )}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proveedores.filter(p => p.activo).map((prov) => (
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="unidad_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unidad">Unidad</SelectItem>
                        <SelectItem value="metro">Metro</SelectItem>
                        <SelectItem value="kg">Kilogramo</SelectItem>
                        <SelectItem value="litro">Litro</SelectItem>
                        <SelectItem value="hora">Hora</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precio_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Compra</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precio_venta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Venta</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stock_actual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Actual</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_maximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Máximo</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ubicacion_bodega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación en Bodega</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pasillo A, Estante 3" {...field} />
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
                {item ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
