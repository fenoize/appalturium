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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(status: number, body: unknown, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeRut(rut: string | null | undefined): string {
  if (!rut) return "";
  return rut.replace(/[.\-\s]/g, "").toLowerCase();
}

interface Payload {
  token?: string;
  rut?: string;
  accion?: "aceptar" | "rechazar" | "ver";
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

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, corsHeaders);
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body inválido" }, corsHeaders);
  }

  const { token, rut, accion } = body;
  if (!token || !rut || !accion) {
    return json(400, { error: "Faltan parámetros" }, corsHeaders);
  }
  if (!["aceptar", "rechazar", "ver"].includes(accion)) {
    return json(400, { error: "Acción inválida" }, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Buscar cotización por token y validar RUT del cliente
  const { data: cot, error: cotErr } = await supabase
    .from("cotizaciones")
    .select(
      `id, numero, estado, moneda, opcion_actual_id, solicitud_cotizacion_id,
       cliente:clientes(id, rut, razon_social, nombres, apellidos, tipo)`,
    )
    .eq("token_acceso", token)
    .maybeSingle();

  if (cotErr) return json(500, { error: "Error interno" }, corsHeaders);
  if (!cot || !cot.cliente) {
    return json(401, { error: "No autorizado" }, corsHeaders);
  }

  const clienteRut = normalizeRut((cot.cliente as any).rut);
  const inputRut = normalizeRut(rut);
  if (!clienteRut || clienteRut !== inputRut) {
    return json(401, { error: "No autorizado" }, corsHeaders);
  }

  if (!cot.opcion_actual_id) {
    return json(404, { error: "No hay opción vigente para presentar" }, corsHeaders);
  }

  // 2. Cargar opción vigente
  const { data: opcion, error: opErr } = await supabase
    .from("cotizacion_opciones")
    .select("id, etiqueta, formato, total, estado, cotizacion_id")
    .eq("id", cot.opcion_actual_id)
    .maybeSingle();

  if (opErr || !opcion) {
    return json(404, { error: "Opción no encontrada" }, corsHeaders);
  }

  // 3. Acciones de escritura
  if (accion === "aceptar") {
    if (opcion.estado === "aceptada") {
      return json(400, { error: "Esta opción ya fue aceptada" }, corsHeaders);
    }
    if (opcion.estado === "rechazada" || opcion.estado === "descartada") {
      return json(400, { error: "Esta opción ya no está disponible" }, corsHeaders);
    }
    const { error: rpcErr } = await supabase.rpc("fn_aceptar_opcion", {
      p_opcion_id: opcion.id,
      p_num_cuotas: 1,
      p_montos: null,
    });
    if (rpcErr) return json(500, { error: rpcErr.message }, corsHeaders);
    return json(200, { ok: true, accion: "aceptada" }, corsHeaders);
  }

  if (accion === "rechazar") {
    if (opcion.estado === "aceptada") {
      return json(400, { error: "Esta opción ya fue aceptada" }, corsHeaders);
    }
    const { error: updErr } = await supabase
      .from("cotizacion_opciones")
      .update({ estado: "rechazada", rechazada_ts: new Date().toISOString() })
      .eq("id", opcion.id);
    if (updErr) return json(500, { error: updErr.message }, corsHeaders);

    // Si era la opción C y existe SC, cerrar sin acuerdo
    if (opcion.etiqueta === "C" && cot.solicitud_cotizacion_id) {
      await supabase
        .from("solicitudes_cotizacion")
        .update({ estado: "cerrada_sin_acuerdo", updated_at: new Date().toISOString() })
        .eq("id", cot.solicitud_cotizacion_id);
    }
    return json(200, { ok: true, accion: "rechazada" }, corsHeaders);
  }

  // 4. accion === "ver" → devolver SOLO la opción vigente con items agrupados según formato
  const { data: items, error: itErr } = await supabase
    .from("cotizacion_items")
    .select(`
      descripcion, cantidad, precio_unitario, subtotal, tipo, orden,
      item:inventario(
        nombre,
        categoria:categorias_inventario(id, nombre, categoria_padre_id, padre:categorias_inventario!categorias_inventario_categoria_padre_id_fkey(id, nombre))
      )
    `)
    .eq("cotizacion_id", cot.id)
    .order("orden");

  if (itErr) return json(500, { error: itErr.message }, corsHeaders);

  const formato = opcion.formato || "items_por_categoria";
  const baseItems = (items || []).map((i: any) => {
    const cat = i.item?.categoria;
    const padre = cat?.padre;
    return {
      descripcion: i.descripcion,
      cantidad: Number(i.cantidad || 0),
      precio_unitario: Number(i.precio_unitario || 0),
      subtotal: Number(i.subtotal || 0),
      categoria_id: cat?.id || null,
      categoria_nombre: cat?.nombre || "Sin categoría",
      categoria_padre_id: padre?.id || cat?.categoria_padre_id || null,
      categoria_padre_nombre: padre?.nombre || null,
    };
  });

  // Aplicar margen de la opción vigente sobre subtotales (proporcional)
  const sumCosto = baseItems.reduce((s, x) => s + x.subtotal, 0) || 1;
  const factor = Number(opcion.total) / (sumCosto * (1 + 0.19)); // aprox visual
  // Mejor: no recalcular, mostrar el subtotal original; el total final viene de la opción.

  let grupos: Array<{ titulo: string; total: number; items?: any[] }> = [];
  if (formato === "categorias") {
    const map = new Map<string, number>();
    for (const it of baseItems) {
      map.set(it.categoria_nombre, (map.get(it.categoria_nombre) || 0) + it.subtotal);
    }
    grupos = Array.from(map.entries()).map(([titulo, total]) => ({ titulo, total }));
  } else if (formato === "items_por_categoria_padre") {
    const map = new Map<string, any[]>();
    for (const it of baseItems) {
      const key = it.categoria_padre_nombre || it.categoria_nombre;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        subtotal: it.subtotal,
      });
    }
    grupos = Array.from(map.entries()).map(([titulo, items]) => ({
      titulo,
      total: items.reduce((s, x) => s + x.subtotal, 0),
      items,
    }));
  } else {
    // items_por_categoria (default)
    const map = new Map<string, any[]>();
    for (const it of baseItems) {
      const key = it.categoria_nombre;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        subtotal: it.subtotal,
      });
    }
    grupos = Array.from(map.entries()).map(([titulo, items]) => ({
      titulo,
      total: items.reduce((s, x) => s + x.subtotal, 0),
      items,
    }));
  }

  const clienteNombre = (cot.cliente as any).tipo === "empresa"
    ? (cot.cliente as any).razon_social
    : `${(cot.cliente as any).nombres || ""} ${(cot.cliente as any).apellidos || ""}`.trim();

  return json(200, {
    numero: cot.numero,
    moneda: cot.moneda,
    cliente_nombre: clienteNombre,
    opcion: {
      etiqueta: opcion.etiqueta,
      formato,
      total: Number(opcion.total),
      estado: opcion.estado,
    },
    grupos,
  }, corsHeaders);
});
