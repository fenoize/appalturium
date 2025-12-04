import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { useCreateOrdenCompra } from "@/hooks/useOrdenesCompra";
import { useProveedores } from "@/hooks/useProveedores";
import { useInventario } from "@/hooks/useInventario";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { Loader2, Plus, Trash2 } from "lucide-react";

const itemSchema = z.object({
  item_id: z.string().min(1, "Seleccione un item"),
  cantidad_solicitada: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.coerce.number().min(0),
});

const formSchema = z.object({
  proveedor_id: z.string().min(1, "Seleccione un proveedor"),
  fecha_entrega_esperada: z.string().optional(),
  notas: z.string().optional(),
  items: z.array(itemSchema).min(1, "Agregue al menos un item"),
});

type FormValues = z.infer<typeof formSchema>;

interface OrdenCompraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrdenCompraForm({ open, onOpenChange }: OrdenCompraFormProps) {
  const createOrden = useCreateOrdenCompra();
  const { data: proveedores = [] } = useProveedores();
  const { data: inventario = [] } = useInventario();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proveedor_id: "",
      fecha_entrega_esperada: "",
      notas: "",
      items: [{ item_id: "", cantidad_solicitada: 1, precio_unitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");

  const subtotal = watchItems.reduce((acc, item) => {
    return acc + (item.cantidad_solicitada || 0) * (item.precio_unitario || 0);
  }, 0);

  const impuestos = subtotal * 0.19;
  const total = subtotal + impuestos;

  const handleItemSelect = (index: number, itemId: string) => {
    const item = inventario.find((i) => i.id === itemId);
    if (item) {
      form.setValue(`items.${index}.precio_unitario`, item.precio_compra);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const itemsWithSubtotal = values.items.map((item) => ({
      item_id: item.item_id,
      cantidad_solicitada: item.cantidad_solicitada,
      cantidad_recibida: 0,
      precio_unitario: item.precio_unitario,
      subtotal: item.cantidad_solicitada * item.precio_unitario,
    }));

    await createOrden.mutateAsync({
      orden: {
        numero: "", // Se genera automáticamente
        proveedor_id: values.proveedor_id,
        estado: "borrador",
        fecha_emision: new Date().toISOString().split("T")[0],
        fecha_entrega_esperada: values.fecha_entrega_esperada || null,
        fecha_recepcion: null,
        subtotal,
        impuestos,
        total,
        moneda: "CLP",
        notas: values.notas || null,
        created_by: user.id,
      },
      items: itemsWithSubtotal,
    });

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <FormField
                control={form.control}
                name="fecha_entrega_esperada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Entrega Esperada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Items *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ item_id: "", cantidad_solicitada: 1, precio_unitario: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.item_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Item</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleItemSelect(index, value);
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar item" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {inventario.filter(i => i.activo && i.tipo !== "servicio").map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.codigo} - {item.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.cantidad_solicitada`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Cantidad</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.precio_unitario`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Precio Unit.</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                        <p className="font-mono text-sm">
                          {formatCurrency(
                            (watchItems[index]?.cantidad_solicitada || 0) *
                              (watchItems[index]?.precio_unitario || 0)
                          )}
                        </p>
                      </div>

                      <div className="col-span-1">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {form.formState.errors.items?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
              )}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-mono">{formatCurrency(impuestos)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total:</span>
                    <span className="font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones de la orden..." {...field} />
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
              <Button type="submit" disabled={createOrden.isPending}>
                {createOrden.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Orden
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
