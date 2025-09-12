import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: LucideIcon;
  gradient?: boolean;
}

export function MetricCard({ title, value, change, icon: Icon, gradient = false }: MetricCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-smooth-lg hover:scale-[1.02]",
      gradient && "bg-gradient-card"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <div className="flex items-center space-x-1">
                <span className={cn(
                  "text-sm font-medium",
                  change.type === 'increase' && "text-success",
                  change.type === 'decrease' && "text-destructive",
                  change.type === 'neutral' && "text-muted-foreground"
                )}>
                  {change.type === 'increase' && '+'}
                  {change.value}
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            gradient ? "bg-gradient-primary" : "bg-muted"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              gradient ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}