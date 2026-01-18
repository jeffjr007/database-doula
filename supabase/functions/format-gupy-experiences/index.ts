import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Experience {
  empresa: string;
  cargo: string;
  descricao: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experiencias } = await req.json() as { experiencias: Experience[] };
    
    console.log("Formatting experiences for Gupy:", experiencias.length);

    if (!experiencias || experiencias.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma experiência fornecida" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um formatador de textos para a plataforma Gupy. Sua ÚNICA função é:

1. REMOVER bullets (•, -, >, *, etc.) do início de linhas
2. REMOVER ponto e vírgula (;) 
3. CONVERTER porcentagens numéricas para texto (ex: "36%" → "trinta e seis por cento", "100%" → "cem por cento")
4. REMOVER emojis

NÃO faça mais nada. NÃO reescreva o texto. NÃO melhore a escrita. NÃO adicione informações. NÃO remova conteúdo além dos caracteres especificados.

Mantenha a estrutura e conteúdo original, apenas aplique as formatações acima.

Retorne APENAS as descrições formatadas, uma para cada experiência, no formato JSON.`;

    const userPrompt = experiencias.map((exp, i) => 
      `Experiência ${i + 1} (${exp.empresa} - ${exp.cargo}):\n${exp.descricao}`
    ).join('\n\n---\n\n');

    console.log("Calling AI to format experiences...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "format_experiences",
              description: "Retorna as descrições formatadas para cada experiência",
              parameters: {
                type: "object",
                properties: {
                  formatted_experiences: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        empresa: { type: "string" },
                        cargo: { type: "string" },
                        descricao_formatada: { type: "string" }
                      },
                      required: ["empresa", "cargo", "descricao_formatada"]
                    }
                  }
                },
                required: ["formatted_experiences"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "format_experiences" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", data);
      throw new Error("Resposta inválida da IA");
    }

    const args = JSON.parse(toolCall.function.arguments);
    console.log("Formatted experiences:", args.formatted_experiences?.length);

    return new Response(
      JSON.stringify({ 
        formatted_experiences: args.formatted_experiences.map((exp: any, i: number) => ({
          empresa: experiencias[i]?.empresa || exp.empresa,
          cargo: experiencias[i]?.cargo || exp.cargo,
          descricao_formatada: exp.descricao_formatada
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in format-gupy-experiences:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao formatar experiências" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
