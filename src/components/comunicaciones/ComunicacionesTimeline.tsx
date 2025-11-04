import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MessageSquare, Filter } from "lucide-react";
import { useComunicaciones, useCrearComunicacion, useMarcarComoResuelto } from "@/hooks/useComunicaciones";
import { ComunicacionItem } from "./ComunicacionItem";
import { RegistrarComunicacionDialog } from "./RegistrarComunicacionDialog";

interface ComunicacionesTimelineProps {
  otId: string;
}

export function ComunicacionesTimeline({ otId }: ComunicacionesTimelineProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [canalFiltro, setCanalFiltro] = useState<string>("todos");
  const [estatusFiltro, setEstatusFiltro] = useState<string>("todos");

  const { data: comunicaciones = [], isLoading } = useComunicaciones({
    otId,
    canal: canalFiltro === "todos" ? undefined : canalFiltro as any,
    estatus: estatusFiltro === "todos" ? undefined : estatusFiltro as any,
  });

  const crearComunicacion = useCrearComunicacion();
  const marcarResuelto = useMarcarComoResuelto();

  const handleCrear = (data: any) => {
    crearComunicacion.mutate(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const pendientesCount = comunicaciones.filter(c => c.estatus === "pendiente").length;

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Centro de Comunicaciones
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Historial de interacciones y seguimiento
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Comunicación
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <Select value={canalFiltro} onValueChange={setCanalFiltro}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos los canales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los canales</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="telefono">Teléfono</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="nota">Notas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estatusFiltro} onValueChange={setEstatusFiltro}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="resuelto">Resueltos</SelectItem>
              </SelectContent>
            </Select>
            {pendientesCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse flex gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comunicaciones.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay comunicaciones registradas para esta orden
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primera Comunicación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comunicaciones.map((comunicacion) => (
            <ComunicacionItem
              key={comunicacion.id}
              comunicacion={comunicacion}
              onMarcarResuelto={(id) => marcarResuelto.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Dialog para registrar */}
      <RegistrarComunicacionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        otId={otId}
        onSubmit={handleCrear}
      />
    </div>
  );
}
