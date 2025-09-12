import { Plus, FileText, Users, Package, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Nuevo Cliente",
    description: "Registrar nuevo cliente",
    icon: Users,
    action: "/clientes/nuevo",
    color: "primary"
  },
  {
    title: "Nuevo Proyecto",
    description: "Crear proyecto de instalación",
    icon: Package,
    action: "/proyectos/nuevo",
    color: "accent"
  },
  {
    title: "Nuevo Contrato",
    description: "Generar contrato de servicio",
    icon: FileText,
    action: "/contratos/nuevo",
    color: "warning"
  },
  {
    title: "Programar Tarea",
    description: "Agendar mantención o instalación",
    icon: Calendar,
    action: "/tareas/nueva",
    color: "success"
  }
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5 text-primary" />
          <span>Acciones Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="ghost"
              className="w-full justify-start h-auto p-4 hover:bg-muted/50 transition-all duration-200"
              onClick={() => {
                // TODO: Navigate to action.action
                console.log('Navigate to:', action.action);
              }}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}