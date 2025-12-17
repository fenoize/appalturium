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

        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear el usuario");

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

        // Get unique user IDs
        const userIds = [...new Set(allRoles?.map(r => r.user_id) || [])];

        // Get user details for each
        const users = await Promise.all(
          userIds.map(async (uid) => {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
            const userRolesData = allRoles?.filter(r => r.user_id === uid).map(r => r.role) || [];
            return {
              id: uid,
              email: userData.user?.email || "",
              created_at: userData.user?.created_at || "",
              last_sign_in_at: userData.user?.last_sign_in_at,
              roles: userRolesData,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
