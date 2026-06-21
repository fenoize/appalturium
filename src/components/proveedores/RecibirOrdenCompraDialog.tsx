import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrdenCompra, useRecibirOrdenCompra } from "@/hooks/useOrdenesCompra";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RecibirOrdenCompraDialogProps {
  ordenId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function RecibirOrdenCompraDialog({
  ordenId,
  onOpenChange,
}: RecibirOrdenCompraDialogProps) {
  const open = !!ordenId;
  const { data: orden, isLoading } = useOrdenCompra(ordenId || undefined);
  const recibirOrden = useRecibirOrdenCompra();
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (orden?.items) {
      const init: Record<string, number> = {};
      orden.items.forEach((it) => {
        const pendiente = Math.max(0, it.cantidad_solicitada - it.cantidad_recibida);
        init[it.id] = pendiente;
      });
      setCantidades(init);
    }
  }, [orden?.id]);

  const handleConfirm = async () => {
    if (!orden) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sesión no válida", variant: "destructive" });
      return;
    }

    const items = (orden.items || [])
      .map((it) => {
        const recibidaEsta = cantidades[it.id] || 0;
        const totalRecibida = it.cantidad_recibida + recibidaEsta;
        return {
          itemId: it.id,
          inventarioId: it.item_id,
          cantidadRecibida: totalRecibida,
          delta: recibidaEsta,
        };
      })
      .filter((i) => i.delta > 0);

    if (items.length === 0) {
      toast({
        title: "Sin cantidades a recibir",
        description: "Ingrese al menos una cantidad mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    await recibirOrden.mutateAsync({
      ordenId: orden.id,
      items: items.map(({ itemId, inventarioId, cantidadRecibida }) => ({
        itemId,
        inventarioId,
        cantidadRecibida,
      })),
      userId: user.id,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Recibir Orden de Compra {orden?.numero}
          </DialogTitle>
          <DialogDescription>
            Ingrese las cantidades recibidas en esta recepción. El estado de la
            OC se actualizará automáticamente a Parcial o Completada.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !orden ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-right">Solicitado</div>
              <div className="col-span-2 text-right">Ya recibido</div>
              <div className="col-span-3 text-right">Recibir ahora</div>
            </div>
            {(orden.items || []).map((it) => {
              const pendiente = Math.max(
                0,
                it.cantidad_solicitada - it.cantidad_recibida,
              );
              return (
                <div
                  key={it.id}
                  className="grid grid-cols-12 gap-2 items-center border rounded-md p-2"
                >
                  <div className="col-span-5">
                    <p className="text-sm font-medium">
                      {it.item?.nombre || "Item"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {it.item?.codigo} · {it.item?.unidad_medida}
                    </p>
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm">
                    {it.cantidad_solicitada}
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm">
                    {it.cantidad_recibida}
                  </div>
                  <div className="col-span-3">
                    <Label className="sr-only">Recibir</Label>
                    <Input
                      type="number"
                      min={0}
                      max={pendiente}
                      step="0.01"
                      disabled={pendiente === 0}
                      value={cantidades[it.id] ?? 0}
                      onChange={(e) => {
                        const v = Math.min(
                          pendiente,
                          Math.max(0, Number(e.target.value) || 0),
                        );
                        setCantidades((prev) => ({ ...prev, [it.id]: v }));
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={recibirOrden.isPending}>
                {recibirOrden.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar recepción
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
