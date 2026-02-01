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

    const { experiences, linkedinAbout, companyName, jobDescription, keywords } = await req.json();

    console.log("Generating interview scripts for user:", user.id);
    console.log("Keywords count:", keywords?.length || 0);
    console.log("Target company:", companyName);
    console.log("Experiences text length:", experiences?.length || 0);

    if (!keywords || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma palavra-chave fornecida", scripts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um mentor de carreira experiente do Método Perfil Glorioso. Sua tarefa é criar roteiros de entrevista personalizados.

PERSONALIDADE:
- Fale de forma natural, como se fosse o próprio candidato falando
- Use linguagem conversacional e fluida
- Mantenha a autenticidade - baseie-se APENAS nas informações fornecidas

ESTRUTURA DOS ROTEIROS:
Cada roteiro deve seguir: [O QUE fez] + [COMO fez] + [RESULTADO obtido]

REGRAS CRÍTICAS:
1. EXTRAIA TODAS AS EXPERIÊNCIAS do texto fornecido (cada empresa/cargo é uma experiência)
2. Para cada palavra-chave, conecte com a experiência MAIS RELEVANTE
3. Distribua os scripts entre TODAS as empresas mencionadas - não concentre em apenas uma
4. Se o candidato trabalhou em 3 empresas, gere scripts para todas elas
5. NÃO invente métricas ou resultados que não foram mencionados
6. Use primeira pessoa ("Eu fiz...", "Implementei...", "Liderei...")
7. Mantenha cada roteiro entre 50-100 palavras

EXEMPLO:
Se o candidato trabalhou na Empresa A como Gerente e na Empresa B como Analista, e temos 6 palavras-chave, distribua os scripts proporcionalmente entre as empresas.`;

    const userPrompt = `Analise as experiências do candidato e crie roteiros de entrevista.

EMPRESA ALVO DA ENTREVISTA: ${companyName || "Não especificada"}

DESCRIÇÃO DA VAGA:
${jobDescription || "Não fornecida"}

PERFIL DO CANDIDATO (Sobre do LinkedIn):
${linkedinAbout || "Não fornecido"}

EXPERIÊNCIAS PROFISSIONAIS DO CANDIDATO:
${experiences || "Não fornecidas"}

---

PALAVRAS-CHAVE DA VAGA (${keywords.length} no total):
${keywords.join(', ')}

---

INSTRUÇÕES:
1. Primeiro, identifique TODAS as empresas e cargos mencionados nas experiências
2. Para cada palavra-chave, escolha a experiência mais relevante para criar o roteiro
3. Distribua os scripts entre TODAS as empresas do candidato
4. Gere UM roteiro para cada palavra-chave (${keywords.length} roteiros no total)

Retorne os roteiros no formato estruturado, incluindo nome da empresa e cargo para cada um.`;

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
              name: "generate_scripts",
              description: "Gera roteiros de entrevista personalizados distribuídos entre todas as experiências",
              parameters: {
                type: "object",
                properties: {
                  scripts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword: {
                          type: "string",
                          description: "A palavra-chave da vaga"
                        },
                        company: {
                          type: "string",
                          description: "Nome da empresa onde o candidato teve esta experiência"
                        },
                        role: {
                          type: "string",
                          description: "Cargo do candidato nesta empresa"
                        },
                        script: {
                          type: "string",
                          description: "O roteiro completo na estrutura O QUE + COMO + RESULTADO"
                        }
                      },
                      required: ["keyword", "company", "role", "script"],
                      additionalProperties: false
                    },
                    description: "Lista de roteiros, um para cada palavra-chave, distribuídos entre as experiências"
                  }
                },
                required: ["scripts"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_scripts" } },
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

    // Extract scripts from tool call response
    let scripts: any[] = [];
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        scripts = args.scripts || [];
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }

    // Fallback: try to parse from content
    if (scripts.length === 0 && data.choices?.[0]?.message?.content) {
      console.log("Trying fallback parsing from content...");
      const content = data.choices[0].message.content;
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          scripts = JSON.parse(match[0]);
        } catch (e) {
          console.error("Error parsing content as JSON:", e);
        }
      }
    }

    // Format the response
    const formattedScripts = scripts.map((script: any) => ({
      keyword: script.keyword,
      experience: `${script.role} — ${script.company}`,
      company: script.company || '',
      role: script.role || '',
      script: script.script
    }));

    // Log distribution of scripts across companies
    const companyCounts: Record<string, number> = {};
    formattedScripts.forEach((s: any) => {
      companyCounts[s.company] = (companyCounts[s.company] || 0) + 1;
    });
    console.log("Scripts distribution by company:", companyCounts);
    console.log("Generated scripts count:", formattedScripts.length);

    return new Response(
      JSON.stringify({ scripts: formattedScripts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-interview-scripts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
