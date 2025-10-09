import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { PresupuestoItem } from "@/hooks/usePresupuestos";

interface PresupuestoFormProps {
  initialItems?: PresupuestoItem[];
  initialManoObra?: number;
  initialInsumos?: number;
  onSubmit: (data: {
    items: PresupuestoItem[];
    mano_obra: number;
    insumos: number;
    subtotal: number;
    impuestos: number;
    total: number;
  }) => void;
  disabled?: boolean;
}

const TASA_IVA = 0.19; // 19% IVA

export function PresupuestoForm({
  initialItems = [],
  initialManoObra = 0,
  initialInsumos = 0,
  onSubmit,
  disabled = false,
}: PresupuestoFormProps) {
  const [items, setItems] = useState<PresupuestoItem[]>(
    initialItems.length > 0 ? initialItems : [{ concepto: "", cantidad: 1, precio_unit: 0, subtotal: 0 }]
  );
  const [manoObra, setManoObra] = useState(initialManoObra);
  const [insumos, setInsumos] = useState(initialInsumos);

  // Calcular subtotal de un item
  const calcularSubtotalItem = (cantidad: number, precioUnit: number) => {
    return cantidad * precioUnit;
  };

  // Actualizar item
  const actualizarItem = (index: number, campo: keyof PresupuestoItem, valor: any) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
    
    if (campo === "cantidad" || campo === "precio_unit") {
      nuevosItems[index].subtotal = calcularSubtotalItem(
        nuevosItems[index].cantidad,
        nuevosItems[index].precio_unit
      );
    }
    
    setItems(nuevosItems);
  };

  // Agregar item
  const agregarItem = () => {
    setItems([...items, { concepto: "", cantidad: 1, precio_unit: 0, subtotal: 0 }]);
  };

  // Eliminar item
  const eliminarItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calcular totales
  const subtotalItems = items.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotal = subtotalItems + manoObra + insumos;
  const impuestos = subtotal * TASA_IVA;
  const total = subtotal + impuestos;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      items,
      mano_obra: manoObra,
      insumos,
      subtotal,
      impuestos,
      total,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold">Items del Presupuesto</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarItem}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Item
          </Button>
        </div>

        {items.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-5">
                <Label>Concepto</Label>
                <Input
                  value={item.concepto}
                  onChange={(e) => actualizarItem(index, "concepto", e.target.value)}
                  placeholder="Descripción del item"
                  disabled={disabled}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(index, "cantidad", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Precio Unit.</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precio_unit}
                  onChange={(e) => actualizarItem(index, "precio_unit", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Subtotal</Label>
                <Input
                  type="number"
                  value={item.subtotal.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => eliminarItem(index)}
                  disabled={disabled || items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mano de Obra e Insumos */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Mano de Obra</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={manoObra}
            onChange={(e) => setManoObra(parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
        <div>
          <Label>Insumos</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={insumos}
            onChange={(e) => setInsumos(parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Resumen */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal Items:</span>
            <span className="font-medium">${subtotalItems.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (19%):</span>
            <span className="font-medium">${impuestos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <Button type="submit" className="w-full" disabled={disabled}>
        Guardar Presupuesto
      </Button>
    </form>
  );
}
