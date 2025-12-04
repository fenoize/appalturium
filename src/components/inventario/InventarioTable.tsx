import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Edit, Trash2, Package, ArrowUpDown, AlertTriangle, Search } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { useDeleteItem, type ItemInventario } from "@/hooks/useInventario";
import { MovimientoDialog } from "./MovimientoDialog";

interface InventarioTableProps {
  items: ItemInventario[];
  onEdit: (item: ItemInventario) => void;
}

export function InventarioTable({ items, onEdit }: InventarioTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [movimientoItem, setMovimientoItem] = useState<ItemInventario | null>(null);
  const deleteItem = useDeleteItem();

  const filteredItems = items.filter(
    (item) =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStockStatus = (item: ItemInventario) => {
    if (item.stock_actual <= 0) {
      return { label: "Sin stock", variant: "destructive" as const };
    }
    if (item.stock_actual <= item.stock_minimo) {
      return { label: "Stock bajo", variant: "secondary" as const };
    }
    return { label: "En stock", variant: "default" as const };
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      material: "Material",
      producto: "Producto",
      servicio: "Servicio",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">P. Compra</TableHead>
              <TableHead className="text-right">P. Venta</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" />
                    <span>No se encontraron items</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.codigo}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.nombre}</span>
                        {item.proveedor && (
                          <p className="text-xs text-muted-foreground">
                            {item.proveedor.razon_social}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTipoLabel(item.tipo)}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.categoria && (
                        <Badge
                          style={{ backgroundColor: item.categoria.color }}
                          className="text-white"
                        >
                          {item.categoria.nombre}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.precio_compra)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.precio_venta)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.stock_actual <= item.stock_minimo && item.tipo !== "servicio" && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        <span className="font-mono">
                          {item.stock_actual} {item.unidad_medida}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.tipo !== "servicio" && (
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {item.tipo !== "servicio" && (
                            <DropdownMenuItem onClick={() => setMovimientoItem(item)}>
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Registrar Movimiento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el item del inventario. Podrás reactivarlo más tarde si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {movimientoItem && (
        <MovimientoDialog
          open={!!movimientoItem}
          onOpenChange={() => setMovimientoItem(null)}
          item={movimientoItem}
        />
      )}
    </div>
  );
}
