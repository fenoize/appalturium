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
import { useCreateMovimiento, type ItemInventario } from "@/hooks/useInventario";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  costo_unitario: z.coerce.number().min(0).optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MovimientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemInventario;
}

export function MovimientoDialog({ open, onOpenChange, item }: MovimientoDialogProps) {
  const createMovimiento = useCreateMovimiento();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "entrada",
      cantidad: 1,
      costo_unitario: item.precio_compra,
      notas: "",
    },
  });

  const tipoMovimiento = form.watch("tipo");

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let stockNuevo = item.stock_actual;
    if (values.tipo === "entrada") {
      stockNuevo = item.stock_actual + values.cantidad;
    } else if (values.tipo === "salida") {
      stockNuevo = Math.max(0, item.stock_actual - values.cantidad);
    } else {
      stockNuevo = values.cantidad;
    }

    await createMovimiento.mutateAsync({
      item_id: item.id,
      tipo: values.tipo,
      cantidad: values.cantidad,
      stock_anterior: item.stock_actual,
      stock_nuevo: stockNuevo,
      costo_unitario: values.costo_unitario || null,
      notas: values.notas || null,
      registrado_por: user.id,
      referencia_tipo: null,
      referencia_id: null,
    });

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">{item.nombre}</p>
          <p className="text-sm text-muted-foreground">
            Stock actual: <span className="font-mono">{item.stock_actual} {item.unidad_medida}</span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimiento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada (aumentar stock)</SelectItem>
                      <SelectItem value="salida">Salida (disminuir stock)</SelectItem>
                      <SelectItem value="ajuste">Ajuste (establecer stock)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cantidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tipoMovimiento === "ajuste" ? "Nuevo Stock *" : "Cantidad *"}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipoMovimiento === "entrada" && (
              <FormField
                control={form.control}
                name="costo_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo Unitario</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Motivo del movimiento..." {...field} />
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
              <Button type="submit" disabled={createMovimiento.isPending}>
                {createMovimiento.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
