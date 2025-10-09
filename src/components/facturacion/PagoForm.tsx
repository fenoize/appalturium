import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { DocumentoVenta } from "@/hooks/useDocumentosVenta";

const pagoSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  metodo: z.enum(["transferencia", "tarjeta", "efectivo", "cheque", "otro"]),
  referencia: z.string().optional(),
  notas: z.string().optional(),
});

type PagoFormData = z.infer<typeof pagoSchema>;

interface PagoFormProps {
  documento: DocumentoVenta;
  onSubmit: (data: PagoFormData) => void;
  onCancel: () => void;
}

export function PagoForm({ documento, onSubmit, onCancel }: PagoFormProps) {
  const form = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0],
      monto: documento.saldo,
      metodo: "transferencia",
      referencia: "",
      notas: "",
    },
  });

  const handleSubmit = (data: PagoFormData) => {
    if (data.monto > documento.saldo) {
      form.setError("monto", {
        message: `El monto no puede exceder el saldo pendiente ($${documento.saldo.toFixed(2)})`,
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-medium">Documento: {documento.numero}</p>
          <p className="text-muted-foreground">Saldo pendiente: ${documento.saldo.toFixed(2)}</p>
        </div>

        <FormField
          control={form.control}
          name="fecha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Pago</FormLabel>
              <FormControl>
                <Input type="date" max={new Date().toISOString().split("T")[0]} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={documento.saldo}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Máximo: ${documento.saldo.toFixed(2)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metodo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia (opcional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Número de transferencia, últimos 4 dígitos, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Notas adicionales..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Registrar Pago
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
