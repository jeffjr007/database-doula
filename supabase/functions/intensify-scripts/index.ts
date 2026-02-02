import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface OriginalScript {
  keyword: string;
  originalScript: string;
  experience: string;
}

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

    const { scripts, companyName, jobTitle } = await req.json();

    console.log("Intensifying scripts for user:", user.id);
    console.log("Scripts count:", scripts?.length || 0);
    console.log("Target company:", companyName);

    if (!scripts || scripts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum roteiro fornecido", intensifiedScripts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from original scripts
    const scriptsContext = scripts.map((s: OriginalScript, i: number) => 
      `${i + 1}. Palavra-chave: "${s.keyword}"
   Experiência: ${s.experience}
   Roteiro original: "${s.originalScript}"`
    ).join('\n\n');

    const systemPrompt = `Você é um mentor de carreira experiente do Método Perfil Glorioso. Sua tarefa é INTENSIFICAR roteiros de entrevista adicionando detalhes técnicos sobre o COMO.

CONTEXTO:
- Gestores querem saber COMO você fez as coisas, não apenas O QUE fez
- Eles precisam ver que você tem MÉTODO e domínio técnico
- A intensificação transforma um roteiro genérico em algo que mostra expertise

O QUE ADICIONAR NA INTENSIFICAÇÃO:
1. FERRAMENTAS ESPECÍFICAS: nomes de softwares, linguagens, plataformas (Excel, Python, Power BI, Jira, etc.)
2. METODOLOGIAS: frameworks usados (Scrum, Lean, Six Sigma, OKRs, etc.)
3. PROCESSOS: etapas que você seguiu para chegar ao resultado
4. MÉTRICAS DETALHADAS: números específicos quando possível (%, R$, tempo, volume)
5. LINGUAGEM TÉCNICA: termos da área que mostram domínio

REGRAS:
- Mantenha a primeira pessoa ("Utilizei...", "Apliquei...")
- Seja específico mas conciso (máximo 3-4 frases por intensificação)
- Baseie-se no roteiro original - não invente informações completamente novas
- Se não houver informação suficiente, faça sugestões plausíveis baseadas no contexto
- Foque em mostrar METODOLOGIA e PROCESSO`;

    const userPrompt = `EMPRESA ALVO: ${companyName || "Não especificada"}
CARGO ALVO: ${jobTitle || "Não especificado"}

ROTEIROS PARA INTENSIFICAR:
${scriptsContext}

---

Para cada roteiro, crie uma versão intensificada que mostra COMO você fez, incluindo:
- Ferramentas e tecnologias utilizadas
- Metodologias aplicadas
- Processo/passos seguidos
- Métricas e resultados detalhados

A intensificação deve complementar o roteiro original, não substituí-lo.`;

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
              name: "intensify_scripts",
              description: "Intensifica roteiros de entrevista com detalhes técnicos sobre o COMO",
              parameters: {
                type: "object",
                properties: {
                  intensifiedScripts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword: {
                          type: "string",
                          description: "A palavra-chave original"
                        },
                        intensifiedHow: {
                          type: "string",
                          description: "Descrição intensificada do COMO, com ferramentas, metodologias e métricas"
                        }
                      },
                      required: ["keyword", "intensifiedHow"],
                      additionalProperties: false
                    },
                    description: "Lista de roteiros intensificados"
                  }
                },
                required: ["intensifiedScripts"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "intensify_scripts" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract intensified scripts from tool call response
    let intensifiedScripts: any[] = [];
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        intensifiedScripts = args.intensifiedScripts || [];
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }

    // Fallback: try to parse from content
    if (intensifiedScripts.length === 0 && data.choices?.[0]?.message?.content) {
      console.log("Trying fallback parsing from content...");
      const content = data.choices[0].message.content;
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          intensifiedScripts = JSON.parse(match[0]);
        } catch (e) {
          console.error("Error parsing content as JSON:", e);
        }
      }
    }

    console.log("Intensified scripts count:", intensifiedScripts.length);

    return new Response(
      JSON.stringify({ intensifiedScripts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in intensify-scripts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
