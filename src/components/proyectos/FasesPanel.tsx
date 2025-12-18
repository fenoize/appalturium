import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Trash2, Edit2, Check, X } from "lucide-react";
import { useFasesProyecto, useCrearFase, useActualizarFase, useEliminarFase, EstadoFase } from "@/hooks/useFasesProyecto";
import { useTareas } from "@/hooks/useTareas";

interface FasesPanelProps {
  proyectoId: string;
}

const estadoColors: Record<EstadoFase, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  en_progreso: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completada: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const estadoLabels: Record<EstadoFase, string> = {
  pendiente: "Pendiente",
  en_progreso: "En Progreso",
  completada: "Completada",
};

export function FasesPanel({ proyectoId }: FasesPanelProps) {
  const { data: fases, isLoading } = useFasesProyecto(proyectoId);
  const { data: tareas } = useTareas(proyectoId);
  const crearFase = useCrearFase();
  const actualizarFase = useActualizarFase();
  const eliminarFase = useEliminarFase();
  
  const [newFaseName, setNewFaseName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreateFase = async () => {
    if (!newFaseName.trim()) return;
    const maxOrden = fases?.reduce((max, f) => Math.max(max, f.orden), 0) || 0;
    await crearFase.mutateAsync({
      proyecto_id: proyectoId,
      nombre: newFaseName.trim(),
      orden: maxOrden + 1,
    });
    setNewFaseName("");
  };

  const handleUpdateFase = async (id: string) => {
    if (!editName.trim()) return;
    await actualizarFase.mutateAsync({
      id,
      proyecto_id: proyectoId,
      nombre: editName.trim(),
    });
    setEditingId(null);
  };

  const handleDeleteFase = async (id: string) => {
    if (confirm("¿Eliminar esta fase?")) {
      await eliminarFase.mutateAsync({ id, proyecto_id: proyectoId });
    }
  };

  const getTareasCountByFase = (faseId: string) => {
    return tareas?.filter(t => t.fase_id === faseId).length || 0;
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando fases...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Add new fase */}
      <div className="flex gap-2">
        <Input
          placeholder="Nombre de la nueva fase..."
          value={newFaseName}
          onChange={(e) => setNewFaseName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFase()}
        />
        <Button onClick={handleCreateFase} disabled={!newFaseName.trim() || crearFase.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Fases list */}
      {!fases || fases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No hay fases definidas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega fases para organizar el proyecto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fases.map((fase) => (
            <Card key={fase.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  {editingId === fase.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleUpdateFase(fase.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{fase.orden}
                        </span>
                        <CardTitle className="text-base">{fase.nombre}</CardTitle>
                        <Badge className={estadoColors[fase.estado]}>
                          {estadoLabels[fase.estado]}
                        </Badge>
                        <Badge variant="outline">{getTareasCountByFase(fase.id)} tareas</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {fase.fecha_inicio && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(fase.fecha_inicio).toLocaleDateString()}
                          </span>
                        )}
                        {fase.fecha_fin_estimada && (
                          <span className="text-sm text-muted-foreground">
                            - {new Date(fase.fecha_fin_estimada).toLocaleDateString()}
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(fase.id);
                            setEditName(fase.nombre);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteFase(fase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Simple Gantt visualization */}
      {fases && fases.length > 0 && fases.some(f => f.fecha_inicio && f.fecha_fin_estimada) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Vista Gantt</CardTitle>
          </CardHeader>
          <CardContent>
            <GanttChart fases={fases} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GanttChart({ fases }: { fases: Array<{ id: string; nombre: string; fecha_inicio: string | null; fecha_fin_estimada: string | null; estado: EstadoFase }> }) {
  const fasesWithDates = fases.filter(f => f.fecha_inicio && f.fecha_fin_estimada);
  
  if (fasesWithDates.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay fases con fechas definidas</p>;
  }

  const allDates = fasesWithDates.flatMap(f => [
    new Date(f.fecha_inicio!).getTime(),
    new Date(f.fecha_fin_estimada!).getTime()
  ]);
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) || 1;

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr).getTime();
    return ((date - minDate) / (maxDate - minDate)) * 100;
  };

  const getWidth = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    return ((end - start) / (maxDate - minDate)) * 100;
  };

  const barColors: Record<EstadoFase, string> = {
    pendiente: "bg-yellow-500",
    en_progreso: "bg-blue-500",
    completada: "bg-green-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        <span>{new Date(minDate).toLocaleDateString()}</span>
        <span>{new Date(maxDate).toLocaleDateString()}</span>
      </div>
      {fasesWithDates.map((fase) => (
        <div key={fase.id} className="flex items-center gap-3">
          <div className="w-32 text-sm truncate">{fase.nombre}</div>
          <div className="flex-1 h-6 bg-muted rounded relative">
            <div
              className={`absolute h-full rounded ${barColors[fase.estado]}`}
              style={{
                left: `${getPosition(fase.fecha_inicio!)}%`,
                width: `${Math.max(getWidth(fase.fecha_inicio!, fase.fecha_fin_estimada!), 2)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
