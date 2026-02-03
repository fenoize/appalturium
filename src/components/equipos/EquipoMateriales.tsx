import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Package, Trash2, Loader2 } from "lucide-react";
import {
  useEquipoMateriales,
  useAddMaterialEquipo,
  useRemoveMaterialEquipo,
} from "@/hooks/useEquipos";
import { useInventario } from "@/hooks/useInventario";
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

interface EquipoMaterialesProps {
  equipoId: string;
}

export function EquipoMateriales({ equipoId }: EquipoMaterialesProps) {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [itemId, setItemId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [notas, setNotas] = useState("");

  const { data: materiales, isLoading } = useEquipoMateriales(equipoId);
  const { data: inventario } = useInventario();
  const addMaterial = useAddMaterialEquipo();
  const removeMaterial = useRemoveMaterialEquipo();

  // Filtrar solo materiales y productos del inventario
  const itemsDisponibles = inventario?.filter(
    (item) => item.tipo === "material" || item.tipo === "producto"
  ) || [];

  const handleSubmit = async () => {
    if (!itemId) return;

    await addMaterial.mutateAsync({
      equipo_id: equipoId,
      item_inventario_id: itemId,
      cantidad: parseFloat(cantidad) || 1,
      notas: notas || null,
      fecha_asociacion: new Date().toISOString(),
      activo: true,
    });

    setOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await removeMaterial.mutateAsync({ id: deleteId, equipo_id: equipoId });
    setDeleteId(null);
  };

  const resetForm = () => {
    setItemId("");
    setCantidad("1");
    setNotas("");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiales Asociados (Pack)
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Material al Equipo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Material / Producto *</Label>
                  <Select value={itemId} onValueChange={setItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar del inventario" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemsDisponibles.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.codigo} - {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observaciones sobre este material..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!itemId || addMaterial.isPending}
                  >
                    {addMaterial.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Agregar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : materiales && materiales.length > 0 ? (
            <div className="space-y-2">
              {materiales.map((mat) => (
                <div
                  key={mat.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mat.item?.nombre}</span>
                      <span className="text-sm text-muted-foreground">
                        ({mat.item?.codigo})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {mat.cantidad} {mat.item?.unidad_medida}
                    </p>
                    {mat.notas && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {mat.notas}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(mat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay materiales asociados a este equipo
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover material?</AlertDialogTitle>
            <AlertDialogDescription>
              El material será removido del pack de este equipo. Esta acción no afecta el inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
