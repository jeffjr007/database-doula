import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  menteeName: string;
  menteePhone: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { menteeName, menteePhone }: NotifyRequest = await req.json();

    console.log(`Sending stage 2 completion email for: ${menteeName}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Método Perfil Glorioso <onboarding@resend.dev>",
        to: ["adrianoduartehpz@gmail.com"],
        subject: "ETAPA 2 CONCLUÍDA",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #D4AF37; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">
              🎉 Etapa 2 Concluída!
            </h1>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #ffffff; margin-top: 0;">Dados do Mentorado:</h2>
              
              <p style="color: #e0e0e0; margin: 10px 0;">
                <strong style="color: #D4AF37;">Nome:</strong> ${menteeName || 'Não informado'}
              </p>
              
              <p style="color: #e0e0e0; margin: 10px 0;">
                <strong style="color: #D4AF37;">Telefone:</strong> ${menteePhone || 'Não informado'}
              </p>
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              O mentorado finalizou a criação do CV Personalizado e CV ATS.
              <br>
              Agora você pode criar o Funil de Oportunidades para este mentorado.
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-stage2-completed function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
