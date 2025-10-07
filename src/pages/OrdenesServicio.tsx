import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ordenes/StatusBadge";
import { PriorityBadge } from "@/components/ordenes/PriorityBadge";
import { useParametrosSistema } from "@/hooks/useParametrosSistema";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar,
  MapPin,
  User,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrdenesServicio() {
  const [filtros, setFiltros] = useState({
    estado: "",
    prioridad: "",
    busqueda: "",
  });

  const { data: ordenes, isLoading } = useOrdenesServicio(filtros);
  const { data: estados } = useParametrosSistema("service_statuses");

  const handleFiltroChange = (key: string, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const getNombreCliente = (orden: any) => {
    if (orden.clientes?.razon_social) {
      return orden.clientes.razon_social;
    }
    if (orden.clientes?.nombres && orden.clientes?.apellidos) {
      return `${orden.clientes.nombres} ${orden.clientes.apellidos}`;
    }
    return "Cliente sin nombre";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Órdenes de Servicio</h1>
              <p className="text-primary-foreground/80">
                Gestión de órdenes de trabajo y servicios
              </p>
            </div>
          </div>
          <Link to="/ordenes-servicio/nueva">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <Plus className="h-5 w-5 mr-2" />
              Nueva OT
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o descripción..."
                className="pl-9"
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
              />
            </div>
            
            <Select
              value={filtros.estado}
              onValueChange={(value) => handleFiltroChange("estado", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                {estados?.map((estado) => (
                  <SelectItem key={estado.key} value={estado.key}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filtros.prioridad}
              onValueChange={(value) => handleFiltroChange("prioridad", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las prioridades</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFiltros({ estado: "", prioridad: "", busqueda: "" })}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de OT */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Cargando órdenes de servicio...</p>
            </CardContent>
          </Card>
        ) : ordenes && ordenes.length > 0 ? (
          ordenes.map((orden) => (
            <Card key={orden.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">{orden.numero}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {orden.descripcion}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={orden.estado} />
                    <PriorityBadge priority={orden.prioridad} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getNombreCliente(orden)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{orden.ubicaciones?.alias || "Sin ubicación"}</span>
                  </div>
                  {orden.fecha_programada_inicio && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(orden.fecha_programada_inicio), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Link to={`/ordenes-servicio/${orden.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay órdenes de servicio</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera orden de servicio
              </p>
              <Link to="/ordenes-servicio/nueva">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva OT
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
