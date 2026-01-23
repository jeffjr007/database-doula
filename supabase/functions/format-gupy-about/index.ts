import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return unauthorizedResponse(authError || "Não autorizado");
    }

    const { sobre } = await req.json();

    if (!sobre || typeof sobre !== 'string') {
      return new Response(
        JSON.stringify({ error: "Texto 'Sobre' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Formatting Gupy about for user:", user.id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é um formatador de texto. Sua ÚNICA função é:

1. REMOVER todos os emojis do texto
2. SE o texto tiver MAIS de 1500 caracteres, reduza APENAS removendo palavras desnecessárias ou encurtando frases até caber em 1500 caracteres

REGRAS CRÍTICAS:
- NÃO reescreva o texto
- NÃO mude a estrutura
- NÃO altere o estilo de escrita
- NÃO adicione ou modifique palavras (exceto para reduzir caracteres se necessário)
- NÃO melhore a gramática
- Mantenha EXATAMENTE o texto original, apenas sem emojis
- Se precisar reduzir, remova apenas o mínimo necessário

Retorne APENAS o texto formatado, nada mais.`;

    const userPrompt = `Remova APENAS os emojis deste texto (e reduza para 1500 caracteres SE ultrapassar):

${sobre}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes para processamento de IA.");
      }
      throw new Error(`Erro ao processar: ${response.status}`);
    }

    const aiResponse = await response.json();
    let formattedText = aiResponse.choices[0]?.message?.content?.trim() || sobre;

    // Ensure max 1500 chars (safety fallback)
    if (formattedText.length > 1500) {
      formattedText = formattedText.substring(0, 1497) + "...";
    }

    return new Response(
      JSON.stringify({ 
        formatted_sobre: formattedText,
        original_length: sobre.length,
        formatted_length: formattedText.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in format-gupy-about:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao formatar texto";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
