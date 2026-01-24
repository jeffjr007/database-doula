import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return unauthorizedResponse(authError || "Não autorizado");
    }

    const { linkedinAbout } = await req.json();

    console.log("Generating career intro for user:", user.id);

    if (!linkedinAbout || linkedinAbout.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Texto 'Sobre' muito curto", intro: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um extrator de informações de perfis profissionais. Sua tarefa é analisar o texto "Sobre" do LinkedIn de um candidato e extrair informações para criar uma breve introdução de carreira.

REGRAS CRÍTICAS:
1. Extraia APENAS informações que estejam EXPLICITAMENTE mencionadas no texto
2. NÃO invente dados que não existem
3. Retorne null para campos que não puderem ser identificados
4. Seja preciso e objetivo`;

    const userPrompt = `Analise o seguinte texto "Sobre" do LinkedIn e extraia as informações solicitadas:

TEXTO SOBRE:
${linkedinAbout}

---

Extraia as seguintes informações (apenas se estiverem claramente mencionadas):
1. Idade de início da carreira (se mencionada)
2. Área de formação/graduação
3. Tempo total de experiência profissional
4. Principal área de atuação

Retorne os dados encontrados.`;

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
              name: "extract_career_info",
              description: "Extrai informações de carreira do texto Sobre do LinkedIn",
              parameters: {
                type: "object",
                properties: {
                  careerStartAge: {
                    type: "string",
                    description: "Idade em que começou a carreira, ou null se não mencionada"
                  },
                  education: {
                    type: "string",
                    description: "Formação acadêmica principal (ex: Administração, Engenharia), ou null"
                  },
                  yearsOfExperience: {
                    type: "string",
                    description: "Tempo de experiência (ex: 5 anos, mais de 10 anos), ou null"
                  },
                  mainField: {
                    type: "string",
                    description: "Principal área de atuação profissional"
                  },
                  introText: {
                    type: "string",
                    description: "Uma introdução em 2-3 frases curtas mencionando apenas os dados encontrados. Use formato: 'Comecei minha carreira com X anos...' ou 'Sou formado(a) em X...' conforme os dados disponíveis. Seja natural e humanizado. Se poucos dados, foque no que foi encontrado."
                  }
                },
                required: ["introText"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_career_info" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    let result = {
      careerStartAge: null as string | null,
      education: null as string | null,
      yearsOfExperience: null as string | null,
      mainField: null as string | null,
      introText: null as string | null
    };
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        result = {
          careerStartAge: args.careerStartAge || null,
          education: args.education || null,
          yearsOfExperience: args.yearsOfExperience || null,
          mainField: args.mainField || null,
          introText: args.introText || null
        };
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }

    console.log("Extracted career info:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-career-intro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
