import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eraser, MapPin, Save, Info } from "lucide-react";

interface InformeFinalFormProps {
  otId: string;
  onSaved?: () => void;
}

export function InformeFinalForm({ otId, onSaved }: InformeFinalFormProps) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [resumen, setResumen] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [yaExiste, setYaExiste] = useState(false);
  const [firmaPreviaUrl, setFirmaPreviaUrl] = useState<string | null>(null);
  const [mantenerFirma, setMantenerFirma] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("informes_finales")
        .select("id, resumen_tecnico, recomendaciones, observaciones_cliente, firma_cliente, geocierre_lat, geocierre_lng")
        .eq("ot_id", otId)
        .maybeSingle();
      if (data) {
        setYaExiste(true);
        setResumen(data.resumen_tecnico ?? "");
        setRecomendaciones(data.recomendaciones ?? "");
        setObservaciones(data.observaciones_cliente ?? "");
        setCoords({ lat: data.geocierre_lat as any, lng: data.geocierre_lng as any });
        if (data.firma_cliente) {
          setFirmaPreviaUrl(data.firma_cliente);
          setMantenerFirma(true);
        }
      }
    })();
  }, [otId]);

  const limpiarFirma = () => sigRef.current?.clear();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{yaExiste ? "Editar Informe Final" : "Informe Final"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {yaExiste && (
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recomendaciones">Recomendaciones</Label>
          <Textarea
            id="recomendaciones"
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones del cliente</Label>
          <Textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Firma del cliente *</Label>
            {!usandoFirmaPrevia && (
              <Button type="button" variant="ghost" size="sm" onClick={limpiarFirma}>
                <Eraser className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {yaExiste && firmaPreviaUrl && (
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

          {usandoFirmaPrevia ? (
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

        <div className="flex justify-end">
          <Button onClick={handleGuardar} disabled={guardando}>
            <Save className="h-4 w-4 mr-2" />
            {guardando ? "Guardando..." : yaExiste ? "Actualizar informe" : "Guardar informe"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
