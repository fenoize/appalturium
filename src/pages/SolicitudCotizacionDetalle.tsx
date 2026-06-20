import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ESTADO_LABELS, type EstadoSolicitud } from "@/hooks/useSolicitudesCotizacion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileQuestion, FileText, Paperclip } from "lucide-react";

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

export default function SolicitudCotizacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: solicitud, isLoading } = useQuery({
    queryKey: ["solicitud_cotizacion", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("solicitudes_cotizacion")
        .select(
          `*, cliente:clientes(id, razon_social, nombres, apellidos, rut, email), ubicacion:ubicaciones(id, alias, direccion, comuna)`
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: cotizaciones } = useQuery({
    queryKey: ["cotizaciones_de_solicitud", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cotizaciones")
        .select("id, numero, estado, total, moneda, created_at")
        .eq("solicitud_cotizacion_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        numero: string;
        estado: string;
        total: number;
        moneda: string;
        created_at: string;
      }>;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-center">Cargando solicitud…</div>;
  if (!solicitud) return <div className="p-8 text-center">Solicitud no encontrada</div>;

  const adjuntos: any[] = Array.isArray(solicitud.archivos_adjuntos) ? solicitud.archivos_adjuntos : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/solicitudes-cotizacion")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileQuestion className="w-7 h-7" /> {solicitud.numero}
            </h1>
            <Badge variant={estadoVariant[solicitud.estado as EstadoSolicitud]}>
              {ESTADO_LABELS[solicitud.estado as EstadoSolicitud]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Creada el {new Date(solicitud.created_at).toLocaleString("es-CL")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la solicitud</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{formatCliente(solicitud.cliente)}</p>
            {solicitud.cliente?.rut && (
              <p className="text-xs text-muted-foreground">RUT: {solicitud.cliente.rut}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ubicación</p>
            <p className="font-medium">
              {solicitud.ubicacion
                ? `${solicitud.ubicacion.alias ?? ""}${
                    solicitud.ubicacion.direccion ? ` — ${solicitud.ubicacion.direccion}` : ""
                  }${solicitud.ubicacion.comuna ? `, ${solicitud.ubicacion.comuna}` : ""}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de servicio</p>
            <p className="font-medium">{solicitud.tipo_servicio || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha de visita técnica</p>
            <p className="font-medium">
              {solicitud.fecha_visita_tecnica
                ? new Date(solicitud.fecha_visita_tecnica).toLocaleString("es-CL")
                : "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Descripción de la necesidad</p>
            <p className="font-medium whitespace-pre-wrap">{solicitud.descripcion_necesidad}</p>
          </div>
          {adjuntos.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-2">Archivos adjuntos</p>
              <ul className="space-y-1">
                {adjuntos.map((a: any, idx: number) => {
                  const url = typeof a === "string" ? a : a?.url ?? a?.path;
                  const name = typeof a === "string" ? a : a?.nombre ?? a?.name ?? url;
                  return (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="underline">
                          {name}
                        </a>
                      ) : (
                        <span>{name}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" /> Cotizaciones generadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!cotizaciones || cotizaciones.length === 0 ? (
            <p className="text-muted-foreground">
              Aún no hay cotizaciones creadas a partir de esta solicitud.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Creada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizaciones.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">
                      <Link to={`/cotizaciones/${c.id}`} className="underline">
                        {c.numero}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("es-CL", {
                        style: "currency",
                        currency: c.moneda || "CLP",
                        maximumFractionDigits: 0,
                      }).format(c.total ?? 0)}
                    </TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString("es-CL")}</TableCell>
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
