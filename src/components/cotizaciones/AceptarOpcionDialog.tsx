import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";

interface Props {
  opcionId: string;
  etiqueta: string;
  total: number;
  moneda?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AceptarOpcionDialog({
  opcionId,
  etiqueta,
  total,
  moneda = "CLP",
  open,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const [numCuotas, setNumCuotas] = useState<"1" | "2">("1");
  const [cuota1, setCuota1] = useState<string>(String(total));
  const [cuota2, setCuota2] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleConfirmar = async () => {
    const c1 = Number(cuota1);
    const c2 = numCuotas === "2" ? Number(cuota2) : 0;
    const montos = numCuotas === "1" ? [c1] : [c1, c2];

    if (montos.some((m) => !isFinite(m) || m <= 0)) {
      toast.error("Los montos deben ser positivos");
      return;
    }
    const suma = montos.reduce((a, b) => a + b, 0);
    if (Math.abs(suma - total) > 0.01) {
      toast.error(`La suma de las cuotas (${suma}) debe ser igual al total (${total})`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("fn_aceptar_opcion", {
        p_opcion_id: opcionId,
        p_num_cuotas: Number(numCuotas),
        p_montos: montos,
      });
      if (error) throw error;
      toast.success(`Opción ${etiqueta} aceptada`, {
        description: "Se generó la factura, plan de pago, SC y OT.",
      });
      onOpenChange(false);
      qc.invalidateQueries();
    } catch (err: any) {
      toast.error("Error al aceptar opción", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Aceptar opción {etiqueta} (registro manual)
          </DialogTitle>
          <DialogDescription>
            Total a facturar: <strong>{formatCurrency(total, moneda as any)}</strong>. Esta acción
            generará la factura, las cuotas, la solicitud de compra y la OT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Plan de pago</Label>
            <RadioGroup value={numCuotas} onValueChange={(v) => {
              setNumCuotas(v as "1" | "2");
              if (v === "1") {
                setCuota1(String(total));
                setCuota2("");
              } else {
                setCuota1(String(Math.round(total / 2)));
                setCuota2(String(total - Math.round(total / 2)));
              }
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="c1" />
                <Label htmlFor="c1" className="cursor-pointer">1 cuota (total al contado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="c2" />
                <Label htmlFor="c2" className="cursor-pointer">2 cuotas (montos manuales)</Label>
              </div>
            </RadioGroup>
          </div>

          {numCuotas === "1" ? (
            <div className="space-y-2">
              <Label htmlFor="m1">Monto de la cuota</Label>
              <Input id="m1" type="number" value={cuota1} onChange={(e) => setCuota1(e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="m1">Cuota 1</Label>
                <Input id="m1" type="number" value={cuota1} onChange={(e) => setCuota1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m2">Cuota 2</Label>
                <Input id="m2" type="number" value={cuota2} onChange={(e) => setCuota2(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={loading}>
            {loading ? "Procesando..." : "Confirmar aceptación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
