import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { usePersonal } from "@/hooks/usePersonal";
import {
  useAsignacionesOT,
  useCrearAsignacion,
  useEliminarAsignacion,
} from "@/hooks/useAsignaciones";
import { format } from "date-fns";

const ROLES = [
  { value: "responsable", label: "Responsable" },
  { value: "tecnico", label: "Técnico" },
  { value: "apoyo", label: "Apoyo" },
  { value: "supervisor", label: "Supervisor" },
];

interface AsignacionesPanelProps {
  otId: string;
}

export function AsignacionesPanel({ otId }: AsignacionesPanelProps) {
  const { data: asignaciones = [], isLoading } = useAsignacionesOT(otId);
  const { data: personal = [] } = usePersonal({ activo: true });
  const crearAsignacion = useCrearAsignacion();
  const eliminarAsignacion = useEliminarAsignacion();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    personal_id: "",
    rol_en_ot: "tecnico",
    horario_inicio: "",
    horario_fin: "",
    notas: "",
  });

  const yaAsignados = new Set(asignaciones.map((a) => a.personal_id));
  const personalDisponible = personal.filter((p) => p.user_id && !yaAsignados.has(p.user_id));

  const reset = () =>
    setForm({ personal_id: "", rol_en_ot: "tecnico", horario_inicio: "", horario_fin: "", notas: "" });

  const handleAsignar = async () => {
    if (!form.personal_id) return;
    await crearAsignacion.mutateAsync({
      ot_id: otId,
      personal_id: form.personal_id,
      rol_en_ot: form.rol_en_ot || null,
      horario_inicio: form.horario_inicio || null,
      horario_fin: form.horario_fin || null,
      notas: form.notas || null,
    });
    reset();
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Técnicos asignados
        </CardTitle>
        <Button size="sm" onClick={() => setOpen(true)} disabled={personalDisponible.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Asignar técnico
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando asignaciones...</p>
        ) : asignaciones.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No hay técnicos asignados a esta OT.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Técnico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignaciones.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.personal?.nombre_completo || a.personal_id.slice(0, 8)}
                    {a.personal?.rol_operativo && (
                      <p className="text-xs text-muted-foreground">{a.personal.rol_operativo}</p>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{a.rol_en_ot || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {a.horario_inicio
                      ? `${format(new Date(a.horario_inicio), "dd/MM HH:mm")}${
                          a.horario_fin ? ` → ${format(new Date(a.horario_fin), "HH:mm")}` : ""
                        }`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {a.notas || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarAsignacion.mutate({ id: a.id, ot_id: otId })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar técnico a la OT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Técnico *</Label>
              <Select
                value={form.personal_id}
                onValueChange={(v) => setForm((f) => ({ ...f, personal_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un técnico activo" />
                </SelectTrigger>
                <SelectContent>
                  {personalDisponible.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id!}>
                      {p.nombre_completo}
                      {p.rol_operativo ? ` — ${p.rol_operativo}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol en la OT</Label>
              <Select
                value={form.rol_en_ot}
                onValueChange={(v) => setForm((f) => ({ ...f, rol_en_ot: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Inicio</Label>
                <Input
                  type="datetime-local"
                  value={form.horario_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, horario_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input
                  type="datetime-local"
                  value={form.horario_fin}
                  onChange={(e) => setForm((f) => ({ ...f, horario_fin: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                rows={3}
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAsignar}
              disabled={!form.personal_id || crearAsignacion.isPending}
            >
              {crearAsignacion.isPending ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
