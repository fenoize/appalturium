import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/formatCurrency";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Package, 
  FileText, 
  DollarSign,
  TrendingUp,
  Users,
  Wrench,
  Calendar
} from "lucide-react";

const Index = () => {
  const { data: metrics, isLoading } = useDashboardData();

  const calcularCambio = (actual: number, anterior: number): { value: string; type: 'increase' | 'decrease' | 'neutral' } => {
    if (anterior === 0) return { value: "0%", type: "neutral" };
    const diff = ((actual - anterior) / anterior) * 100;
    return {
      value: `${Math.abs(Math.round(diff))}%`,
      type: diff > 0 ? "increase" : diff < 0 ? "decrease" : "neutral"
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
          <h1 className="text-3xl font-bold mb-2">¡Bienvenido al Sistema ALTURIUM!</h1>
          <p className="text-primary-foreground/80">
            Gestiona eficientemente tu negocio de climatización y energía fotovoltaica
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido al Sistema ALTURIUM!</h1>
        <p className="text-primary-foreground/80">
          Gestiona eficientemente tu negocio de climatización y energía fotovoltaica
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Clientes Activos"
          value={metrics?.clientesActivos.toLocaleString() || "0"}
          change={calcularCambio(metrics?.clientesActivos || 0, metrics?.clientesAnterior || 0)}
          icon={Building2}
          gradient
        />
        <MetricCard
          title="Proyectos en Curso"
          value={metrics?.proyectosEnCurso.toString() || "0"}
          change={calcularCambio(metrics?.proyectosEnCurso || 0, metrics?.proyectosAnterior || 0)}
          icon={FileText}
        />
        <MetricCard
          title="Inventario Total"
          value={formatCurrency(metrics?.inventarioTotal || 0)}
          icon={Package}
        />
        <MetricCard
          title="Ingresos del Mes"
          value={formatCurrency(metrics?.ingresosMes || 0)}
          change={calcularCambio(metrics?.ingresosMes || 0, metrics?.ingresosAnterior || 0)}
          icon={DollarSign}
          gradient
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Empleados"
          value={metrics?.empleados.toString() || "0"}
          icon={Users}
        />
        <MetricCard
          title="Mantenciones Mes"
          value={metrics?.mantencionesMes.toString() || "0"}
          change={{
            value: ((metrics?.mantencionesMes || 0) - (metrics?.mantencionesAnterior || 0)).toString(),
            type: (metrics?.mantencionesMes || 0) >= (metrics?.mantencionesAnterior || 0) ? "increase" : "decrease"
          }}
          icon={Wrench}
        />
        <MetricCard
          title="Tareas Pendientes"
          value={metrics?.tareasPendientes.toString() || "0"}
          icon={Calendar}
        />
        <MetricCard
          title="Eficiencia"
          value={`${metrics?.eficiencia || 0}%`}
          change={calcularCambio(metrics?.eficiencia || 0, metrics?.eficienciaAnterior || 0)}
          icon={TrendingUp}
        />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Index;
