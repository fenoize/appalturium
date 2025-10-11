import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("🔍 Buscando notificaciones pendientes...");
    
    // Obtener notificaciones pendientes (email)
    const { data: pendientes, error: fetchError } = await supabase
      .from("notificaciones_log")
      .select(`
        *,
        ordenes_servicio:ot_id (
          numero,
          descripcion,
          tipo_trabajo,
          estado,
          fecha_programada_inicio,
          clientes:cliente_id (nombres, apellidos, razon_social, email),
          ubicaciones:ubicacion_id (alias, direccion, comuna, ciudad)
        )
      `)
      .eq("canal", "email")
      .eq("enviado_exitosamente", false)
      .lt("intentos", 3)
      .limit(10);

    if (fetchError) {
      console.error("❌ Error al buscar notificaciones:", fetchError);
      throw fetchError;
    }

    if (!pendientes || pendientes.length === 0) {
      console.log("✅ No hay notificaciones pendientes");
      return new Response(
        JSON.stringify({ mensaje: "No hay notificaciones pendientes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Procesando ${pendientes.length} notificaciones...`);

    let procesadas = 0;
    let errores = 0;

    for (const notif of pendientes) {
      try {
        console.log(`📤 Procesando notificación ${notif.id} (${notif.tipo_evento})...`);

        // Obtener email del usuario
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          notif.destinatario_user_id
        );

        if (userError || !userData?.user?.email) {
          console.error(`⚠️ No se pudo obtener email para user_id: ${notif.destinatario_user_id}`);
          await supabase
            .from("notificaciones_log")
            .update({
              intentos: notif.intentos + 1,
              error_mensaje: "No se pudo obtener email del usuario",
            })
            .eq("id", notif.id);
          errores++;
          continue;
        }

        const userEmail = userData.user.email;

        // Verificar preferencias de notificación
        const { data: prefs } = await supabase
          .from("user_notification_prefs")
          .select("*")
          .eq("user_id", notif.destinatario_user_id)
          .maybeSingle();

        const tipoEvento = notif.tipo_evento;
        const prefKey = `email_${tipoEvento}`;
        
        if (prefs && prefs[prefKey] === false) {
          console.log(`⏭️ Usuario ${notif.destinatario_user_id} desactivó notificaciones de ${tipoEvento}`);
          await supabase
            .from("notificaciones_log")
            .update({ 
              enviado_exitosamente: true, 
              error_mensaje: "Usuario desactivó este tipo de notificación" 
            })
            .eq("id", notif.id);
          procesadas++;
          continue;
        }

        // Obtener plantilla
        const { data: plantilla, error: plantillaError } = await supabase
          .from("plantillas_email")
          .select("*")
          .eq("tipo", tipoEvento)
          .eq("activa", true)
          .maybeSingle();

        if (plantillaError || !plantilla) {
          console.error(`❌ No se encontró plantilla activa para tipo: ${tipoEvento}`);
          await supabase
            .from("notificaciones_log")
            .update({
              intentos: notif.intentos + 1,
              error_mensaje: `No se encontró plantilla activa para ${tipoEvento}`,
            })
            .eq("id", notif.id);
          errores++;
          continue;
        }

        // Construir variables del template
        const ot = notif.ordenes_servicio;
        const cliente = ot?.clientes;
        const ubicacion = ot?.ubicaciones;
        
        const variables: Record<string, string> = {
          ot_numero: ot?.numero || "N/A",
          cliente_nombre: cliente?.razon_social || `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`.trim() || "N/A",
          tipo_trabajo: ot?.tipo_trabajo || "N/A",
          descripcion: ot?.descripcion || "N/A",
          fecha_programada: ot?.fecha_programada_inicio ? new Date(ot.fecha_programada_inicio).toLocaleDateString("es-CL") : "Por definir",
          ubicacion: ubicacion ? `${ubicacion.direccion}, ${ubicacion.comuna}, ${ubicacion.ciudad}` : "N/A",
          estado_anterior: notif.metadata?.estado_anterior || "N/A",
          estado_nuevo: notif.metadata?.estado_nuevo || ot?.estado || "N/A",
          fecha_cambio: new Date().toLocaleString("es-CL"),
          horario_inicio: notif.metadata?.horario_inicio ? new Date(notif.metadata.horario_inicio).toLocaleString("es-CL") : "N/A",
          horario_fin: notif.metadata?.horario_fin ? new Date(notif.metadata.horario_fin).toLocaleString("es-CL") : "N/A",
          rol_en_ot: notif.metadata?.rol_en_ot || "N/A",
        };

        // Reemplazar variables en asunto y contenido
        let asunto = plantilla.asunto;
        let contenido = plantilla.contenido_html;
        
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          asunto = asunto.replace(regex, value);
          contenido = contenido.replace(regex, value);
        }

        // Enviar email con Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ALTURIUM <onboarding@resend.dev>",
            to: [userEmail],
            subject: asunto,
            html: contenido,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${JSON.stringify(emailData)}`);
        }

        console.log(`✅ Email enviado a ${userEmail}:`, emailData);

        // Actualizar log como exitoso
        await supabase
          .from("notificaciones_log")
          .update({
            enviado_exitosamente: true,
            destinatario_email: userEmail,
            asunto: asunto,
            contenido: contenido,
          })
          .eq("id", notif.id);

        procesadas++;

      } catch (emailError: any) {
        console.error(`❌ Error al enviar email para notificación ${notif.id}:`, emailError);
        
        await supabase
          .from("notificaciones_log")
          .update({
            intentos: notif.intentos + 1,
            error_mensaje: emailError.message,
          })
          .eq("id", notif.id);

        errores++;
      }
    }

    console.log(`📊 Resumen: ${procesadas} procesadas, ${errores} errores`);

    return new Response(
      JSON.stringify({ 
        mensaje: `Procesadas ${procesadas} notificaciones`,
        total: pendientes.length,
        exitosas: procesadas,
        errores: errores
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error general en send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
