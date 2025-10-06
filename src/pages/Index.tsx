import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
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
              value="1,234"
              change={{ value: "12%", type: "increase" }}
              icon={Building2}
              gradient
            />
            <MetricCard
              title="Proyectos en Curso"
              value="45"
              change={{ value: "8%", type: "increase" }}
              icon={FileText}
            />
            <MetricCard
              title="Inventario Total"
              value="$2.4M"
              change={{ value: "3%", type: "decrease" }}
              icon={Package}
            />
            <MetricCard
              title="Ingresos del Mes"
              value="$450K"
              change={{ value: "15%", type: "increase" }}
              icon={DollarSign}
              gradient
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Empleados"
              value="32"
              icon={Users}
            />
            <MetricCard
              title="Mantenciones Mes"
              value="18"
              change={{ value: "2", type: "increase" }}
              icon={Wrench}
            />
            <MetricCard
              title="Tareas Pendientes"
              value="7"
              icon={Calendar}
            />
            <MetricCard
              title="Eficiencia"
              value="94%"
              change={{ value: "2%", type: "increase" }}
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
