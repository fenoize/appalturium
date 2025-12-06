import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useMovimientos, useInventario, type MovimientoInventario } from "@/hooks/useInventario";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, ArrowUpDown, Package } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export function ReporteMovimientos() {
  const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [itemFiltro, setItemFiltro] = useState<string>("todos");

  const { data: movimientos = [] } = useMovimientos();
  const { data: items = [] } = useInventario();

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((mov) => {
      const fecha = new Date(mov.created_at);
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59);

      const dentroRango = isWithinInterval(fecha, { start: inicio, end: fin });
      const tipoOk = tipoFiltro === "todos" || mov.tipo === tipoFiltro;
      const itemOk = itemFiltro === "todos" || mov.item_id === itemFiltro;

      return dentroRango && tipoOk && itemOk;
    });
  }, [movimientos, fechaInicio, fechaFin, tipoFiltro, itemFiltro]);

  // Resumen por tipo
  const resumenPorTipo = useMemo(() => {
    const resumen = { entrada: 0, salida: 0, ajuste: 0, transferencia: 0 };
    movimientosFiltrados.forEach((mov) => {
      resumen[mov.tipo as keyof typeof resumen] += mov.cantidad;
    });
    return [
      { name: "Entradas", value: resumen.entrada, color: "hsl(var(--chart-1))" },
      { name: "Salidas", value: resumen.salida, color: "hsl(var(--chart-2))" },
      { name: "Ajustes", value: resumen.ajuste, color: "hsl(var(--chart-3))" },
      { name: "Transferencias", value: resumen.transferencia, color: "hsl(var(--chart-4))" },
    ].filter((r) => r.value > 0);
  }, [movimientosFiltrados]);

  // Valor de movimientos
  const valorMovimientos = useMemo(() => {
    let entradas = 0;
    let salidas = 0;

    movimientosFiltrados.forEach((mov) => {
      const costo = mov.costo_unitario || 0;
      if (mov.tipo === "entrada") {
        entradas += mov.cantidad * costo;
      } else if (mov.tipo === "salida") {
        salidas += mov.cantidad * costo;
      }
    });

    return { entradas, salidas };
  }, [movimientosFiltrados]);

  // Top items con más movimientos
  const topItems = useMemo(() => {
    const conteo: Record<string, { nombre: string; cantidad: number }> = {};

    movimientosFiltrados.forEach((mov) => {
      const itemId = mov.item_id;
      if (!conteo[itemId]) {
        conteo[itemId] = { nombre: mov.item?.nombre || "Desconocido", cantidad: 0 };
      }
      conteo[itemId].cantidad += mov.cantidad;
    });

    return Object.entries(conteo)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [movimientosFiltrados]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "salida":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      entrada: "Entrada",
      salida: "Salida",
      ajuste: "Ajuste",
      transferencia: "Transferencia",
    };
    return tipos[tipo] || tipo;
  };

  const exportToCSV = () => {
    const headers = ["Fecha", "Item", "Código", "Tipo", "Cantidad", "Stock Anterior", "Stock Nuevo", "Costo Unitario", "Notas"];
    const rows = movimientosFiltrados.map((mov) => [
      format(new Date(mov.created_at), "dd/MM/yyyy HH:mm"),
      mov.item?.nombre || "",
      mov.item?.codigo || "",
      getTipoLabel(mov.tipo),
      mov.cantidad,
      mov.stock_anterior,
      mov.stock_nuevo,
      mov.costo_unitario || 0,
      mov.notas || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_${fechaInicio}_${fechaFin}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Item</Label>
              <Select value={itemFiltro} onValueChange={setItemFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{movimientosFiltrados.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(valorMovimientos.entradas)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Salidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{formatCurrency(valorMovimientos.salidas)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items Afectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{topItems.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Movimientos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {resumenPorTipo.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={resumenPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resumenPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Items con más Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowUpDown className="h-8 w-8 mx-auto mb-2" />
              <p>No hay movimientos en el rango seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock Ant.</TableHead>
                    <TableHead className="text-right">Stock Nuevo</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosFiltrados.slice(0, 50).map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mov.item?.nombre}</p>
                          <p className="text-xs text-muted-foreground">{mov.item?.codigo}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoIcon(mov.tipo)}
                          <Badge variant="outline">{getTipoLabel(mov.tipo)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mov.tipo === "entrada" ? "+" : mov.tipo === "salida" ? "-" : ""}
                        {mov.cantidad}
                      </TableCell>
                      <TableCell className="text-right font-mono">{mov.stock_anterior}</TableCell>
                      <TableCell className="text-right font-mono">{mov.stock_nuevo}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{mov.notas || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {movimientosFiltrados.length > 50 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Mostrando 50 de {movimientosFiltrados.length} movimientos
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
