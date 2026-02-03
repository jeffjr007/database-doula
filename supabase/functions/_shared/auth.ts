import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
}

/**
 * Validates the user's authentication from the request headers using getClaims().
 * This is more reliable than getUser() as it validates the JWT locally.
 * Returns the user if authenticated, or an error message if not.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Não autorizado" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Use getUser() to validate the JWT token
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Auth validation failed:", error);
    return { user: null, error: "Sessão inválida ou expirada" };
  }

  return { user: { id: user.id, email: user.email }, error: null };
}

/**
 * Creates an unauthorized response with proper CORS headers.
 */
export function unauthorizedResponse(message = "Não autorizado"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
