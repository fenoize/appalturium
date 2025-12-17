import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a regular client to verify the user
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if the user has admin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    let result;

    switch (action) {
      case "create": {
        const { email, password, roles: userRoles } = payload;
        
        // Create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          // Typical case: 422 email already exists
          if ((authError as any).code === "email_exists" || String(authError.message || "").includes("already been registered")) {
            return new Response(
              JSON.stringify({ error: "Ya existe un usuario con este email." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          throw authError;
        }

        // Assign roles if provided (use upsert to avoid duplicates)
        if (userRoles && userRoles.length > 0) {
          const { error: rolesInsertError } = await supabaseAdmin
            .from("user_roles")
            .upsert(
              userRoles.map((role: string) => ({ user_id: authData.user.id, role })),
              { onConflict: 'user_id,role', ignoreDuplicates: true }
            );

          if (rolesInsertError) throw rolesInsertError;
        }

        result = { user: authData.user };
        break;
      }

      // NEW: Create user with personal ficha in one step
      case "create_with_personal": {
        const { email, password, roles: userRoles, personalData } = payload;
        
        // Create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          if ((authError as any).code === "email_exists" || String(authError.message || "").includes("already been registered")) {
            return new Response(
              JSON.stringify({ error: "Ya existe un usuario con este email." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          throw authError;
        }

        const newUserId = authData.user.id;

        // Assign roles if provided
        if (userRoles && userRoles.length > 0) {
          const { error: rolesInsertError } = await supabaseAdmin
            .from("user_roles")
            .upsert(
              userRoles.map((role: string) => ({ user_id: newUserId, role })),
              { onConflict: 'user_id,role', ignoreDuplicates: true }
            );

          if (rolesInsertError) {
            // Rollback: delete user
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw rolesInsertError;
          }
        }

        // Create personal ficha
        if (personalData) {
          const { error: personalError } = await supabaseAdmin
            .from("personal_fichas")
            .insert({
              ...personalData,
              user_id: newUserId,
            });

          if (personalError) {
            // Rollback: delete roles and user
            await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw personalError;
          }
        }

        result = { user: authData.user };
        break;
      }

      // NEW: Create user and link to cliente
      case "create_for_cliente": {
        const { email, password, clienteId } = payload;
        
        // Create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          if ((authError as any).code === "email_exists" || String(authError.message || "").includes("already been registered")) {
            return new Response(
              JSON.stringify({ error: "Ya existe un usuario con este email." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          throw authError;
        }

        const newUserId = authData.user.id;

        // Assign cliente role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: newUserId, role: "cliente" });

        if (roleError) {
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          throw roleError;
        }

        // Update cliente with user_id
        const { error: clienteError } = await supabaseAdmin
          .from("clientes")
          .update({ user_id: newUserId })
          .eq("id", clienteId);

        if (clienteError) {
          await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          throw clienteError;
        }

        result = { user: authData.user };
        break;
      }

      case "update": {
        const { userId, email, password } = payload;
        const updateData: { email?: string; password?: string } = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
        if (error) throw error;
        result = { user: data.user };
        break;
      }

      case "delete": {
        const { userId } = payload;
        
        // Delete user roles first
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Unlink from clientes
        await supabaseAdmin
          .from("clientes")
          .update({ user_id: null })
          .eq("user_id", userId);

        // Delete the user
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "get": {
        const { userId } = payload;
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error) throw error;
        result = { user: data.user };
        break;
      }

      case "list": {
        // Get all user roles
        const { data: allRoles, error: allRolesError } = await supabaseAdmin
          .from("user_roles")
          .select("*");

        if (allRolesError) throw allRolesError;

        // Get personal_fichas to check linked users
        const { data: personalFichas } = await supabaseAdmin
          .from("personal_fichas")
          .select("user_id, nombre_completo");

        // Get clientes to check linked users
        const { data: clientes } = await supabaseAdmin
          .from("clientes")
          .select("user_id, razon_social, nombres, apellidos, tipo");

        // Get unique user IDs
        const userIds = [...new Set(allRoles?.map(r => r.user_id) || [])];

        // Get user details for each
        const users = await Promise.all(
          userIds.map(async (uid) => {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
            const userRolesData = allRoles?.filter(r => r.user_id === uid).map(r => r.role) || [];
            
            // Find linked personal
            const linkedPersonal = personalFichas?.find(p => p.user_id === uid);
            
            // Find linked cliente
            const linkedCliente = clientes?.find(c => c.user_id === uid);
            const clienteName = linkedCliente 
              ? (linkedCliente.tipo === 'empresa' 
                  ? linkedCliente.razon_social 
                  : `${linkedCliente.nombres} ${linkedCliente.apellidos}`)
              : null;

            return {
              id: uid,
              email: userData.user?.email || "",
              created_at: userData.user?.created_at || "",
              last_sign_in_at: userData.user?.last_sign_in_at,
              roles: userRolesData,
              linked_personal: linkedPersonal?.nombre_completo || null,
              linked_cliente: clienteName,
            };
          })
        );

        result = { users: users.sort((a, b) => a.email.localeCompare(b.email)) };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in manage-users function:", error);

    // Preserve meaningful status codes when possible
    const status =
      typeof error?.status === "number" ? error.status :
      typeof error?.statusCode === "number" ? error.statusCode :
      400;

    const message = error?.message || "Error";

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
