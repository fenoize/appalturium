import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eraser, MapPin, Save } from "lucide-react";

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
        if (data.firma_cliente && sigRef.current) {
          // intencionalmente no precargamos la firma en el canvas
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

  const handleGuardar = async () => {
    if (!resumen.trim()) {
      toast.error("El resumen técnico es obligatorio");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("La firma del cliente es obligatoria");
      return;
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1) Subir firma a Storage
      const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
      const blob = dataURLtoBlob(dataUrl);
      const path = `${otId}/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("firmas")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("firmas").getPublicUrl(path);
      const firmaUrl = pub.publicUrl;

      // 2) Capturar geolocalización
      const geo = await obtenerUbicacion();
      if (geo) setCoords(geo);
      else toast.warning("No se pudo obtener la ubicación");

      // 3) Persistir informe
      const payload: any = {
        ot_id: otId,
        resumen_tecnico: resumen,
        recomendaciones: recomendaciones || null,
        observaciones_cliente: observaciones || null,
        firma_cliente: firmaUrl,
        responsable_personal_id: user.id,
        geocierre_lat: geo?.lat ?? null,
        geocierre_lng: geo?.lng ?? null,
        geocierre_timestamp: geo ? new Date().toISOString() : null,
      };

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

      toast.success("Informe final guardado");
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
        <CardTitle>Informe Final</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Button type="button" variant="ghost" size="sm" onClick={limpiarFirma}>
              <Eraser className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
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
            {guardando ? "Guardando..." : "Guardar informe"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
