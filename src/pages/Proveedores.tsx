import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ProveedorCard } from "@/components/proveedores/ProveedorCard";
import { ProveedorCard } from "@/components/proveedores/ProveedorCard";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { OrdenCompraForm } from "@/components/proveedores/OrdenCompraForm";
import { RecibirOrdenCompraDialog } from "@/components/proveedores/RecibirOrdenCompraDialog";
import { ReporteCompras } from "@/components/proveedores/ReporteCompras";
import { useProveedores, useDeleteProveedor, type Proveedor } from "@/hooks/useProveedores";
import { useOrdenesCompra } from "@/hooks/useOrdenesCompra";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Building2,
  Plus,
  Search,
  ShoppingCart,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";

const estadoOrdenLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  borrador: { label: "Borrador", variant: "secondary" },
  enviada: { label: "Enviada", variant: "default" },
  parcial: { label: "Parcial", variant: "outline" },
  completada: { label: "Completada", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

export default function Proveedores() {
  const [proveedorFormOpen, setProveedorFormOpen] = useState(false);
  const [ordenFormOpen, setOrdenFormOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: proveedores = [], isLoading: loadingProveedores } = useProveedores();
  const { data: ordenes = [], isLoading: loadingOrdenes } = useOrdenesCompra();
  const deleteProveedor = useDeleteProveedor();

  const activeProveedores = proveedores.filter((p) => p.activo);
  const filteredProveedores = activeProveedores.filter(
    (p) =>
      p.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditProveedor = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setProveedorFormOpen(true);
  };

  const handleCloseProveedorForm = (open: boolean) => {
    setProveedorFormOpen(open);
    if (!open) setEditingProveedor(undefined);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProveedor.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "completada":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelada":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "enviada":
      case "parcial":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestión de proveedores y órdenes de compra
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOrdenFormOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nueva Orden de Compra
          </Button>
          <Button onClick={() => setProveedorFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Proveedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{activeProveedores.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Órdenes Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {ordenes.filter((o) => o.estado === "enviada" || o.estado === "parcial").length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Órdenes Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {ordenes.filter((o) => o.estado === "completada").length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Compras (Mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {formatCurrency(
                  ordenes
                    .filter((o) => o.estado === "completada")
                    .reduce((acc, o) => acc + o.total, 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proveedores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes de Compra</TabsTrigger>
          <TabsTrigger value="reportes" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proveedores">
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingProveedores ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : filteredProveedores.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2" />
                  <p>No se encontraron proveedores</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProveedores.map((proveedor) => (
                  <ProveedorCard
                    key={proveedor.id}
                    proveedor={proveedor}
                    onEdit={() => handleEditProveedor(proveedor)}
                    onDelete={() => setDeleteId(proveedor.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ordenes">
          {loadingOrdenes ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : ordenes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                <p>No hay órdenes de compra</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ordenes.map((orden) => {
                const estadoInfo = estadoOrdenLabels[orden.estado] || { label: orden.estado, variant: "secondary" as const };
                return (
                  <Card key={orden.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getEstadoIcon(orden.estado)}
                          <div>
                            <p className="font-medium font-mono">{orden.numero}</p>
                            <p className="text-sm text-muted-foreground">
                              {orden.proveedor?.razon_social || "Proveedor desconocido"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                          <div className="text-right">
                            <p className="font-mono font-medium">
                              {formatCurrency(orden.total)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(orden.fecha_emision), "dd/MM/yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reportes">
          <ReporteCompras />
        </TabsContent>
      </Tabs>

      <ProveedorForm
        open={proveedorFormOpen}
        onOpenChange={handleCloseProveedorForm}
        proveedor={editingProveedor}
      />

      <OrdenCompraForm
        open={ordenFormOpen}
        onOpenChange={setOrdenFormOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el proveedor. Podrás reactivarlo más tarde si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
