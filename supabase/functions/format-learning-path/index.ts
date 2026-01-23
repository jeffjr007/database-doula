import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return unauthorizedResponse(authError || "Não autorizado");
    }

    const { rawContent } = await req.json();
    
    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: "Raw content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Formatting learning path for user:", user.id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente especializado em organizar trilhas de desenvolvimento profissional.

Sua tarefa é receber um texto bruto contendo uma trilha de cursos e organizar em um formato JSON estruturado.

REGRAS IMPORTANTES:
1. Identifique os módulos (geralmente começam com 🔹 MÓDULO ou similar)
2. Para cada módulo, extraia:
   - Título do módulo
   - Foco/Objetivo do módulo
   - Lista de cursos com nome e URL
3. URLs devem ser extraídas exatamente como aparecem no texto
4. Mantenha a ordem original dos módulos e cursos
5. Se um curso não tiver URL, deixe a URL vazia

FORMATO DE SAÍDA (JSON):
{
  "modules": [
    {
      "title": "Nome do Módulo",
      "focus": "Descrição do foco",
      "courses": [
        {
          "name": "Nome do Curso",
          "url": "https://url-do-curso.com"
        }
      ]
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON válido, sem markdown ou texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Organize esta trilha de desenvolvimento:\n\n${rawContent}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response
    let formattedPath;
    try {
      // Try to extract JSON from the response (in case there's surrounding text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        formattedPath = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(
      JSON.stringify({ formattedPath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error formatting learning path:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
