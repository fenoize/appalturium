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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useOrdenesCompra } from "@/hooks/useOrdenesCompra";
import { useProveedores } from "@/hooks/useProveedores";
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Download, ShoppingCart, TrendingUp, Building2, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const estadoLabels: Record<string, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  parcial: "Parcial",
  completada: "Completada",
  cancelada: "Cancelada",
};

const estadoColors: Record<string, string> = {
  borrador: "bg-secondary",
  enviada: "bg-blue-500",
  parcial: "bg-yellow-500",
  completada: "bg-green-500",
  cancelada: "bg-red-500",
};

export function ReporteCompras() {
  const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 6), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [proveedorFiltro, setProveedorFiltro] = useState<string>("todos");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");

  const { data: ordenes = [] } = useOrdenesCompra();
  const { data: proveedores = [] } = useProveedores();

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((oc) => {
      const fecha = new Date(oc.fecha_emision);
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59);

      const dentroRango = isWithinInterval(fecha, { start: inicio, end: fin });
      const proveedorOk = proveedorFiltro === "todos" || oc.proveedor_id === proveedorFiltro;
      const estadoOk = estadoFiltro === "todos" || oc.estado === estadoFiltro;

      return dentroRango && proveedorOk && estadoOk;
    });
  }, [ordenes, fechaInicio, fechaFin, proveedorFiltro, estadoFiltro]);

  // Métricas
  const metricas = useMemo(() => {
    const totalCompras = ordenesFiltradas.reduce((sum, oc) => sum + (oc.total || 0), 0);
    const completadas = ordenesFiltradas.filter((oc) => oc.estado === "completada").length;
    const pendientes = ordenesFiltradas.filter((oc) => oc.estado === "enviada" || oc.estado === "parcial").length;
    const proveedoresUnicos = new Set(ordenesFiltradas.map((oc) => oc.proveedor_id)).size;

    return { totalCompras, completadas, pendientes, proveedoresUnicos, totalOrdenes: ordenesFiltradas.length };
  }, [ordenesFiltradas]);

  // Compras por proveedor
  const comprasPorProveedor = useMemo(() => {
    const porProveedor: Record<string, { nombre: string; total: number; ordenes: number }> = {};

    ordenesFiltradas.forEach((oc) => {
      const provId = oc.proveedor_id;
      if (!porProveedor[provId]) {
        porProveedor[provId] = {
          nombre: oc.proveedor?.razon_social || "Desconocido",
          total: 0,
          ordenes: 0,
        };
      }
      porProveedor[provId].total += oc.total || 0;
      porProveedor[provId].ordenes += 1;
    });

    return Object.entries(porProveedor)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [ordenesFiltradas]);

  // Distribución por estado
  const distribucionEstados = useMemo(() => {
    const estados: Record<string, number> = {};

    ordenesFiltradas.forEach((oc) => {
      estados[oc.estado || "borrador"] = (estados[oc.estado || "borrador"] || 0) + 1;
    });

    return Object.entries(estados).map(([estado, count]) => ({
      name: estadoLabels[estado] || estado,
      value: count,
    }));
  }, [ordenesFiltradas]);

  // Evolución mensual
  const evolucionMensual = useMemo(() => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const meses = eachMonthOfInterval({ start: inicio, end: fin });

    return meses.map((mes) => {
      const inicioMes = startOfMonth(mes);
      const finMes = endOfMonth(mes);

      const ordenesDelMes = ordenesFiltradas.filter((oc) => {
        const fechaOC = new Date(oc.fecha_emision);
        return isWithinInterval(fechaOC, { start: inicioMes, end: finMes });
      });

      const total = ordenesDelMes.reduce((sum, oc) => sum + (oc.total || 0), 0);

      return {
        mes: format(mes, "MMM yy", { locale: es }),
        total,
        ordenes: ordenesDelMes.length,
      };
    });
  }, [ordenesFiltradas, fechaInicio, fechaFin]);

  const exportToCSV = () => {
    const headers = ["Número", "Fecha", "Proveedor", "Estado", "Subtotal", "Impuestos", "Total", "Moneda"];
    const rows = ordenesFiltradas.map((oc) => [
      oc.numero,
      format(new Date(oc.fecha_emision), "dd/MM/yyyy"),
      oc.proveedor?.razon_social || "",
      estadoLabels[oc.estado || "borrador"],
      oc.subtotal || 0,
      oc.impuestos || 0,
      oc.total || 0,
      oc.moneda || "CLP",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compras_${fechaInicio}_${fechaFin}.csv`;
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
              <Label>Proveedor</Label>
              <Select value={proveedorFiltro} onValueChange={setProveedorFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {proveedores.map((prov) => (
                    <SelectItem key={prov.id} value={prov.id}>
                      {prov.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{formatCurrency(metricas.totalCompras)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Órdenes Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{metricas.totalOrdenes}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{metricas.completadas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{metricas.pendientes}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proveedores Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{metricas.proveedoresUnicos}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            {evolucionMensual.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolucionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {distribucionEstados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distribucionEstados}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionEstados.map((entry, index) => (
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
      </div>

      {/* Top Proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Proveedores por Volumen de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          {comprasPorProveedor.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos para mostrar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comprasPorProveedor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Órdenes de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          {ordenesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
              <p>No hay órdenes en el rango seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Entrega Esperada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesFiltradas.slice(0, 50).map((oc) => (
                    <TableRow key={oc.id}>
                      <TableCell className="font-mono">{oc.numero}</TableCell>
                      <TableCell>
                        {format(new Date(oc.fecha_emision), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>{oc.proveedor?.razon_social}</TableCell>
                      <TableCell>
                        <Badge className={`${estadoColors[oc.estado || "borrador"]} text-white`}>
                          {estadoLabels[oc.estado || "borrador"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(oc.total || 0)}
                      </TableCell>
                      <TableCell>
                        {oc.fecha_entrega_esperada
                          ? format(new Date(oc.fecha_entrega_esperada), "dd/MM/yyyy", { locale: es })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {ordenesFiltradas.length > 50 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Mostrando 50 de {ordenesFiltradas.length} órdenes
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
