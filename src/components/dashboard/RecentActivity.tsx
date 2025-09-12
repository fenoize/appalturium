import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentActivities = [
  {
    id: 1,
    type: "contract",
    title: "Contrato firmado - Hotel Plaza",
    description: "Sistema de climatización para 50 habitaciones",
    time: "Hace 2 horas",
    status: "completed",
    icon: CheckCircle
  },
  {
    id: 2,
    type: "project",
    title: "Instalación programada",
    description: "Paneles solares - Edificio Comercial Norte",
    time: "Hace 4 horas",
    status: "scheduled",
    icon: Calendar
  },
  {
    id: 3,
    type: "maintenance",
    title: "Mantención pendiente",
    description: "Revisión trimestral - Centro Comercial Sur",
    time: "Hace 6 horas",
    status: "pending",
    icon: AlertCircle
  },
  {
    id: 4,
    type: "inventory",
    title: "Stock bajo - Bombas de calor",
    description: "Quedan 3 unidades en inventario",
    time: "Hace 8 horas",
    status: "warning",
    icon: AlertCircle
  }
];

const statusConfig = {
  completed: { color: "success", label: "Completado" },
  scheduled: { color: "primary", label: "Programado" },
  pending: { color: "warning", label: "Pendiente" },
  warning: { color: "destructive", label: "Atención" }
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentActivities.map((activity) => {
          const Icon = activity.icon;
          const status = statusConfig[activity.status as keyof typeof statusConfig];
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground truncate">{activity.title}</p>
                  <Badge variant={status.color as any} className="ml-2">
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}