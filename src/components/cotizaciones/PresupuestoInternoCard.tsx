import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  TrendingUp,
  Package,
  Wrench,
  MoreHorizontal,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  usePresupuestoInterno,
  useCrearPresupuestoInterno,
  useActualizarPresupuestoInterno,
  useEliminarPresupuestoInterno,
  useAprobarPresupuestoInterno,
  LineaCosto,
  TipoLineaCosto,
} from "@/hooks/usePresupuestoInterno";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { CheckCircle2 } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";

interface Props {
  cotizacionId: string;
  cotizacionMoneda: "CLP" | "UF" | "USD";
  cotizacionSubtotal: number; // precio venta sin IVA, para calcular utilidad
  readOnly?: boolean;
}

const tipoConfig: Record<TipoLineaCosto, { label: string; icon: any; color: string }> = {
  insumo: { label: "Insumo", icon: Package, color: "bg-blue-500" },
  mano_obra: { label: "Mano de obra", icon: Wrench, color: "bg-orange-500" },
  otro: { label: "Otro", icon: MoreHorizontal, color: "bg-gray-500" },
};

export function PresupuestoInternoCard({
  cotizacionId,
  cotizacionMoneda,
  cotizacionSubtotal,
  readOnly = false,
}: Props) {
  const { data: presupuesto, isLoading } = usePresupuestoInterno(cotizacionId);
  const crear = useCrearPresupuestoInterno();
  const actualizar = useActualizarPresupuestoInterno();
  const eliminar = useEliminarPresupuestoInterno();
  const aprobar = useAprobarPresupuestoInterno();
  const { hasAnyRole } = useCurrentUserRole();
  const isAdminOrSupervisor = hasAnyRole(["admin", "supervisor"]);

  const [items, setItems] = useState<LineaCosto[]>([]);
  const [margenPct, setMargenPct] = useState<number>(30);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (presupuesto) {
      setItems(presupuesto.items || []);
      setMargenPct(Number(presupuesto.margen_pct) || 30);
      setDirty(false);
    }
  }, [presupuesto?.id]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando presupuesto interno...
        </CardContent>
      </Card>
    );
  }

  // No existe: mostrar CTA
  if (!presupuesto) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Presupuesto interno (costos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Registra los costos internos (insumos, mano de obra, otros) para calcular tu margen y la utilidad
            estimada de esta cotización. Esta información <strong>no se muestra al cliente</strong>.
          </p>
          <Button
            onClick={() =>
              crear.mutate({
                cotizacion_id: cotizacionId,
                moneda: cotizacionMoneda,
                margen_pct: 30,
                items: [],
              })
            }
            disabled={crear.isPending || readOnly}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear presupuesto de costos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totales = items.reduce(
    (acc, i) => {
      if (i.tipo === "insumo") acc.insumos += i.subtotal || 0;
      else if (i.tipo === "mano_obra") acc.mano_obra += i.subtotal || 0;
      else acc.otros += i.subtotal || 0;
      return acc;
    },
    { insumos: 0, mano_obra: 0, otros: 0 }
  );
  const costoTotal = totales.insumos + totales.mano_obra + totales.otros;
  const precioSugerido = costoTotal * (1 + margenPct / 100);
  const utilidad = cotizacionSubtotal - costoTotal;
  const utilidadPct = costoTotal > 0 ? (utilidad / costoTotal) * 100 : 0;

  const aprobado = presupuesto.estado === "aprobado";
  const bloqueado = aprobado || readOnly;

  const addLine = (tipo: TipoLineaCosto) => {
    setItems([
      ...items,
      { tipo, concepto: "", cantidad: 1, costo_unit: 0, subtotal: 0 },
    ]);
    setDirty(true);
  };

  const updateLine = (idx: number, field: keyof LineaCosto, value: any) => {
    const next = [...items];
    const line = { ...next[idx], [field]: value } as LineaCosto;
    if (field === "cantidad" || field === "costo_unit") {
      const c = field === "cantidad" ? Number(value) : Number(line.cantidad);
      const cu = field === "costo_unit" ? Number(value) : Number(line.costo_unit);
      line.subtotal = Math.round((c || 0) * (cu || 0) * 100) / 100;
    }
    next[idx] = line;
    setItems(next);
    setDirty(true);
  };

  const removeLine = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleSave = () => {
    actualizar.mutate(
      { id: presupuesto.id, items, margen_pct: margenPct },
      {
        onSuccess: () => {
          setDirty(false);
          toast({ title: "Presupuesto guardado" });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Presupuesto interno (costos)
            {aprobado && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" /> Aprobado
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {dirty && !bloqueado && (
              <Button size="sm" onClick={handleSave} disabled={actualizar.isPending}>
                <Save className="h-4 w-4 mr-1" /> Guardar
              </Button>
            )}
            {!aprobado && !readOnly && isAdminOrSupervisor && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={dirty || items.length === 0 || aprobar.isPending}
                    title={
                      dirty
                        ? "Guarda los cambios antes de aprobar"
                        : items.length === 0
                        ? "Agrega al menos 1 línea de costo"
                        : "Aprobar presupuesto"
                    }
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar presupuesto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Aprobar presupuesto interno?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Al aprobar se bloquearán los costos y se generarán automáticamente las
                      3 opciones de negociación (A/B/C) para esta cotización. Esta acción no
                      se puede deshacer desde la interfaz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        aprobar.mutate(
                          { id: presupuesto.id, cotizacion_id: cotizacionId },
                          {
                            onSuccess: async () => {
                              const { data, error } = await supabase
                                .from("cotizacion_opciones")
                                .select("id")
                                .eq("cotizacion_id", cotizacionId);
                              if (error || !data || data.length !== 3) {
                                toast({
                                  title: "Presupuesto aprobado, pero opciones no generadas",
                                  description: `Se esperaban 3 opciones (A/B/C) y se encontraron ${data?.length ?? 0}. Revisa manualmente la tarjeta "Opciones de negociación".`,
                                  variant: "destructive",
                                });
                              } else {
                                toast({
                                  title: "Presupuesto aprobado",
                                  description: "Se generaron las opciones de negociación A/B/C.",
                                  action: (
                                    <ToastAction
                                      altText="Ver opciones"
                                      onClick={() =>
                                        document
                                          .getElementById("opciones-negociacion")
                                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                                      }
                                    >
                                      Ver opciones
                                    </ToastAction>
                                  ),
                                });
                              }
                            },
                          }
                        )
                      }
                    >
                      Aprobar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!bloqueado && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar presupuesto interno?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se borrarán todas las líneas de costo. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        eliminar.mutate({ id: presupuesto.id, cotizacion_id: cotizacionId })
                      }
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Información interna — el cliente no la ve. Sirve para calcular tu utilidad estimada.
        </p>

        {aprobado && (
          <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-3 text-sm flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300">
                Presupuesto aprobado
              </p>
              <p className="text-green-700 dark:text-green-400 text-xs">
                Se generaron automáticamente las opciones de negociación (A/B/C). Revísalas en
                la tarjeta "Opciones de negociación" más abajo en esta página.
              </p>
            </div>
          </div>
        )}


        {/* Tabla de líneas */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Tipo</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-center w-[90px]">Cantidad</TableHead>
                <TableHead className="text-right w-[140px]">Costo unit.</TableHead>
                <TableHead className="text-right w-[140px]">Subtotal</TableHead>
                {!bloqueado && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={bloqueado ? 5 : 6} className="text-center text-muted-foreground py-6">
                    Sin líneas de costo. Agrega insumos, mano de obra u otros costos.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, idx) => {
                const cfg = tipoConfig[item.tipo];
                const TipoIcon = cfg.icon;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      {bloqueado ? (
                        <Badge variant="outline" className="gap-1">
                          <TipoIcon className="h-3 w-3" /> {cfg.label}
                        </Badge>
                      ) : (
                        <Select
                          value={item.tipo}
                          onValueChange={(v) => updateLine(idx, "tipo", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="insumo">Insumo</SelectItem>
                            <SelectItem value="mano_obra">Mano de obra</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {bloqueado ? (
                        item.concepto || <span className="text-muted-foreground">—</span>
                      ) : (
                        <Input
                          value={item.concepto}
                          onChange={(e) => updateLine(idx, "concepto", e.target.value)}
                          placeholder="Descripción"
                          className="h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {bloqueado ? (
                        item.cantidad
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.cantidad}
                          onChange={(e) => updateLine(idx, "cantidad", Number(e.target.value))}
                          className="h-8 text-center"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {bloqueado ? (
                        formatCurrency(item.costo_unit, cotizacionMoneda)
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.costo_unit}
                          onChange={(e) =>
                            updateLine(idx, "costo_unit", Number(e.target.value))
                          }
                          className="h-8 text-right"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.subtotal, cotizacionMoneda)}
                    </TableCell>
                    {!bloqueado && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeLine(idx)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {!bloqueado && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => addLine("insumo")}>
              <Package className="h-4 w-4 mr-1" /> Insumo
            </Button>
            <Button variant="outline" size="sm" onClick={() => addLine("mano_obra")}>
              <Wrench className="h-4 w-4 mr-1" /> Mano de obra
            </Button>
            <Button variant="outline" size="sm" onClick={() => addLine("otro")}>
              <MoreHorizontal className="h-4 w-4 mr-1" /> Otro
            </Button>
          </div>
        )}

        <Separator />

        {/* Resumen costos + utilidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insumos</span>
              <span>{formatCurrency(totales.insumos, cotizacionMoneda)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mano de obra</span>
              <span>{formatCurrency(totales.mano_obra, cotizacionMoneda)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Otros</span>
              <span>{formatCurrency(totales.otros, cotizacionMoneda)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Costo total</span>
              <span>{formatCurrency(costoTotal, cotizacionMoneda)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">Margen objetivo (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={margenPct}
                  disabled={bloqueado}
                  onChange={(e) => {
                    setMargenPct(Number(e.target.value));
                    setDirty(true);
                  }}
                  className="h-9"
                />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-muted-foreground">Precio sugerido</p>
                <p className="font-semibold">
                  {formatCurrency(precioSugerido, cotizacionMoneda)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Utilidad estimada
                </span>
                <span>vs precio venta cotización</span>
              </div>
              <div className="flex justify-between items-baseline">
                <p
                  className={`text-2xl font-bold ${
                    utilidad >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(utilidad, cotizacionMoneda)}
                </p>
                <Badge variant={utilidad >= 0 ? "default" : "destructive"}>
                  {utilidadPct.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Venta (sin IVA): {formatCurrency(cotizacionSubtotal, cotizacionMoneda)} − Costo:{" "}
                {formatCurrency(costoTotal, cotizacionMoneda)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
