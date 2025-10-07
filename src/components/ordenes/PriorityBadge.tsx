import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronUp, CircleDot, AlertTriangle } from "lucide-react";

interface PriorityBadgeProps {
  priority: "baja" | "media" | "alta" | "urgente";
}

const priorityConfig = {
  baja: {
    label: "Baja",
    color: "hsl(var(--muted-foreground))",
    Icon: CircleDot,
  },
  media: {
    label: "Media",
    color: "hsl(var(--primary))",
    Icon: AlertCircle,
  },
  alta: {
    label: "Alta",
    color: "hsl(var(--warning))",
    Icon: ChevronUp,
  },
  urgente: {
    label: "Urgente",
    color: "hsl(var(--destructive))",
    Icon: AlertTriangle,
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.Icon;

  return (
    <Badge 
      variant="outline" 
      className="font-medium gap-1"
      style={{ 
        borderColor: config.color,
        color: config.color,
      }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
