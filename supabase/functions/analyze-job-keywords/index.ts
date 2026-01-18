import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, linkedinAbout, experiences } = await req.json();

    console.log("Analyzing job keywords...");
    console.log("Job description length:", jobDescription?.length || 0);
    console.log("LinkedIn about length:", linkedinAbout?.length || 0);
    console.log("Experiences length:", experiences?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em recrutamento e seleção. Sua tarefa é analisar uma descrição de vaga e o perfil de um candidato para extrair as palavras-chave mais importantes que o candidato deve abordar em uma entrevista.

Regras:
1. Extraia APENAS palavras-chave ou termos curtos (1-4 palavras)
2. Foque em: habilidades técnicas, competências comportamentais, ferramentas, metodologias, e requisitos específicos da vaga
3. Retorne entre 8 e 15 palavras-chave
4. Priorize termos que aparecem tanto na vaga quanto no perfil do candidato
5. Inclua também termos importantes da vaga que o candidato deveria destacar`;

    const userPrompt = `Analise a vaga e o perfil abaixo e extraia as palavras-chave mais relevantes para preparação de entrevista.

## DESCRIÇÃO DA VAGA:
${jobDescription}

## PERFIL DO CANDIDATO (Sobre do LinkedIn):
${linkedinAbout}

## EXPERIÊNCIAS DO CANDIDATO:
${experiences}

Retorne as palavras-chave mais importantes que o candidato deve abordar na entrevista.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
                    description: "Lista de 8-15 palavras-chave relevantes para a entrevista"
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
