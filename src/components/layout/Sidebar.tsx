import { NavLink, useLocation } from "react-router-dom";
import { 
  Building2, 
  Package, 
  Truck, 
  FileText, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  ClipboardList,
  MapPin,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigationItems = [
  { 
    title: "Dashboard", 
    icon: BarChart3, 
    href: "/" 
  },
  { 
    title: "Clientes", 
    icon: Building2, 
    href: "/clientes" 
  },
  { 
    title: "Órdenes de Servicio", 
    icon: ClipboardList, 
    href: "/ordenes-servicio" 
  },
  { 
    title: "Calendario", 
    icon: Calendar, 
    href: "/calendario" 
  },
  { 
    title: "Geolocalización", 
    icon: MapPin, 
    href: "/geolocalizacion" 
  },
  { 
    title: "Reportes y KPIs", 
    icon: TrendingUp, 
    href: "/reportes" 
  },
  { 
    title: "Inventario", 
    icon: Package, 
    href: "/inventario" 
  },
  { 
    title: "Proveedores", 
    icon: Truck, 
    href: "/proveedores" 
  },
  { 
    title: "Contratos", 
    icon: FileText, 
    href: "/contratos" 
  },
  { 
    title: "Empleados", 
    icon: Users, 
    href: "/empleados" 
  },
  { 
    title: "Proyectos", 
    icon: FolderKanban, 
    href: "/proyectos" 
  },
  { 
    title: "Tareas", 
    icon: CheckSquare, 
    href: "/tareas" 
  },
  { 
    title: "Gantt", 
    icon: Calendar, 
    href: "/gantt" 
  },
  { 
    title: "Finanzas", 
    icon: DollarSign, 
    href: "/finanzas" 
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={cn(
      "flex flex-col bg-gradient-card border-r border-border transition-all duration-300 ease-smooth",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ALTURIUM</h1>
              <p className="text-xs text-muted-foreground">Sistema Logístico</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="hover:bg-muted"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-muted/50 hover:scale-[1.02] group",
                active && "bg-gradient-primary text-primary-foreground shadow-smooth-md",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <span className={cn(
                  "font-medium transition-colors",
                  active ? "text-primary-foreground" : "text-foreground"
                )}>
                  {item.title}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <NavLink
          to="/configuracion"
          className={cn(
            "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-muted/50 hover:scale-[1.02] group",
            isActive("/configuracion") && "bg-gradient-primary text-primary-foreground shadow-smooth-md",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <Settings className={cn(
            "w-5 h-5 transition-colors",
            isActive("/configuracion") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
          )} />
          {!collapsed && (
            <span className={cn(
              "font-medium transition-colors",
              isActive("/configuracion") ? "text-primary-foreground" : "text-foreground"
            )}>
              Configuración
            </span>
          )}
        </NavLink>
      </div>
    </div>
  );
}