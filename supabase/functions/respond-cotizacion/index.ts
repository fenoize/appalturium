import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  token_acceso?: string;
  accion?: "aceptar" | "rechazar";
  nombre?: string;
  email?: string;
  motivo_rechazo?: string;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" });
  }

  const { token_acceso, accion, nombre, email, motivo_rechazo } = payload;

  if (!token_acceso || typeof token_acceso !== "string") {
    return json(400, { error: "token_acceso requerido" });
  }
  if (accion !== "aceptar" && accion !== "rechazar") {
    return json(400, { error: "accion debe ser 'aceptar' o 'rechazar'" });
  }
  if (accion === "aceptar") {
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return json(400, { error: "nombre requerido" });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: "email inválido" });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: cot, error: findErr } = await supabase
    .from("cotizaciones")
    .select("id, estado, fecha_vencimiento")
    .eq("token_acceso", token_acceso)
    .maybeSingle();

  if (findErr) return json(500, { error: findErr.message });
  if (!cot) return json(404, { error: "Cotización no encontrada" });

  if (cot.estado !== "en_revision") {
    return json(400, { error: "La cotización ya fue respondida o no está disponible para respuesta" });
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(cot.fecha_vencimiento);
  if (venc < hoy) {
    return json(400, { error: "La cotización está vencida" });
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

  if (updErr) return json(500, { error: updErr.message });

  return json(200, { success: true, estado: update.estado });
});
