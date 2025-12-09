import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Wrench, Grid, List } from "lucide-react";
import { useServicios, useCrearServicio, useActualizarServicio, useEliminarServicio } from "@/hooks/useServicios";
import type { Servicio, ServicioInput } from "@/hooks/useServicios";
import { ServicioCard } from "@/components/servicios/ServicioCard";
import { ServicioForm } from "@/components/servicios/ServicioForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatCurrency";

const estadoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  activo: { label: "Activo", variant: "default" },
  pausado: { label: "Pausado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  finalizado: { label: "Finalizado", variant: "outline" },
};

const tipoLabels: Record<string, string> = {
  mantencion: "Mantención",
  consultoria: "Consultoría",
  soporte: "Soporte",
  desarrollo: "Desarrollo",
  instalacion: "Instalación",
  capacitacion: "Capacitación",
  otro: "Otro",
};

export default function Servicios() {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: servicios, isLoading } = useServicios();
  const crearServicio = useCrearServicio();
  const actualizarServicio = useActualizarServicio();
  const eliminarServicio = useEliminarServicio();

  const serviciosFiltrados = servicios?.filter((s) => {
    const matchSearch =
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.codigo.toLowerCase().includes(search.toLowerCase()) ||
      s.proveedor?.razon_social?.toLowerCase().includes(search.toLowerCase()) ||
      s.proyecto?.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === "todos" || s.estado === filterEstado;
    const matchTipo = filterTipo === "todos" || s.tipo === filterTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  const handleCreate = (data: ServicioInput) => {
    crearServicio.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleUpdate = (data: ServicioInput) => {
    if (!editingServicio) return;
    actualizarServicio.mutate(
      { id: editingServicio.id, ...data },
      { onSuccess: () => setEditingServicio(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    eliminarServicio.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Servicios
          </h1>
          <p className="text-muted-foreground">
            Gestiona servicios contratados y vinculados con proveedores y proyectos
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código, proveedor o proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="mantencion">Mantención</SelectItem>
            <SelectItem value="consultoria">Consultoría</SelectItem>
            <SelectItem value="soporte">Soporte</SelectItem>
            <SelectItem value="desarrollo">Desarrollo</SelectItem>
            <SelectItem value="instalacion">Instalación</SelectItem>
            <SelectItem value="capacitacion">Capacitación</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Servicios</p>
          <p className="text-2xl font-bold">{servicios?.length || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {servicios?.filter((s) => s.estado === "activo").length || 0}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pausados</p>
          <p className="text-2xl font-bold text-yellow-600">
            {servicios?.filter((s) => s.estado === "pausado").length || 0}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Con Proveedor</p>
          <p className="text-2xl font-bold text-blue-600">
            {servicios?.filter((s) => s.proveedor_id).length || 0}
          </p>
        </div>
      </div>

      {/* Content */}
      {!serviciosFiltrados?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron servicios
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviciosFiltrados.map((servicio) => (
            <ServicioCard
              key={servicio.id}
              servicio={servicio}
              onEdit={setEditingServicio}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviciosFiltrados.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell className="font-mono text-sm">{servicio.codigo}</TableCell>
                  <TableCell className="font-medium">{servicio.nombre}</TableCell>
                  <TableCell>{tipoLabels[servicio.tipo]}</TableCell>
                  <TableCell>
                    {servicio.proveedor
                      ? servicio.proveedor.nombre_fantasia || servicio.proveedor.razon_social
                      : "-"}
                  </TableCell>
                  <TableCell>{servicio.proyecto?.nombre || "-"}</TableCell>
                  <TableCell>
                    {servicio.monto_base > 0
                      ? formatCurrency(servicio.monto_base, servicio.moneda)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoConfig[servicio.estado]?.variant || "outline"}>
                      {estadoConfig[servicio.estado]?.label || servicio.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingServicio(servicio)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteId(servicio.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <ServicioForm
        open={formOpen || !!editingServicio}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingServicio(null);
          }
        }}
        onSubmit={editingServicio ? handleUpdate : handleCreate}
        servicio={editingServicio}
        isLoading={crearServicio.isPending || actualizarServicio.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el servicio como inactivo. No se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
