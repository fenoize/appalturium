import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { CheckCircle, XCircle, AlertCircle, Lock } from "lucide-react";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const APIKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Grupo = { titulo: string; total: number; items?: { descripcion: string; cantidad: number; subtotal: number }[] };
type Vista = {
  numero: string;
  moneda: "CLP" | "UF" | "USD";
  cliente_nombre: string;
  opcion: { etiqueta: string; formato: string; total: number; estado: string };
  grupos: Grupo[];
};

export default function CotizacionPublica() {
  const { token } = useParams();
  const [rut, setRut] = useState("");
  const [vista, setVista] = useState<Vista | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actuando, setActuando] = useState(false);
  const [autenticado, setAutenticado] = useState(false);

  async function llamar(accion: "ver" | "aceptar" | "rechazar") {
    if (!token) throw new Error("Token inválido");
    const resp = await fetch(`${FUNCTIONS_BASE}/respond-cotizacion-opcion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: APIKEY,
        Authorization: `Bearer ${APIKEY}`,
      },
      body: JSON.stringify({ token, rut, accion }),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(body?.error || "Error");
    return body;
  }

  const handleVer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await llamar("ver");
      setVista(data);
      setAutenticado(true);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  };

  const handleAccion = async (accion: "aceptar" | "rechazar") => {
    if (!confirm(accion === "aceptar" ? "¿Confirma que acepta esta opción?" : "¿Confirma que rechaza esta opción?")) return;
    setActuando(true);
    try {
      await llamar(accion);
      toast({ title: accion === "aceptar" ? "Opción aceptada" : "Opción rechazada" });
      const data = await llamar("ver");
      setVista(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActuando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Acceso a cotización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVer} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Por favor ingrese su RUT para ver la cotización que se le ha presentado.
              </p>
              <div>
                <Label>RUT</Label>
                <Input
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="11.111.111-1"
                  required
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !rut}>
                {loading ? "Verificando..." : "Continuar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vista) return null;
  const { opcion, grupos, moneda } = vista;
  const yaResuelta = opcion.estado === "aceptada" || opcion.estado === "rechazada";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Cotización {vista.numero}</h1>
              <p className="text-muted-foreground">Estimado/a {vista.cliente_nombre}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline">Opción {opcion.etiqueta}</Badge>
              {opcion.estado === "aceptada" && <Badge className="ml-2 bg-green-600">Aceptada</Badge>}
              {opcion.estado === "rechazada" && <Badge className="ml-2 bg-red-600">Rechazada</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {grupos.map((g, idx) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="flex justify-between font-medium">
                  <span>{g.titulo}</span>
                  <span>{formatCurrency(g.total, moneda)}</span>
                </div>
                {g.items && g.items.length > 0 && (
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {g.items.map((it, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{it.cantidad} × {it.descripcion}</span>
                        <span>{formatCurrency(it.subtotal, moneda)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>{formatCurrency(opcion.total, moneda)}</span>
            </div>
          </CardContent>
        </Card>

        {!yaResuelta && (
          <Card>
            <CardContent className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAccion("aceptar")}
                disabled={actuando}
              >
                <CheckCircle className="h-5 w-5 mr-2" /> Aceptar
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => handleAccion("rechazar")}
                disabled={actuando}
              >
                <XCircle className="h-5 w-5 mr-2" /> Rechazar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
