import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🧪 Enviando notificación de prueba a usuario ${user.id}...`);

    // Insertar notificación de prueba
    const { error: insertError } = await supabase
      .from("notificaciones_log")
      .insert({
        ot_id: null,
        tipo_evento: "ot_creada",
        canal: "email",
        destinatario_user_id: user.id,
        metadata: { 
          test: true,
          descripcion: "Esta es una notificación de prueba"
        },
        enviado_exitosamente: false,
      });

    if (insertError) {
      console.error("❌ Error al insertar notificación:", insertError);
      throw insertError;
    }

    // Invocar send-email para procesar la notificación
    const { error: invokeError } = await supabase.functions.invoke("send-email");

    if (invokeError) {
      console.error("⚠️ Error al invocar send-email:", invokeError);
    }

    console.log("✅ Notificación de prueba enviada");

    return new Response(
      JSON.stringify({ 
        mensaje: "Notificación de prueba enviada. Revisa tu correo en unos momentos.",
        user_email: user.email
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error en test-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
