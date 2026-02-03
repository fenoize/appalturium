import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InventarioTable } from "@/components/inventario/InventarioTable";
import { InventarioForm } from "@/components/inventario/InventarioForm";
import { ReporteMovimientos } from "@/components/inventario/ReporteMovimientos";
import { EquipoCard } from "@/components/equipos/EquipoCard";
import { useInventario, useCategorias, useMovimientos, type ItemInventario } from "@/hooks/useInventario";
import { useEquipos } from "@/hooks/useEquipos";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Box,
  BarChart3,
  HardDrive,
  QrCode,
} from "lucide-react";

export default function Inventario() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInventario | undefined>();

  const { data: items = [], isLoading } = useInventario();
  const { data: categorias = [] } = useCategorias();
  const { data: movimientos = [] } = useMovimientos();
  const { data: equipos = [], isLoading: loadingEquipos } = useEquipos();

  const activeItems = items.filter((i) => i.activo);
  const itemsBajoStock = activeItems.filter(
    (i) => i.tipo !== "servicio" && i.stock_actual <= i.stock_minimo
  );
  const valorInventario = activeItems.reduce(
    (acc, item) => acc + item.stock_actual * item.precio_compra,
    0
  );

  const handleEdit = (item: ItemInventario) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingItem(undefined);
  };

  const getTipoMovimientoIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "salida":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTipoMovimientoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      entrada: "Entrada",
      salida: "Salida",
      ajuste: "Ajuste",
      transferencia: "Transferencia",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">
            Gestión de stock, materiales y productos
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Item
        </Button>
      </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{activeItems.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Stock Bajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="text-2xl font-bold">{itemsBajoStock.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Valor Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">
                      {formatCurrency(valorInventario)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categorías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {categorias.slice(0, 3).map((cat) => (
                      <Badge
                        key={cat.id}
                        style={{ backgroundColor: cat.color }}
                        className="text-white text-xs"
                      >
                        {cat.nombre}
                      </Badge>
                    ))}
                    {categorias.length > 3 && (
                      <Badge variant="secondary">+{categorias.length - 3}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="items" className="space-y-4">
              <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="equipos" className="gap-2">
                  <HardDrive className="h-4 w-4" />
                  Equipos
                </TabsTrigger>
                <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                <TabsTrigger value="bajo-stock">Stock Bajo</TabsTrigger>
                <TabsTrigger value="reportes" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reportes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <InventarioTable items={activeItems} onEdit={handleEdit} />
                )}
              </TabsContent>

              <TabsContent value="equipos">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Equipos con Ficha Técnica</h3>
                      <Badge variant="secondary">{equipos.length}</Badge>
                    </div>
                    <Button asChild>
                      <Link to="/inventario/equipos/nuevo">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Equipo
                      </Link>
                    </Button>
                  </div>

                  {loadingEquipos ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                      ))}
                    </div>
                  ) : equipos.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <HardDrive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No hay equipos registrados</h3>
                        <p className="text-muted-foreground mb-4">
                          Los equipos tienen ficha técnica con historial de movimientos e intervenciones
                        </p>
                        <Button asChild>
                          <Link to="/inventario/equipos/nuevo">
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Primer Equipo
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {equipos.map((equipo) => (
                        <EquipoCard key={equipo.id} equipo={equipo} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="movimientos">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Movimientos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {movimientos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ArrowUpDown className="h-8 w-8 mx-auto mb-2" />
                        <p>No hay movimientos registrados</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {movimientos.slice(0, 20).map((mov) => (
                          <div
                            key={mov.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getTipoMovimientoIcon(mov.tipo)}
                              <div>
                                <p className="font-medium">
                                  {mov.item?.nombre || "Item eliminado"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {mov.item?.codigo} • {getTipoMovimientoLabel(mov.tipo)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono">
                                {mov.tipo === "entrada" ? "+" : mov.tipo === "salida" ? "-" : ""}
                                {mov.cantidad}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bajo-stock">
                {itemsBajoStock.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p>No hay items con stock bajo</p>
                    </CardContent>
                  </Card>
                ) : (
                  <InventarioTable items={itemsBajoStock} onEdit={handleEdit} />
                )}
              </TabsContent>

              <TabsContent value="reportes">
                <ReporteMovimientos />
              </TabsContent>
            </Tabs>

      <InventarioForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        item={editingItem}
      />
    </div>
  );
}
