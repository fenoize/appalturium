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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

interface Payload {
  token_acceso?: string;
  accion?: "aceptar" | "rechazar";
  nombre?: string;
  email?: string;
  motivo_rechazo?: string;
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

  // Rechazar orígenes no permitidos para GET/POST también
  if (origin && !isOriginAllowed(origin)) {
    return json(403, { error: "Origin not allowed" }, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ============== GET: obtener cotización pública por token ==============
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return json(400, { error: "token requerido" }, corsHeaders);
    }

    const { data: cot, error: cotErr } = await supabase
      .from("cotizaciones")
      .select(
        `id, numero, fecha_emision, fecha_vencimiento, estado, moneda,
         subtotal, impuestos, total, notas, condiciones, token_acceso,
         cliente:clientes(razon_social, nombres, apellidos, tipo)`,
      )
      .eq("token_acceso", token)
      .maybeSingle();

    if (cotErr) return json(500, { error: cotErr.message }, corsHeaders);
    if (!cot) return json(404, { error: "Cotización no encontrada" }, corsHeaders);

    const { data: items, error: itemsErr } = await supabase
      .from("cotizacion_items")
      .select("descripcion, cantidad, precio_unitario, descuento_pct, subtotal, tipo")
      .eq("cotizacion_id", cot.id)
      .order("orden");

    if (itemsErr) return json(500, { error: itemsErr.message }, corsHeaders);

    return json(200, { ...cot, items: items ?? [] }, corsHeaders);
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, corsHeaders);
  }

  // ============== POST: aceptar / rechazar ==============
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" }, corsHeaders);
  }

  const { token_acceso, accion, nombre, email, motivo_rechazo } = payload;

  if (!token_acceso || typeof token_acceso !== "string") {
    return json(400, { error: "token_acceso requerido" }, corsHeaders);
  }
  if (accion !== "aceptar" && accion !== "rechazar") {
    return json(400, { error: "accion debe ser 'aceptar' o 'rechazar'" }, corsHeaders);
  }
  if (accion === "aceptar") {
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return json(400, { error: "nombre requerido" }, corsHeaders);
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: "email inválido" }, corsHeaders);
    }
  }

  const { data: cot, error: findErr } = await supabase
    .from("cotizaciones")
    .select("id, estado, fecha_vencimiento")
    .eq("token_acceso", token_acceso)
    .maybeSingle();

  if (findErr) return json(500, { error: findErr.message }, corsHeaders);
  if (!cot) return json(404, { error: "Cotización no encontrada" }, corsHeaders);

  if (cot.estado !== "en_revision") {
    return json(400, {
      error: "La cotización ya fue respondida o no está disponible para respuesta",
    }, corsHeaders);
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(cot.fecha_vencimiento);
  if (venc < hoy) {
    return json(400, { error: "La cotización está vencida" }, corsHeaders);
  }

  const nowIso = new Date().toISOString();
  const update =
    accion === "aceptar"
      ? {
          estado: "aceptada",
          aceptada_ts: nowIso,
          aceptada_por_nombre: nombre!.trim(),
          aceptada_por_email: email!.trim(),
        }
      : {
          estado: "rechazada",
          rechazada_ts: nowIso,
          rechazo_motivo: motivo_rechazo?.toString().trim() || null,
        };

  const { error: updErr } = await supabase
    .from("cotizaciones")
    .update(update)
    .eq("id", cot.id);

  if (updErr) return json(500, { error: updErr.message }, corsHeaders);

  return json(200, { success: true, estado: update.estado }, corsHeaders);
});
