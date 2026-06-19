import { useClienteOrdenes } from "@/hooks/useClienteData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/ordenes/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PortalClienteOrdenes() {
  const navigate = useNavigate();
  const { data: ordenes, isLoading } = useClienteOrdenes();
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");

  const ordenesFiltradas = ordenes?.filter((orden) => {
    const matchBusqueda = orden.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.tipo_trabajo.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchEstado = estadoFiltro === "todos" || orden.estado === estadoFiltro;

    return matchBusqueda && matchEstado;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Órdenes de Servicio</h1>
        <p className="text-muted-foreground mt-2">
          Consulte el estado de sus servicios
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por número, tipo o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_curso">En curso</SelectItem>
            <SelectItem value="en_pausa">En pausa</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de órdenes */}
      {ordenesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No se encontraron órdenes de servicio
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordenesFiltradas.map((orden) => (
            <Card
              key={orden.id}
              className="hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/portal-cliente/ordenes/${orden.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{orden.numero}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {orden.tipo_trabajo}
                    </p>
                  </div>
                  <StatusBadge status={orden.estado} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{orden.descripcion}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{orden.ubicaciones?.alias} - {orden.ubicaciones?.direccion}</span>
                    <span>
                      {orden.fecha_programada_inicio
                        ? format(new Date(orden.fecha_programada_inicio), "d 'de' MMMM, yyyy", { locale: es })
                        : "Sin fecha programada"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {Array.isArray(orden.presupuestos) && orden.presupuestos.some((p: any) => p.estado === "enviado") && (
                      <Badge variant="outline" className="border-warning text-warning">
                        Presupuesto pendiente de aprobación
                      </Badge>
                    )}
                    {Array.isArray(orden.presupuestos) && orden.presupuestos.some((p: any) => p.estado === "aprobado") && (
                      <Badge variant="outline" className="border-success text-success">
                        Presupuesto aprobado
                      </Badge>
                    )}
                    {orden.informes_finales && (
                      <Badge variant="outline" className="border-primary text-primary">
                        Informe disponible
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
