import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Truck } from "lucide-react";

interface ItemSC {
  id: string;
  solicitud_compra_id: string;
  item_inventario_id: string;
  cantidad: number;
  costo_unitario_estimado: number | null;
  proveedor_sugerido_id: string | null;
  cantidad_en_oc: number;
  inventario?: { id: string; nombre: string; codigo: string | null } | null;
}

interface SolicitudCompra {
  id: string;
  numero: string;
  cotizacion_id: string;
  cotizacion_opcion_id: string;
  cliente_id: string;
  estado: "pendiente" | "revisada" | "convertida_oc" | "cancelada";
  notas: string | null;
  created_at: string;
  cliente?: {
    id: string;
    razon_social: string | null;
    nombres: string | null;
    apellidos: string | null;
    rut: string;
  } | null;
  items: ItemSC[];
}

const SIN_PROVEEDOR = "__sin_proveedor__";

function clienteName(c: SolicitudCompra["cliente"]) {
  if (!c) return "—";
  return c.razon_social || [c.nombres, c.apellidos].filter(Boolean).join(" ") || c.rut;
}

export default function SolicitudesCompra() {
  const qc = useQueryClient();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [proveedorFiltro, setProveedorFiltro] = useState<string | null>(null);

  const { data: proveedores } = useQuery({
    queryKey: ["proveedores_lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("id, razon_social")
        .eq("activo", true)
        .order("razon_social");
      if (error) throw error;
      return data as { id: string; razon_social: string }[];
    },
  });

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: ["solicitudes_compra", "pendientes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("solicitudes_compra")
        .select(
          `*,
           cliente:clientes(id, razon_social, nombres, apellidos, rut),
           items:items_solicitud_compra(*, inventario:inventario(id, nombre, codigo))`
        )
        .in("estado", ["pendiente", "revisada"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SolicitudCompra[];
    },
  });

  const proveedoresMap = useMemo(() => {
    const m = new Map<string, string>();
    (proveedores ?? []).forEach((p) => m.set(p.id, p.razon_social));
    return m;
  }, [proveedores]);

  // Group SC by suggested supplier (mode of items). If items have mixed suggestions, choose the first.
  const gruposPorProveedor = useMemo(() => {
    const grupos = new Map<string, SolicitudCompra[]>();
    (solicitudes ?? []).forEach((sc) => {
      const provId =
        sc.items.find((it) => it.proveedor_sugerido_id)?.proveedor_sugerido_id ?? SIN_PROVEEDOR;
      if (!grupos.has(provId)) grupos.set(provId, []);
      grupos.get(provId)!.push(sc);
    });
    return grupos;
  }, [solicitudes]);

  const proveedoresConSC = Array.from(gruposPorProveedor.keys());

  const visibleGrupos = proveedorFiltro
    ? new Map([[proveedorFiltro, gruposPorProveedor.get(proveedorFiltro) ?? []]])
    : gruposPorProveedor;

  const toggleSel = (id: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedSCs = useMemo(
    () => (solicitudes ?? []).filter((s) => seleccion.has(s.id)),
    [solicitudes, seleccion]
  );

  // Determine which supplier all selected SCs belong to (must be the same).
  const proveedorSeleccion = useMemo(() => {
    const provs = new Set<string>();
    selectedSCs.forEach((sc) => {
      const p =
        sc.items.find((it) => it.proveedor_sugerido_id)?.proveedor_sugerido_id ?? SIN_PROVEEDOR;
      provs.add(p);
    });
    if (provs.size !== 1) return null;
    return [...provs][0];
  }, [selectedSCs]);

  const generar = useMutation({
    mutationFn: async () => {
      if (selectedSCs.length === 0) throw new Error("Selecciona al menos una SC");
      if (!proveedorSeleccion || proveedorSeleccion === SIN_PROVEEDOR) {
        throw new Error("Todas las SC deben tener el mismo proveedor sugerido");
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Aggregate items by inventario id summing cantidad and averaging cost
      const agregados = new Map<
        string,
        { cantidad: number; precio_unitario: number; precios: number[] }
      >();
      selectedSCs.forEach((sc) => {
        sc.items.forEach((it) => {
          const cur = agregados.get(it.item_inventario_id) ?? {
            cantidad: 0,
            precio_unitario: 0,
            precios: [],
          };
          cur.cantidad += Number(it.cantidad);
          if (it.costo_unitario_estimado != null) {
            cur.precios.push(Number(it.costo_unitario_estimado));
          }
          agregados.set(it.item_inventario_id, cur);
        });
      });

      const items = Array.from(agregados.entries()).map(([item_id, v]) => {
        const precio =
          v.precios.length > 0 ? v.precios.reduce((a, b) => a + b, 0) / v.precios.length : 0;
        return {
          item_id,
          cantidad_solicitada: v.cantidad,
          precio_unitario: precio,
          subtotal: v.cantidad * precio,
        };
      });

      const subtotal = items.reduce((a, i) => a + i.subtotal, 0);
      const impuestos = Math.round(subtotal * 0.19);
      const total = subtotal + impuestos;

      // Generate OC number via existing DB function
      const { data: numData, error: numErr } = await (supabase as any).rpc("generar_numero_oc");
      if (numErr) throw numErr;

      const { data: oc, error: ocErr } = await supabase
        .from("ordenes_compra")
        .insert({
          numero: numData as string,
          proveedor_id: proveedorSeleccion,
          subtotal,
          impuestos,
          total,
          created_by: user.id,
        })
        .select()
        .single();
      if (ocErr) throw ocErr;

      const { error: itemsErr } = await supabase
        .from("items_orden_compra")
        .insert(items.map((i) => ({ ...i, orden_id: oc.id })));
      if (itemsErr) throw itemsErr;

      const { error: bridgeErr } = await (supabase as any)
        .from("oc_solicitudes_compra")
        .insert(selectedSCs.map((sc) => ({ orden_compra_id: oc.id, solicitud_compra_id: sc.id })));
      if (bridgeErr) throw bridgeErr;

      const { error: updErr } = await (supabase as any)
        .from("solicitudes_compra")
        .update({ estado: "convertida_oc" })
        .in("id", selectedSCs.map((sc) => sc.id));
      if (updErr) throw updErr;

      return oc;
    },
    onSuccess: (oc: any) => {
      toast({
        title: "Orden de compra generada",
        description: `Se creó ${oc.numero} agrupando ${selectedSCs.length} SC`,
      });
      setSeleccion(new Set());
      qc.invalidateQueries({ queryKey: ["solicitudes_compra"] });
      qc.invalidateQueries({ queryKey: ["ordenes_compra"] });
    },
    onError: (e: any) =>
      toast({ title: "Error generando OC", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7" /> Solicitudes de Compra
          </h1>
          <p className="text-muted-foreground">
            Agrupa varias SC del mismo proveedor en una sola Orden de Compra.
          </p>
        </div>
        <Button
          onClick={() => generar.mutate()}
          disabled={
            generar.isPending ||
            selectedSCs.length === 0 ||
            !proveedorSeleccion ||
            proveedorSeleccion === SIN_PROVEEDOR
          }
        >
          <Truck className="w-4 h-4 mr-2" />
          {generar.isPending
            ? "Generando…"
            : `Generar Orden de Compra (${selectedSCs.length})`}
        </Button>
      </div>

      {/* Provider filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Proveedor:</span>
        <Button
          size="sm"
          variant={proveedorFiltro === null ? "default" : "outline"}
          onClick={() => setProveedorFiltro(null)}
        >
          Todos
        </Button>
        {proveedoresConSC.map((pid) => (
          <Button
            key={pid}
            size="sm"
            variant={proveedorFiltro === pid ? "default" : "outline"}
            onClick={() => setProveedorFiltro(pid)}
          >
            {pid === SIN_PROVEEDOR ? "Sin proveedor sugerido" : proveedoresMap.get(pid) ?? "—"}
            <Badge variant="secondary" className="ml-2">
              {gruposPorProveedor.get(pid)?.length ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      {selectedSCs.length > 0 && !proveedorSeleccion && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-sm text-destructive">
            Las SC seleccionadas tienen proveedores sugeridos distintos. Selecciona solo SC del
            mismo proveedor para generar una OC.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (solicitudes ?? []).length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No hay solicitudes de compra pendientes.
          </CardContent>
        </Card>
      ) : (
        Array.from(visibleGrupos.entries()).map(([provId, scs]) => (
          <Card key={provId}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {provId === SIN_PROVEEDOR
                  ? "Sin proveedor sugerido"
                  : proveedoresMap.get(provId) ?? "—"}
                <Badge variant="secondary">{scs.length} SC</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scs.map((sc) => (
                    <TableRow key={sc.id}>
                      <TableCell>
                        <Checkbox
                          checked={seleccion.has(sc.id)}
                          onCheckedChange={() => toggleSel(sc.id)}
                          disabled={provId === SIN_PROVEEDOR}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{sc.numero}</TableCell>
                      <TableCell>{clienteName(sc.cliente)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {sc.items.slice(0, 3).map((it) => (
                            <div key={it.id}>
                              {it.inventario?.nombre ?? "—"} ×{Number(it.cantidad)}
                            </div>
                          ))}
                          {sc.items.length > 3 && (
                            <div className="text-muted-foreground">
                              +{sc.items.length - 3} más
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.estado === "pendiente" ? "default" : "secondary"}>
                          {sc.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(sc.created_at).toLocaleDateString("es-CL")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
