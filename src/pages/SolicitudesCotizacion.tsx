import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  useSolicitudesCotizacion,
  ESTADO_LABELS,
  type EstadoSolicitud,
} from "@/hooks/useSolicitudesCotizacion";
import { Button } from "@/components/ui/button";
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
import { Plus, FileQuestion, FileText, Pencil } from "lucide-react";

const estadoVariant: Record<EstadoSolicitud, "default" | "secondary" | "outline" | "destructive"> = {
  borrador: "outline",
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

  const { data: solicitudes, isLoading } = useSolicitudesCotizacion();

  const total = solicitudes?.length ?? 0;
  const nuevas = useMemo(
    () => (solicitudes ?? []).filter((s) => s.estado === "nueva").length,
    [solicitudes]
  );
  const borradores = useMemo(
    () => (solicitudes ?? []).filter((s) => s.estado === "borrador").length,
    [solicitudes]
  );

  const irASolicitud = (s: any) => {
    if (s.estado === "borrador") {
      navigate(`/solicitudes-cotizacion/${s.id}/editar`);
    } else {
      navigate(`/solicitudes-cotizacion/${s.id}`);
    }
  };

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
        <Button onClick={() => navigate("/solicitudes-cotizacion/nueva")}>
          <Plus className="w-4 h-4 mr-2" /> Nueva solicitud
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{borradores}</p>
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
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => irASolicitud(s)}
                  >
                    <TableCell className="font-mono">{s.numero}</TableCell>
                    <TableCell>{formatCliente(s.cliente)}</TableCell>
                    <TableCell>{s.tipo_servicio || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate" title={s.descripcion_necesidad}>
                      {s.descripcion_necesidad || (
                        <span className="italic text-muted-foreground">Sin descripción</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.fecha_visita_tecnica
                        ? new Date(s.fecha_visita_tecnica).toLocaleString("es-CL")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[s.estado]}>{ESTADO_LABELS[s.estado]}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(s.created_at).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {s.estado === "borrador" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/solicitudes-cotizacion/${s.id}/editar`)
                          }
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Continuar
                        </Button>
                      ) : (s.estado === "nueva" || s.estado === "en_presupuesto") ? (
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
                      ) : null}
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
