import { useState } from "react";
import { KPICard } from "@/components/reportes/KPICard";
import { ReportesFilters } from "@/components/reportes/ReportesFilters";
import { ReportesTable } from "@/components/reportes/ReportesTable";
import { ExportButtons } from "@/components/reportes/ExportButtons";
import { useReportesKPIs, useResumenKPIs, FiltrosReportes } from "@/hooks/useReportes";
import { 
  Clock, 
  Target, 
  TrendingUp, 
  DollarSign,
  Activity,
  BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Reportes = () => {
  const [filtros, setFiltros] = useState<FiltrosReportes>({});

  const { data: kpisData, isLoading: isLoadingKPIs } = useReportesKPIs(filtros);
  const { data: resumen, isLoading: isLoadingResumen } = useResumenKPIs(filtros);

  const handleFiltroChange = (key: string, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
  };

  const formatHoras = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reportes y KPIs</h1>
        <p className="text-muted-foreground mt-2">
          Análisis de performance, tiempos estándar y facturación
        </p>
      </div>

      {/* Filtros */}
      <ReportesFilters
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onLimpiar={handleLimpiarFiltros}
      />

      {/* KPIs Grid */}
      {isLoadingResumen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : resumen ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TTR Promedio */}
            <KPICard
              title="Tiempo de Respuesta Promedio (TTR)"
              value={formatHoras(resumen.promedio_ttr)}
              subtitle="Desde creación hasta inicio de ruta"
              icon={Clock}
              variant="default"
            />

            {/* TTS Promedio */}
            <KPICard
              title="Tiempo de Servicio Promedio (TTS)"
              value={formatHoras(resumen.promedio_tts)}
              subtitle="Tiempo en proceso en terreno"
              icon={Activity}
              variant="default"
            />

            {/* Cumplimiento */}
            <KPICard
              title="Cumplimiento de Estándares"
              value={`${resumen.porcentaje_cumplimiento.toFixed(1)}%`}
              subtitle={`${resumen.cumplimiento_verde} verde, ${resumen.cumplimiento_amarillo} amarillo, ${resumen.cumplimiento_rojo} rojo`}
              icon={Target}
              variant={
                resumen.porcentaje_cumplimiento >= 80 
                  ? 'success' 
                  : resumen.porcentaje_cumplimiento >= 60 
                  ? 'warning' 
                  : 'danger'
              }
            />

            {/* Total OT */}
            <KPICard
              title="Total de Órdenes de Servicio"
              value={resumen.total_ot}
              subtitle="En el período seleccionado"
              icon={BarChart3}
              variant="default"
            />

            {/* Facturación */}
            <KPICard
              title="Facturación Total"
              value={`$${resumen.facturacion_total.toLocaleString('es-CL')}`}
              subtitle="Ingresos del período"
              icon={DollarSign}
              variant="success"
            />

            {/* Margen */}
            <KPICard
              title="Margen de Operación"
              value={`${resumen.margen_porcentaje.toFixed(1)}%`}
              subtitle={`$${resumen.margen_total.toLocaleString('es-CL')} de margen`}
              icon={TrendingUp}
              variant={
                resumen.margen_porcentaje >= 30 
                  ? 'success' 
                  : resumen.margen_porcentaje >= 15 
                  ? 'warning' 
                  : 'danger'
              }
            />
          </div>

          {/* Semáforo de Cumplimiento */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Distribución de Cumplimiento</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Verde (Cumple)</span>
                  <span className="text-sm font-medium">{resumen.cumplimiento_verde} OT</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-success h-3 rounded-full transition-all"
                    style={{ width: `${resumen.total_ot > 0 ? (resumen.cumplimiento_verde / resumen.total_ot) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Amarillo (Tolerancia)</span>
                  <span className="text-sm font-medium">{resumen.cumplimiento_amarillo} OT</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-warning h-3 rounded-full transition-all"
                    style={{ width: `${resumen.total_ot > 0 ? (resumen.cumplimiento_amarillo / resumen.total_ot) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Rojo (Excedido)</span>
                  <span className="text-sm font-medium">{resumen.cumplimiento_rojo} OT</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-destructive h-3 rounded-full transition-all"
                    style={{ width: `${resumen.total_ot > 0 ? (resumen.cumplimiento_rojo / resumen.total_ot) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Tabla de Datos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Detalle de Órdenes de Servicio</h2>
          {kpisData && <ExportButtons data={kpisData} />}
        </div>

        {isLoadingKPIs ? (
          <Skeleton className="h-96 w-full" />
        ) : kpisData ? (
          <ReportesTable data={kpisData} />
        ) : null}
      </div>
    </div>
  );
};

export default Reportes;
