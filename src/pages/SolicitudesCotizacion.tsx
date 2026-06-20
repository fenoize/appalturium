import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import {
  useSolicitudesCotizacion,
  useCrearSolicitud,
  ESTADO_LABELS,
  type EstadoSolicitud,
} from "@/hooks/useSolicitudesCotizacion";
import { useClientes } from "@/hooks/useClientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileQuestion, FileText } from "lucide-react";

type FormValues = {
  cliente_id: string;
  tipo_servicio: string;
  descripcion_necesidad: string;
  fecha_visita_tecnica: string;
};

const estadoVariant: Record<EstadoSolicitud, "default" | "secondary" | "outline" | "destructive"> = {
  nueva: "default",
  en_presupuesto: "secondary",
  cotizada: "secondary",
  negociacion: "outline",
  aceptada: "default",
  cerrada_sin_acuerdo: "destructive",
};

function formatCliente(c: any | null | undefined) {
  if (!c) return "—";
  if (c.razon_social) return c.razon_social;
  return [c.nombres, c.apellidos].filter(Boolean).join(" ") || c.rut;
}

export default function SolicitudesCotizacion() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const { data: solicitudes, isLoading } = useSolicitudesCotizacion();
  const { data: clientesData } = useClientes({ pageSize: 200 });
  const crear = useCrearSolicitud();

  const clientes = clientesData?.data ?? [];

  const form = useForm<FormValues>({
    defaultValues: {
      cliente_id: "",
      tipo_servicio: "",
      descripcion_necesidad: "",
      fecha_visita_tecnica: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!values.cliente_id || !values.descripcion_necesidad.trim()) return;
    await crear.mutateAsync({
      cliente_id: values.cliente_id,
      tipo_servicio: values.tipo_servicio || null,
      descripcion_necesidad: values.descripcion_necesidad,
      fecha_visita_tecnica: values.fecha_visita_tecnica
        ? new Date(values.fecha_visita_tecnica).toISOString()
        : null,
    });
    form.reset();
    setOpen(false);
  };

  const total = solicitudes?.length ?? 0;
  const nuevas = useMemo(
    () => (solicitudes ?? []).filter((s) => s.estado === "nueva").length,
    [solicitudes]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileQuestion className="w-7 h-7" /> Solicitudes de Cotización
          </h1>
          <p className="text-muted-foreground">
            Registro inicial de necesidades del cliente, antes del presupuesto y la cotización.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nueva solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nueva solicitud de cotización</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={form.watch("cliente_id")}
                  onValueChange={(v) => form.setValue("cliente_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {formatCliente(c)} — {c.rut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de servicio</Label>
                <Input
                  placeholder="Ej: mantención, instalación, proyecto…"
                  {...form.register("tipo_servicio")}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción de la necesidad *</Label>
                <Textarea
                  rows={5}
                  placeholder="¿Qué necesita el cliente?"
                  {...form.register("descripcion_necesidad", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de visita técnica</Label>
                <Input type="datetime-local" {...form.register("fecha_visita_tecnica")} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={crear.isPending}>
                  {crear.isPending ? "Creando…" : "Crear solicitud"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Nuevas (sin procesar)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{nuevas}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (solicitudes ?? []).length === 0 ? (
            <p className="text-muted-foreground">
              Aún no hay solicitudes. Crea la primera con el botón "Nueva solicitud".
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Necesidad</TableHead>
                  <TableHead>Visita técnica</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(solicitudes ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">
                      <button
                        type="button"
                        onClick={() => navigate(`/solicitudes-cotizacion/${s.id}`)}
                        className="underline hover:text-primary"
                      >
                        {s.numero}
                      </button>
                    </TableCell>

                    <TableCell>{formatCliente(s.cliente)}</TableCell>
                    <TableCell>{s.tipo_servicio || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate" title={s.descripcion_necesidad}>
                      {s.descripcion_necesidad}
                    </TableCell>
                    <TableCell>
                      {s.fecha_visita_tecnica
                        ? new Date(s.fecha_visita_tecnica).toLocaleString("es-CL")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[s.estado]}>
                        {ESTADO_LABELS[s.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(s.created_at).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell className="text-right">
                      {(s.estado === "nueva" || s.estado === "en_presupuesto") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate("/cotizaciones/nueva", {
                              state: {
                                cliente_id: s.cliente_id,
                                ubicacion_id: s.ubicacion_id,
                                solicitud_cotizacion_id: s.id,
                              },
                            })
                          }
                        >
                          <FileText className="w-4 h-4 mr-1" /> Crear cotización
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
