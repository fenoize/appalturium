import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MessageCircle, FileText, CheckCircle, Clock } from "lucide-react";
import { Comunicacion } from "@/hooks/useComunicaciones";

interface ComunicacionItemProps {
  comunicacion: Comunicacion;
  onMarcarResuelto?: (id: string) => void;
}

const canalConfig = {
  email: { icon: Mail, label: "Email", color: "bg-blue-500/10 text-blue-500" },
  telefono: { icon: Phone, label: "Teléfono", color: "bg-green-500/10 text-green-500" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "bg-emerald-500/10 text-emerald-500" },
  nota: { icon: FileText, label: "Nota", color: "bg-gray-500/10 text-gray-500" },
};

export function ComunicacionItem({ comunicacion, onMarcarResuelto }: ComunicacionItemProps) {
  const config = canalConfig[comunicacion.canal];
  const Icon = config.icon;

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-full ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  {comunicacion.estatus === "pendiente" ? (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resuelto
                    </Badge>
                  )}
                  {comunicacion.requiere_respuesta && (
                    <Badge variant="destructive" className="text-xs">
                      Requiere respuesta
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">
                  Destinatario: {comunicacion.destinatario}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(comunicacion.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
              {comunicacion.estatus === "pendiente" && onMarcarResuelto && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarcarResuelto(comunicacion.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar resuelto
                </Button>
              )}
            </div>

            <p className="text-sm">{comunicacion.resumen}</p>

            {comunicacion.adjuntos && comunicacion.adjuntos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {comunicacion.adjuntos.map((adjunto: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    📎 {adjunto.nombre || `Adjunto ${index + 1}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
