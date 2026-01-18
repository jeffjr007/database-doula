import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sobre } = await req.json();

    if (!sobre || typeof sobre !== 'string') {
      return new Response(
        JSON.stringify({ error: "Texto 'Sobre' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é um especialista em otimização de textos para plataformas de recrutamento como a Gupy.

Sua tarefa é:
1. Remover TODOS os emojis do texto
2. Manter o conteúdo profissional e humanizado
3. Se o texto tiver mais de 1500 caracteres, resumi-lo de forma inteligente para caber em 1500 caracteres
4. Preservar as informações mais importantes e relevantes para recrutadores
5. Manter a primeira pessoa (eu, meu, minha)
6. Não inventar informações que não existam no texto original
7. Manter a estrutura e fluidez do texto

IMPORTANTE:
- O resultado DEVE ter no máximo 1500 caracteres
- Não adicione aspas ao redor do texto
- Retorne apenas o texto formatado, nada mais`;

    const userPrompt = `Formate o seguinte texto "Sobre" para a Gupy:

${sobre}`;

    const response = await fetch("https://ai-gateway.lovable.dev/chat/completions", {
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
        temperature: 0.3,
        max_tokens: 2000,
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
