import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCotizaciones, EstadoCotizacion } from "@/hooks/useCotizaciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  FileText, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatCurrency";

const estadoConfig: Record<EstadoCotizacion, { label: string; color: string; icon: any }> = {
  borrador: { label: "Borrador", color: "bg-gray-500", icon: FileText },
  en_revision: { label: "En Revisión", color: "bg-blue-500", icon: Clock },
  aceptada: { label: "Aceptada", color: "bg-green-500", icon: CheckCircle },
  rechazada: { label: "Rechazada", color: "bg-red-500", icon: XCircle },
  asignada_ot: { label: "Asignada a OT", color: "bg-purple-500", icon: ArrowRight },
};

export default function Cotizaciones() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [tabActivo, setTabActivo] = useState<string>("todas");

  const filtroEstado = tabActivo === "todas" ? undefined : tabActivo as EstadoCotizacion;
  const { data: cotizaciones, isLoading } = useCotizaciones({ estado: filtroEstado });

  const cotizacionesFiltradas = cotizaciones?.filter((cot) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    const clienteNombre = cot.cliente?.tipo === 'empresa' 
      ? cot.cliente?.razon_social 
      : `${cot.cliente?.nombres} ${cot.cliente?.apellidos}`;
    return (
      cot.numero.toLowerCase().includes(searchLower) ||
      clienteNombre?.toLowerCase().includes(searchLower) ||
      cot.cliente?.rut?.toLowerCase().includes(searchLower)
    );
  });

  const getClienteNombre = (cot: any) => {
    if (!cot.cliente) return "Sin cliente";
    return cot.cliente.tipo === 'empresa' 
      ? cot.cliente.razon_social 
      : `${cot.cliente.nombres || ''} ${cot.cliente.apellidos || ''}`.trim();
  };

  // Estadísticas
  const stats = {
    total: cotizaciones?.length || 0,
    borrador: cotizaciones?.filter(c => c.estado === 'borrador').length || 0,
    en_revision: cotizaciones?.filter(c => c.estado === 'en_revision').length || 0,
    aceptada: cotizaciones?.filter(c => c.estado === 'aceptada').length || 0,
    rechazada: cotizaciones?.filter(c => c.estado === 'rechazada').length || 0,
    asignada_ot: cotizaciones?.filter(c => c.estado === 'asignada_ot').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona y envía cotizaciones a tus clientes
          </p>
        </div>
        <Button onClick={() => navigate("/cotizaciones/nueva")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{stats.borrador}</div>
            <p className="text-xs text-muted-foreground">Borradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.en_revision}</div>
            <p className="text-xs text-muted-foreground">En Revisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.aceptada}</div>
            <p className="text-xs text-muted-foreground">Aceptadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rechazada}</div>
            <p className="text-xs text-muted-foreground">Rechazadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.asignada_ot}</div>
            <p className="text-xs text-muted-foreground">Asignadas OT</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente o RUT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs & Table */}
      <Tabs value={tabActivo} onValueChange={setTabActivo}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="borrador">Borradores</TabsTrigger>
          <TabsTrigger value="en_revision">En Revisión</TabsTrigger>
          <TabsTrigger value="aceptada">Aceptadas</TabsTrigger>
          <TabsTrigger value="rechazada">Rechazadas</TabsTrigger>
          <TabsTrigger value="asignada_ot">Asignadas OT</TabsTrigger>
        </TabsList>

        <TabsContent value={tabActivo} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">Cargando cotizaciones...</div>
              ) : cotizacionesFiltradas?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No hay cotizaciones que mostrar
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cotizacionesFiltradas?.map((cot) => {
                      const estadoInfo = estadoConfig[cot.estado];
                      const Icon = estadoInfo.icon;
                      const vencida = new Date(cot.fecha_vencimiento) < new Date() && cot.estado === 'en_revision';
                      
                      return (
                        <TableRow key={cot.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{cot.numero}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{getClienteNombre(cot)}</p>
                              <p className="text-xs text-muted-foreground">{cot.cliente?.rut}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(cot.fecha_emision), "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <span className={vencida ? "text-red-500 font-medium" : ""}>
                              {format(new Date(cot.fecha_vencimiento), "dd/MM/yyyy", { locale: es })}
                              {vencida && " (Vencida)"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${estadoInfo.color} text-white`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {estadoInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(cot.total, cot.moneda)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/cotizaciones/${cot.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {cot.estado === 'borrador' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/cotizaciones/${cot.id}/editar`)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
