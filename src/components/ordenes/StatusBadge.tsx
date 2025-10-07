import { Badge } from "@/components/ui/badge";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { data: statuses } = useParametrosSistema("service_statuses");
  
  const statusData = statuses?.find(s => s.key === status);
  
  if (!statusData) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return (
    <Badge 
      variant="outline" 
      className="font-medium"
      style={{ 
        borderColor: statusData.color,
        color: statusData.color,
      }}
    >
      {statusData.label}
    </Badge>
  );
}
