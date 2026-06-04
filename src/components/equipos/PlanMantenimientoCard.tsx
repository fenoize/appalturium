import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Save } from "lucide-react";
import {
  usePlanMantenimientoEquipo,
  useGuardarPlanMantenimiento,
} from "@/hooks/usePlanesMantenimiento";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FRECUENCIAS = [
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

interface PlanMantenimientoCardProps {
  equipoId: string;
}

export function PlanMantenimientoCard({ equipoId }: PlanMantenimientoCardProps) {
  const { data: plan, isLoading } = usePlanMantenimientoEquipo(equipoId);
  const guardar = useGuardarPlanMantenimiento();

  const [frecuencia, setFrecuencia] = useState("trimestral");
  const [proximaFecha, setProximaFecha] = useState("");
  const [activo, setActivo] = useState(true);
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (plan) {
      setFrecuencia(plan.frecuencia);
      setProximaFecha(plan.proxima_fecha);
      setActivo(plan.activo);
      setNotas(plan.notas ?? "");
    }
  }, [plan]);

  const handleGuardar = () => {
    if (!proximaFecha) return;
    guardar.mutate({
      id: plan?.id,
      equipo_id: equipoId,
      frecuencia,
      proxima_fecha: proximaFecha,
      activo,
      notas: notas || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Plan de Mantenimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <>
            {plan && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>
                  Próximo mantenimiento:{" "}
                  <span className="font-medium">
                    {format(new Date(plan.proxima_fecha), "dd MMM yyyy", { locale: es })}
                  </span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select value={frecuencia} onValueChange={setFrecuencia}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRECUENCIAS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Próxima fecha *</Label>
                <Input
                  type="date"
                  value={proximaFecha}
                  onChange={(e) => setProximaFecha(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del plan..."
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Plan activo</p>
                <p className="text-xs text-muted-foreground">
                  Desactiva para pausar las notificaciones de este plan.
                </p>
              </div>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGuardar} disabled={!proximaFecha || guardar.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {guardar.isPending ? "Guardando..." : plan ? "Actualizar plan" : "Crear plan"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
