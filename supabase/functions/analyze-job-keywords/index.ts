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

    const systemPrompt = `Você é um especialista em recrutamento e preparação para entrevistas. Sua tarefa é extrair palavras-chave de uma descrição de vaga que o candidato deve usar para criar seu roteiro de entrevista.

REGRAS IMPORTANTES:
1. Extraia APENAS palavras-chave técnicas e comportamentais relevantes para a ENTREVISTA
2. NUNCA inclua nomes de empresas (ex: Magazine Luiza, Nubank, Google, etc.)
3. NUNCA inclua nomes de pessoas
4. NUNCA inclua localizações geográficas
5. Foque em: 
   - Habilidades técnicas (ex: Python, Excel, SQL, análise de dados)
   - Competências comportamentais (ex: liderança, trabalho em equipe, comunicação)
   - Metodologias e frameworks (ex: Scrum, Agile, Lean)
   - Ferramentas e tecnologias (ex: Power BI, SAP, Salesforce)
   - Áreas de conhecimento (ex: gestão de projetos, marketing digital)
6. Retorne entre 10 e 15 palavras-chave
7. Priorize termos que o candidato possa conectar com suas experiências
8. Cada palavra-chave deve ser um termo que faça sentido o candidato abordar na entrevista`;

    const userPrompt = `Faça uma análise dessa vaga:

${jobDescription}

Esse é o meu perfil e minhas experiências:

${linkedinAbout}

${experiences}

Liste todas as palavras-chave da vaga para que eu possa criar o meu roteiro de entrevista. Liste as palavras-chave que eu deva conectar com minhas experiências profissionais e perfil.

IMPORTANTE: NÃO inclua nomes de empresas, pessoas ou localizações. Apenas termos técnicos, habilidades e competências.`;

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
