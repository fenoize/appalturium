import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  "https://appalturium.lovable.app",
  "https://app.alturium.cl",
  "https://id-preview--df60761d-0551-49da-bfaf-39e9a31e5365.lovable.app",
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^http:\/\/localhost(:\d+)?$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? (origin as string) : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
}

function json(status: number, body: unknown, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(origin)) {
      return new Response("Origin not allowed", { status: 403 });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  if (origin && !isOriginAllowed(origin)) {
    return json(403, { error: "Origin not allowed" }, corsHeaders);
  }

  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" }, corsHeaders);
  }

  const url = new URL(req.url);
  const codigoQr = url.searchParams.get("codigo_qr");
  if (!codigoQr || !codigoQr.trim()) {
    return json(400, { error: "codigo_qr requerido" }, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Solo campos seguros: NO se exponen datos de cliente, costos ni precios
  const { data: equipo, error: eqErr } = await supabase
    .from("equipos")
    .select("id, codigo_qr, marca, modelo, estado, numero_serie, descripcion, updated_at")
    .eq("codigo_qr", codigoQr)
    .maybeSingle();

  if (eqErr) return json(500, { error: eqErr.message }, corsHeaders);
  if (!equipo) return json(404, { error: "Equipo no encontrado" }, corsHeaders);

  const { data: intervenciones, error: intErr } = await supabase
    .from("equipos_intervenciones")
    .select("id, tipo, fecha, descripcion")
    .eq("equipo_id", equipo.id)
    .order("fecha", { ascending: false })
    .limit(5);

  if (intErr) return json(500, { error: intErr.message }, corsHeaders);

  // Ocultar el id interno antes de devolver
  const { id: _id, ...equipoSafe } = equipo;

  return json(200, {
    ...equipoSafe,
    intervenciones: intervenciones ?? [],
  }, corsHeaders);
});
