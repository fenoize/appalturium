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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Wrench, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  useEquipoIntervenciones,
  useCreateIntervencionEquipo,
  tipoIntervencionLabels,
} from "@/hooks/useEquipos";
import { usePersonal } from "@/hooks/usePersonal";
import { supabase } from "@/integrations/supabase/client";

interface EquipoIntervencionesProps {
  equipoId: string;
}

export function EquipoIntervenciones({ equipoId }: EquipoIntervencionesProps) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<string>("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { data: intervenciones, isLoading } = useEquipoIntervenciones(equipoId);
  const { data: personal } = usePersonal();
  const createIntervencion = useCreateIntervencionEquipo();

  const tecnicos = personal?.filter((p) => p.activo) || [];

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !tipo || !descripcion) return;

    await createIntervencion.mutateAsync({
      equipo_id: equipoId,
      tipo: tipo as any,
      fecha: new Date().toISOString(),
      tecnico_id: tecnicoId || null,
      ot_id: null,
      descripcion,
      observaciones: observaciones || null,
      estado_antes: null,
      estado_despues: null,
      evidencias_urls: null,
      registrado_por: user.id,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTipo("");
    setTecnicoId("");
    setDescripcion("");
    setObservaciones("");
  };

  const tipoColors: Record<string, string> = {
    instalacion: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    mantenimiento_preventivo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    mantenimiento_correctivo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    cambio_equipo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    retiro: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const tipoIcons: Record<string, React.ReactNode> = {
    instalacion: "🔧",
    mantenimiento_preventivo: "🛡️",
    mantenimiento_correctivo: "⚠️",
    cambio_equipo: "🔄",
    retiro: "📤",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Historial de Intervenciones
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Intervención
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Intervención</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo de Intervención *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacion">Instalación</SelectItem>
                    <SelectItem value="mantenimiento_preventivo">Mantenimiento Preventivo</SelectItem>
                    <SelectItem value="mantenimiento_correctivo">Mantenimiento Correctivo</SelectItem>
                    <SelectItem value="cambio_equipo">Cambio de Equipo</SelectItem>
                    <SelectItem value="retiro">Retiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Técnico Responsable</Label>
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

              <div className="space-y-2">
                <Label>Descripción del Trabajo *</Label>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalle el trabajo realizado..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones adicionales, estado del equipo..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!tipo || !descripcion || createIntervencion.isPending}
                >
                  {createIntervencion.isPending && (
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
        ) : intervenciones && intervenciones.length > 0 ? (
          <div className="space-y-4">
            {intervenciones.map((interv) => (
              <div
                key={interv.id}
                className="p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tipoIcons[interv.tipo]}</span>
                    <Badge className={tipoColors[interv.tipo]}>
                      {tipoIntervencionLabels[interv.tipo]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(interv.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                
                <p className="text-sm mb-2">{interv.descripcion}</p>
                
                {interv.tecnico && (
                  <p className="text-sm text-muted-foreground">
                    Técnico: {interv.tecnico.nombre_completo}
                  </p>
                )}
                
                {interv.observaciones && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {interv.observaciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No hay intervenciones registradas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
