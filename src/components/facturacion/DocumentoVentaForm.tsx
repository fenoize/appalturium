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
} from "@/components/ui/form";

const documentoSchema = z
  .object({
    tipo: z.enum(["boleta", "factura", "nota_credito", "nota_debito", "otro"]),
    numero: z.string().optional(),
    fecha: z.string().min(1, "La fecha es requerida"),
    total: z.number().min(0.01, "El total debe ser mayor a 0"),
    moneda: z.enum(["CLP", "UF", "USD"]),
    notas: z.string().optional(),
    plan_cuotas: z.enum(["1", "2"]).default("1"),
    cuota1_monto: z.number().optional(),
    cuota1_fecha: z.string().optional(),
    cuota2_monto: z.number().optional(),
    cuota2_fecha: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.plan_cuotas === "2") {
      const c1 = Number(data.cuota1_monto || 0);
      const c2 = Number(data.cuota2_monto || 0);
      if (c1 <= 0)
        ctx.addIssue({ path: ["cuota1_monto"], code: "custom", message: "Requerido" });
      if (c2 <= 0)
        ctx.addIssue({ path: ["cuota2_monto"], code: "custom", message: "Requerido" });
      if (Math.abs(c1 + c2 - data.total) > 0.01) {
        ctx.addIssue({
          path: ["cuota2_monto"],
          code: "custom",
          message: `Cuota 1 + Cuota 2 debe ser igual al total (${data.total})`,
        });
      }
    }
  });

export type DocumentoFormData = z.infer<typeof documentoSchema>;

interface DocumentoVentaFormProps {
  onSubmit: (data: DocumentoFormData) => void;
  onCancel: () => void;
  presupuestoTotal?: number;
  moneda?: "CLP" | "UF" | "USD";
}

export function DocumentoVentaForm({
  onSubmit,
  onCancel,
  presupuestoTotal,
  moneda = "CLP",
}: DocumentoVentaFormProps) {
  const form = useForm<DocumentoFormData>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      tipo: "boleta",
      fecha: new Date().toISOString().split("T")[0],
      total: presupuestoTotal || 0,
      moneda: moneda,
      notas: "",
      plan_cuotas: "1",
      cuota1_monto: undefined,
      cuota1_fecha: "",
      cuota2_monto: undefined,
      cuota2_fecha: "",
    },
  });

  const planCuotas = form.watch("plan_cuotas");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Documento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="boleta">Boleta</SelectItem>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="nota_credito">Nota de Crédito</SelectItem>
                  <SelectItem value="nota_debito">Nota de Débito</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Documento (opcional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Se generará automáticamente si se deja vacío" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormControl>
                  <Input {...field} disabled className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plan_cuotas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan de pago</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 cuota (pago único)</SelectItem>
                  <SelectItem value="2">2 cuotas</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {planCuotas === "2" && (
          <div className="space-y-3 border rounded-md p-3 bg-muted/30">
            <p className="text-sm font-medium">Detalle de cuotas</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cuota1_monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuota 1 - Monto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cuota1_fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuota 1 - Fecha esperada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cuota2_monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuota 2 - Monto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cuota2_fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuota 2 - Fecha esperada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

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
            Crear Documento
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
