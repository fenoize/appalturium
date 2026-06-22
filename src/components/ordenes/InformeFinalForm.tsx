import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eraser, MapPin, Save, Info, Upload, Trash2, Lock, AlertTriangle, PenLine } from "lucide-react";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

interface InformeFinalFormProps {
  otId: string;
  onSaved?: () => void;
}

interface EvidenciasObj {
  antes: string[];
  despues: string[];
}

export function InformeFinalForm({ otId, onSaved }: InformeFinalFormProps) {
  const { hasAnyRole } = useCurrentUserRole();
  const isAdminOrSupervisor = hasAnyRole(["admin", "supervisor"]);
  const [otEstado, setOtEstado] = useState<string | null>(null);
  const readOnly = otEstado === "finalizado" && !isAdminOrSupervisor;
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [resumen, setResumen] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [equipoId, setEquipoId] = useState<string>("");
  const [equipoOTId, setEquipoOTId] = useState<string | null>(null);
  const [equiposDisponibles, setEquiposDisponibles] = useState<Array<{ id: string; codigo_qr: string; marca: string | null; modelo: string | null }>>([]);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [potencia, setPotencia] = useState("");
  const [observacionesEquipo, setObservacionesEquipo] = useState("");
  const [evidencias, setEvidencias] = useState<EvidenciasObj>({ antes: [], despues: [] });
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState<"antes" | "despues" | null>(null);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [yaExiste, setYaExiste] = useState(false);
  const [firmaPreviaUrl, setFirmaPreviaUrl] = useState<string | null>(null);
  const [mantenerFirma, setMantenerFirma] = useState(true);
  const [firmaDialogOpen, setFirmaDialogOpen] = useState(false);
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Load OT to know its equipo_id (default) and estado
      const { data: ot } = await supabase
        .from("ordenes_servicio")
        .select("equipo_id, estado")
        .eq("id", otId)
        .maybeSingle();
      setEquipoOTId((ot as any)?.equipo_id ?? null);
      setOtEstado((ot as any)?.estado ?? null);

      // Load list of equipos to allow change
      const { data: eqs } = await supabase
        .from("equipos")
        .select("id, codigo_qr, marca, modelo")
        .order("codigo_qr");
      setEquiposDisponibles(eqs ?? []);

      const { data } = await supabase
        .from("informes_finales")
        .select("id, resumen_tecnico, recomendaciones, observaciones_cliente, firma_cliente, geocierre_lat, geocierre_lng, equipo_id, especificaciones_equipo, evidencias_urls")
        .eq("ot_id", otId)
        .maybeSingle();
      if (data) {
        setYaExiste(true);
        setResumen(data.resumen_tecnico ?? "");
        setRecomendaciones(data.recomendaciones ?? "");
        setObservaciones(data.observaciones_cliente ?? "");
        setCoords({ lat: data.geocierre_lat as any, lng: data.geocierre_lng as any });
        setEquipoId((data as any).equipo_id ?? (ot as any)?.equipo_id ?? "");
        const espec = ((data as any).especificaciones_equipo ?? {}) as any;
        setMarca(espec.marca ?? "");
        setModelo(espec.modelo ?? "");
        setNumeroSerie(espec.numero_serie ?? "");
        setPotencia(espec.potencia ?? "");
        setObservacionesEquipo(espec.observaciones ?? "");
        const ev = (data as any).evidencias_urls ?? {};
        setEvidencias({
          antes: Array.isArray(ev.antes) ? ev.antes : [],
          despues: Array.isArray(ev.despues) ? ev.despues : [],
        });
        if (data.firma_cliente) {
          setFirmaPreviaUrl(data.firma_cliente);
          setMantenerFirma(true);
        }
      } else {
        setEquipoId((ot as any)?.equipo_id ?? "");
      }
    })();
  }, [otId]);

  const limpiarFirma = () => sigRef.current?.clear();

  const handleAbrirFirma = () => setFirmaDialogOpen(true);

  const handleGuardarFirma = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Dibuja una firma antes de guardar");
      return;
    }
    const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
    setFirmaDataUrl(dataUrl);
    // Si había firma previa, al capturar nueva ya no la mantenemos.
    if (firmaPreviaUrl) setMantenerFirma(false);
    setFirmaDialogOpen(false);
  };

  const obtenerUbicacion = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const dataURLtoBlob = (dataUrl: string): Blob => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const usandoFirmaPrevia = yaExiste && firmaPreviaUrl && mantenerFirma;

  const handleSubirEvidencia = async (
    seccion: "antes" | "despues",
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    setSubiendo(seccion);
    try {
      const nuevas: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `evidencias/${otId}/${seccion}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("firmas")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data: pub } = supabase.storage.from("firmas").getPublicUrl(path);
        nuevas.push(pub.publicUrl);
      }
      setEvidencias((prev) => ({ ...prev, [seccion]: [...prev[seccion], ...nuevas] }));
      toast.success(`${nuevas.length} foto(s) subida(s)`);
    } catch (err: any) {
      toast.error("Error al subir fotos", { description: err.message });
    } finally {
      setSubiendo(null);
    }
  };

  const eliminarEvidencia = (seccion: "antes" | "despues", url: string) => {
    setEvidencias((prev) => ({
      ...prev,
      [seccion]: prev[seccion].filter((u) => u !== url),
    }));
  };

  const handleGuardar = async () => {
    if (!resumen.trim()) {
      toast.error("El resumen técnico es obligatorio");
      return;
    }
    if (!usandoFirmaPrevia && (!sigRef.current || sigRef.current.isEmpty())) {
      toast.error("La firma del cliente es obligatoria");
      return;
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      let firmaUrl = firmaPreviaUrl;

      if (!usandoFirmaPrevia) {
        const dataUrl = sigRef.current!.getCanvas().toDataURL("image/png");
        const blob = dataURLtoBlob(dataUrl);
        const path = `${otId}/${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from("firmas")
          .upload(path, blob, { contentType: "image/png", upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("firmas").getPublicUrl(path);
        firmaUrl = pub.publicUrl;
      }

      const geo = await obtenerUbicacion();
      if (geo) setCoords(geo);
      else if (!yaExiste) toast.warning("No se pudo obtener la ubicación");

      const payload: any = {
        ot_id: otId,
        resumen_tecnico: resumen,
        recomendaciones: recomendaciones || null,
        observaciones_cliente: observaciones || null,
        firma_cliente: firmaUrl,
        responsable_personal_id: user.id,
        equipo_id: equipoId || null,
        especificaciones_equipo: {
          marca: marca || null,
          modelo: modelo || null,
          numero_serie: numeroSerie || null,
          potencia: potencia || null,
          observaciones: observacionesEquipo || null,
        },
        evidencias_urls: evidencias,
      };

      if (geo) {
        payload.geocierre_lat = geo.lat;
        payload.geocierre_lng = geo.lng;
        payload.geocierre_timestamp = new Date().toISOString();
      } else if (!yaExiste) {
        payload.geocierre_lat = null;
        payload.geocierre_lng = null;
        payload.geocierre_timestamp = null;
      }

      if (yaExiste) {
        const { error } = await supabase
          .from("informes_finales")
          .update(payload)
          .eq("ot_id", otId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("informes_finales").insert(payload);
        if (error) throw error;
        setYaExiste(true);
      }

      if (firmaUrl) setFirmaPreviaUrl(firmaUrl);
      toast.success(yaExiste ? "Informe actualizado" : "Informe final guardado");
      onSaved?.();
    } catch (err: any) {
      toast.error("Error al guardar informe", { description: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const renderSeccionFotos = (seccion: "antes" | "despues", titulo: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Fotos {titulo}</Label>
        {!readOnly && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={subiendo === seccion}
              onChange={(e) => {
                handleSubirEvidencia(seccion, e.target.files);
                e.target.value = "";
              }}
            />
            <Button asChild type="button" variant="outline" size="sm" disabled={subiendo === seccion}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {subiendo === seccion ? "Subiendo..." : "Subir fotos"}
              </span>
            </Button>
          </label>
        )}
      </div>
      {evidencias[seccion].length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin fotos cargadas.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {evidencias[seccion].map((url) => (
            <div key={url} className="relative group">
              <img src={url} alt={`Evidencia ${titulo}`} className="w-full h-24 object-cover rounded-md border" />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => eliminarEvidencia(seccion, url)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{yaExiste ? "Editar Informe Final" : "Informe Final"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {readOnly && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              La OT está finalizada. El informe está en modo solo lectura. Solo un administrador o supervisor puede modificarlo.
            </AlertDescription>
          </Alert>
        )}
        {yaExiste && !readOnly && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Estás editando un informe existente. Puedes mantener la firma previa o capturar una nueva.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="resumen">Resumen técnico *</Label>
          <Textarea
            id="resumen"
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            rows={4}
            placeholder="Describa el trabajo ejecutado..."
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recomendaciones">Recomendaciones</Label>
          <Textarea
            id="recomendaciones"
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
            rows={3}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones del cliente</Label>
          <Textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            disabled={readOnly}
          />
        </div>

        {/* Equipo instalado */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Equipo instalado</h3>
            <p className="text-xs text-muted-foreground">
              Por defecto se asocia el equipo planificado en la OT. Cámbialo si instalaste uno distinto.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipo">Equipo</Label>
            <select
              id="equipo"
              value={equipoId}
              onChange={(e) => setEquipoId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              disabled={readOnly}
            >
              <option value="">— Sin equipo asociado —</option>
              {equiposDisponibles.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.codigo_qr} {eq.marca || eq.modelo ? `· ${[eq.marca, eq.modelo].filter(Boolean).join(" ")}` : ""}
                  {eq.id === equipoOTId ? "  (planeado)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ns">N° de serie</Label>
              <Input id="ns" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pot">Potencia / capacidad</Label>
              <Input id="pot" value={potencia} onChange={(e) => setPotencia(e.target.value)} disabled={readOnly} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs-eq">Observaciones del equipo</Label>
            <Textarea
              id="obs-eq"
              value={observacionesEquipo}
              onChange={(e) => setObservacionesEquipo(e.target.value)}
              rows={2}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Evidencias fotográficas */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold">Evidencias fotográficas</h3>
          {renderSeccionFotos("antes", "antes")}
          {renderSeccionFotos("despues", "después")}
        </div>

        {/* Firma */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Firma del cliente *</Label>
            {!usandoFirmaPrevia && !readOnly && (
              <Button type="button" variant="ghost" size="sm" onClick={limpiarFirma}>
                <Eraser className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {yaExiste && firmaPreviaUrl && !readOnly && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Mantener firma existente</p>
                <p className="text-xs text-muted-foreground">
                  Desactiva para capturar una nueva firma.
                </p>
              </div>
              <Switch checked={mantenerFirma} onCheckedChange={setMantenerFirma} />
            </div>
          )}

          {readOnly ? (
            firmaPreviaUrl ? (
              <div className="border rounded-md bg-background p-3 flex items-center justify-center">
                <img
                  src={firmaPreviaUrl}
                  alt="Firma del cliente registrada"
                  className="max-h-48 object-contain"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Sin firma registrada.</p>
            )
          ) : usandoFirmaPrevia ? (
            <div className="border rounded-md bg-background p-3 flex items-center justify-center">
              <img
                src={firmaPreviaUrl!}
                alt="Firma del cliente registrada"
                className="max-h-48 object-contain"
              />
            </div>
          ) : (
            <div className="border rounded-md bg-background overflow-hidden">
              <SignatureCanvas
                ref={sigRef}
                penColor="hsl(var(--foreground))"
                canvasProps={{
                  className: "w-full touch-none",
                  style: { width: "100%", height: 200 },
                }}
              />
            </div>
          )}
        </div>

        {(coords.lat ?? null) !== null && (
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <MapPin className="h-4 w-4" />
            Geocierre: {coords.lat?.toFixed(6)}, {coords.lng?.toFixed(6)}
          </div>
        )}

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={handleGuardar} disabled={guardando}>
              <Save className="h-4 w-4 mr-2" />
              {guardando ? "Guardando..." : yaExiste ? "Actualizar informe" : "Guardar informe"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
