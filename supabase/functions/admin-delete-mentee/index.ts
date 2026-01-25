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
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user token to verify admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user (admin)
    const { data: { user: adminUser }, error: adminError } = await supabaseUser.auth.getUser();
    
    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("Admin check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the mentee user_id from the request body
    const { menteeUserId } = await req.json();

    if (!menteeUserId) {
      return new Response(
        JSON.stringify({ error: "Mentee user ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from deleting themselves
    if (menteeUserId === adminUser.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete all user data from related tables
    const tablesToClean = [
      "chat_messages",
      "collected_data",
      "interview_history",
      "learning_paths",
      "mentoring_progress",
      "saved_cvs",
      "saved_cover_letters",
      "support_tickets",
      "linkedin_diagnostics",
      "opportunity_funnels",
      "profiles",
      "user_roles",
    ];

    console.log(`Admin ${adminUser.id} deleting mentee ${menteeUserId}`);

    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("user_id", menteeUserId);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
      }
    }

    // Finally, delete the user from auth (if they still exist)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(menteeUserId);

    if (deleteError) {
      // If user not found in auth, it's okay - they may have been deleted already
      if (deleteError.message?.includes("User not found") || deleteError.status === 404) {
        console.log(`User ${menteeUserId} not found in auth (already deleted or never existed)`);
      } else {
        console.error("Error deleting user:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Mentee ${menteeUserId} deleted successfully by admin ${adminUser.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Mentee deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
