import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  useEquipoMovimientos,
  useCreateMovimientoEquipo,
  useUpdateEquipo,
  tipoMovimientoLabels,
  type EquipoMovimiento,
} from "@/hooks/useEquipos";
import { usePersonal } from "@/hooks/usePersonal";
import { supabase } from "@/integrations/supabase/client";

interface EquipoMovimientosProps {
  equipoId: string;
  estadoActual: string;
  ubicacionActual?: string | null;
}

export function EquipoMovimientos({ equipoId, estadoActual, ubicacionActual }: EquipoMovimientosProps) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const [ubicacionDestino, setUbicacionDestino] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [notas, setNotas] = useState("");

  const { data: movimientos, isLoading } = useEquipoMovimientos(equipoId);
  const { data: personal } = usePersonal();
  const createMovimiento = useCreateMovimientoEquipo();
  const updateEquipo = useUpdateEquipo();

  const tecnicos = personal?.filter((p) => p.activo) || [];

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await createMovimiento.mutateAsync({
      equipo_id: equipoId,
      tipo,
      fecha: new Date().toISOString(),
      ubicacion_origen: ubicacionActual || null,
      ubicacion_destino: ubicacionDestino || null,
      tecnico_id: tecnicoId || null,
      cliente_id: null,
      ot_id: null,
      notas: notas || null,
      registrado_por: user.id,
    });

    // Actualizar estado del equipo según el tipo de movimiento
    let nuevoEstado = estadoActual;
    if (tipo === "asignacion_tecnico") {
      nuevoEstado = "asignado_tecnico";
    } else if (tipo === "almacenamiento") {
      nuevoEstado = "en_bodega";
    }

    await updateEquipo.mutateAsync({
      id: equipoId,
      estado: nuevoEstado as any,
      ubicacion_actual: ubicacionDestino || ubicacionActual,
      tecnico_asignado_id: tecnicoId || null,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTipo("");
    setUbicacionDestino("");
    setTecnicoId("");
    setNotas("");
  };

  const tipoColors: Record<string, string> = {
    compra: "bg-green-100 text-green-800",
    almacenamiento: "bg-blue-100 text-blue-800",
    asignacion_tecnico: "bg-yellow-100 text-yellow-800",
    instalacion_cliente: "bg-purple-100 text-purple-800",
    retiro: "bg-red-100 text-red-800",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Historial de Movimientos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo de Movimiento *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="almacenamiento">Almacenamiento en Bodega</SelectItem>
                    <SelectItem value="asignacion_tecnico">Asignación a Técnico</SelectItem>
                    <SelectItem value="retiro">Retiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipo === "asignacion_tecnico" && (
                <div className="space-y-2">
                  <Label>Técnico *</Label>
                  <Select value={tecnicoId} onValueChange={setTecnicoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {tecnicos.map((tec) => (
                        <SelectItem key={tec.id} value={tec.id}>
                          {tec.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Ubicación Destino</Label>
                <Input
                  value={ubicacionDestino}
                  onChange={(e) => setUbicacionDestino(e.target.value)}
                  placeholder="Ej: Bodega Central, Vehículo del técnico..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones del movimiento..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!tipo || createMovimiento.isPending}
                >
                  {createMovimiento.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Registrar
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
        ) : movimientos && movimientos.length > 0 ? (
          <div className="space-y-4">
            {movimientos.map((mov) => (
              <div
                key={mov.id}
                className="flex items-start gap-4 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={tipoColors[mov.tipo] || "bg-gray-100"}>
                      {tipoMovimientoLabels[mov.tipo] || mov.tipo}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(mov.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  
                  {(mov.ubicacion_origen || mov.ubicacion_destino) && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>{mov.ubicacion_origen || "—"}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{mov.ubicacion_destino || "—"}</span>
                    </div>
                  )}
                  
                  {mov.tecnico && (
                    <p className="text-sm text-muted-foreground">
                      Técnico: {mov.tecnico.nombre_completo}
                    </p>
                  )}
                  
                  {mov.notas && (
                    <p className="text-sm text-muted-foreground mt-1">{mov.notas}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No hay movimientos registrados
          </p>
        )}
      </CardContent>
    </Card>
  );
}
