import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  FileText,
  PieChart,
} from "lucide-react";
import {
  useResumenFinanzas,
  usePresupuestosPorEstado,
  usePresupuestosPorMoneda,
  useComparacionFinanciera,
} from "@/hooks/useFinanzas";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  aprobado: "hsl(var(--chart-1))",
  rechazado: "hsl(var(--chart-2))",
  enviado: "hsl(var(--chart-3))",
  borrador: "hsl(var(--chart-4))",
  CLP: "hsl(var(--chart-1))",
  UF: "hsl(var(--chart-2))",
  USD: "hsl(var(--chart-3))",
};

export default function Finanzas() {
  const { data: resumen, isLoading: loadingResumen } = useResumenFinanzas();
  const { data: porEstado, isLoading: loadingEstado } = usePresupuestosPorEstado();
  const { data: porMoneda, isLoading: loadingMoneda } = usePresupuestosPorMoneda();
  const { data: comparacion, isLoading: loadingComparacion } = useComparacionFinanciera();

  if (loadingResumen) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const estadosData = porEstado?.map((item) => ({
    name: item.estado.charAt(0).toUpperCase() + item.estado.slice(1),
    cantidad: item.cantidad,
    fill: COLORS[item.estado as keyof typeof COLORS],
  })) || [];

  const monedasData = porMoneda?.filter(m => m.cantidad > 0) || [];

  const comparacionData = comparacion?.map((item) => ({
    moneda: item.moneda,
    Presupuestado: item.presupuestado,
    Facturado: item.facturado,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Resumen Financiero</h1>
        <p className="text-muted-foreground">Dashboard de presupuestos e ingresos</p>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Presupuestos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.total_presupuestos || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumen?.presupuestos_aprobados || 0} aprobados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resumen?.presupuestos_aprobados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumen?.total_presupuestos 
                ? ((resumen.presupuestos_aprobados / resumen.total_presupuestos) * 100).toFixed(1)
                : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {resumen?.presupuestos_rechazados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumen?.total_presupuestos 
                ? ((resumen.presupuestos_rechazados / resumen.total_presupuestos) * 100).toFixed(1)
                : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(resumen?.presupuestos_enviados || 0) + (resumen?.presupuestos_borrador || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumen?.presupuestos_enviados || 0} enviados, {resumen?.presupuestos_borrador || 0} borradores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="estados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estados">Por Estado</TabsTrigger>
          <TabsTrigger value="monedas">Por Moneda</TabsTrigger>
          <TabsTrigger value="comparacion">Comparación</TabsTrigger>
        </TabsList>

        {/* Tab: Estados */}
        <TabsContent value="estados" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEstado ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : estadosData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={estadosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, cantidad }) => `${name}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {estadosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen por Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {porEstado?.map((item) => (
                  <div key={item.estado} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{item.estado}</p>
                      <p className="text-sm text-muted-foreground">{item.cantidad} presupuestos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.total, "CLP")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Monedas */}
        <TabsContent value="monedas" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos CLP</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(resumen?.ingresos_proyectados_clp || 0, "CLP")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Proyectado de {monedasData.find(m => m.moneda === "CLP")?.cantidad || 0} presupuestos aprobados
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Facturado: {formatCurrency(resumen?.facturado_clp || 0, "CLP")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos UF</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(resumen?.ingresos_proyectados_uf || 0, "UF")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Proyectado de {monedasData.find(m => m.moneda === "UF")?.cantidad || 0} presupuestos aprobados
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Facturado: {formatCurrency(resumen?.facturado_uf || 0, "UF")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos USD</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(resumen?.ingresos_proyectados_usd || 0, "USD")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Proyectado de {monedasData.find(m => m.moneda === "USD")?.cantidad || 0} presupuestos aprobados
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Facturado: {formatCurrency(resumen?.facturado_usd || 0, "USD")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Moneda (Presupuestos Aprobados)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMoneda ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monedasData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monedasData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="moneda" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="total" fill={COLORS.CLP} name="Total" />
                    <Bar dataKey="cantidad" fill={COLORS.UF} name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No hay presupuestos aprobados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comparación */}
        <TabsContent value="comparacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presupuestado vs Facturado por Moneda</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComparacion ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comparacionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparacionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="moneda" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="Presupuestado" fill={COLORS.CLP} />
                    <Bar dataKey="Facturado" fill={COLORS.UF} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {comparacionData.map((item) => (
              <Card key={item.moneda}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.moneda}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Presupuestado:</span>
                    <span className="font-semibold">
                      {formatCurrency(item.Presupuestado, item.moneda as any)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Facturado:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.Facturado, item.moneda as any)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Pendiente:</span>
                    <span className="font-bold">
                      {formatCurrency(item.Presupuestado - item.Facturado, item.moneda as any)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1">Progreso</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${item.Presupuestado > 0 ? Math.min((item.Facturado / item.Presupuestado) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-center mt-1">
                      {item.Presupuestado > 0 ? ((item.Facturado / item.Presupuestado) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
