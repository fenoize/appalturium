import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  trend 
}: KPICardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
      variant === 'success' && "border-success",
      variant === 'warning' && "border-warning",
      variant === 'danger' && "border-destructive"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center space-x-1 mt-2">
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-xs text-muted-foreground">vs período anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center ml-4",
            variant === 'success' && "bg-success/10",
            variant === 'warning' && "bg-warning/10",
            variant === 'danger' && "bg-destructive/10",
            variant === 'default' && "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              variant === 'success' && "text-success",
              variant === 'warning' && "text-warning",
              variant === 'danger' && "text-destructive",
              variant === 'default' && "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
