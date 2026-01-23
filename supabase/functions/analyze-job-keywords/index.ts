import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return unauthorizedResponse(authError || "Não autorizado");
    }

    const { jobDescription, linkedinAbout, experiences } = await req.json();

    console.log("Analyzing job keywords for user:", user.id);
    console.log("Job description length:", jobDescription?.length || 0);
    console.log("LinkedIn about length:", linkedinAbout?.length || 0);
    console.log("Experiences length:", experiences?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em recrutamento e preparação para entrevistas. Sua tarefa é identificar as habilidades e competências que o candidato JÁ POSSUI e que são relevantes para a vaga.

FOCO PRINCIPAL: Extraia palavras-chave baseadas no que o candidato REALMENTE sabe fazer, não no que a vaga pede.

REGRAS IMPORTANTES:
1. Analise PRIMEIRO as experiências e perfil do candidato
2. Depois cruze com os requisitos da vaga
3. Extraia APENAS habilidades que o candidato DEMONSTRA ter
4. NUNCA inclua nomes de empresas, pessoas ou localizações
5. Foque em: 
   - Habilidades técnicas que o candidato já usou (ex: Python, Excel, SQL)
   - Competências comportamentais demonstradas nas experiências (ex: liderança, comunicação)
   - Metodologias e ferramentas que ele já trabalhou (ex: Scrum, Power BI)
   - Resultados e conquistas mencionados
6. Retorne entre 15 e 20 palavras-chave (mínimo obrigatório: 15)
7. Priorize termos que o candidato pode comprovar com exemplos reais
8. Seja abrangente: inclua variações e termos relacionados para maximizar a cobertura
8. Se a vaga pede algo que o candidato NÃO tem experiência, NÃO inclua`;

    const userPrompt = `Analise o perfil e experiências deste candidato:

PERFIL:
${linkedinAbout}

EXPERIÊNCIAS:
${experiences}

VAGA (para contexto de relevância):
${jobDescription}

Com base no que o candidato REALMENTE fez e sabe, liste as palavras-chave mais relevantes para ele usar no roteiro de entrevista.

IMPORTANTE: 
- Foque no que ELE SABE, não no que a vaga pede
- Extraia apenas habilidades que ele pode comprovar com suas experiências
- NÃO inclua nomes de empresas, pessoas ou localizações`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_keywords",
              description: "Extrai as palavras-chave mais relevantes para preparação de entrevista",
              parameters: {
                type: "object",
                properties: {
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de 15-20 palavras-chave relevantes para a entrevista (mínimo 15)"
                  }
                },
                required: ["keywords"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_keywords" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data, null, 2));

    // Extract keywords from tool call response
    let keywords: string[] = [];
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        keywords = args.keywords || [];
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }

    // Fallback: try to extract from content if tool call failed
    if (keywords.length === 0 && data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      // Try to parse as JSON array
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          keywords = JSON.parse(match[0]);
        } catch (e) {
          console.error("Error parsing content as JSON:", e);
        }
      }
    }

    console.log("Extracted keywords:", keywords);

    return new Response(
      JSON.stringify({ keywords }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-job-keywords:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
