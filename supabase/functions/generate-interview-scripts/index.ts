import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface ExperienceMapping {
  keyword: string;
  company: string;
  role: string;
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

    const { experiences, linkedinAbout, companyName, jobDescription, experiencesMapping } = await req.json();

    // CRITICAL: Use experiencesMapping which contains ONLY the selected keywords with their company/role
    const selectedMappings: ExperienceMapping[] = experiencesMapping || [];
    
    console.log("Generating interview scripts for user:", user.id);
    console.log("Selected keywords with experiences:", selectedMappings.length);
    console.log("Mappings detail:", JSON.stringify(selectedMappings));
    console.log("Target company:", companyName);

    if (selectedMappings.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma palavra-chave selecionada", scripts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um mentor de carreira experiente e empático do Método Perfil Glorioso. Sua tarefa é criar roteiros de entrevista personalizados e autênticos para o candidato.

PERSONALIDADE:
- Fale de forma natural, como se fosse o próprio candidato falando
- Use linguagem conversacional e fluida
- Nunca pareça robótico ou genérico
- Mantenha a autenticidade - use apenas informações que o candidato forneceu

ESTRUTURA DOS ROTEIROS:
Cada roteiro deve seguir a estrutura: [O QUE fez] + [COMO fez] + [RESULTADO obtido]

REGRAS CRÍTICAS:
1. Crie roteiros baseados APENAS nas experiências reais fornecidas pelo candidato
2. NÃO invente métricas, números ou resultados que não foram mencionados
3. Se o candidato não mencionou resultados específicos, use linguagem qualitativa (ex: "aumentando significativamente", "melhorando consideravelmente")
4. Use primeira pessoa ("Eu fiz...", "Implementei...", "Liderei...")
5. Mantenha cada roteiro entre 50-80 palavras

EXEMPLO DE ROTEIRO BOM:
"Quando trabalhei na [Empresa], fui responsável por [O QUE]. Para isso, implementei [COMO - metodologia/processo/ferramenta], o que resultou em [RESULTADO - impacto concreto ou qualitativo]."

EXEMPLO RUIM (genérico demais):
"Tenho experiência em gestão de projetos e trabalho bem em equipe."`;

    // Build a precise list of what to generate
    const keywordsWithContext = selectedMappings.map((m: ExperienceMapping) => 
      `- Palavra-chave: "${m.keyword}" → Experiência: ${m.role} na ${m.company}`
    ).join("\n");

    const userPrompt = `Analise as informações do candidato e crie roteiros de entrevista personalizados.

EMPRESA ALVO: ${companyName || "Não especificada"}

DESCRIÇÃO DA VAGA:
${jobDescription || "Não fornecida"}

PERFIL DO CANDIDATO (Sobre do LinkedIn):
${linkedinAbout || "Não fornecido"}

EXPERIÊNCIAS PROFISSIONAIS:
${experiences || "Não fornecidas"}

---

PALAVRAS-CHAVE SELECIONADAS E EXPERIÊNCIAS ASSOCIADAS:
${keywordsWithContext}

---

INSTRUÇÕES:
Crie UM roteiro para CADA item da lista acima (${selectedMappings.length} roteiros no total).
Para cada roteiro, use APENAS a experiência indicada (empresa e cargo) para aquela palavra-chave.

Para cada roteiro:
1. Use APENAS a experiência associada àquela palavra-chave
2. Crie uma fala natural na estrutura [O QUE + COMO + RESULTADO]
3. Use linguagem de primeira pessoa
4. Seja específico mas autêntico às informações fornecidas

Retorne os roteiros no formato estruturado.`;

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
              description: "Gera roteiros de entrevista personalizados para cada palavra-chave selecionada",
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
                          description: "Nome da empresa da experiência"
                        },
                        role: {
                          type: "string",
                          description: "Cargo na empresa"
                        },
                        script: {
                          type: "string",
                          description: "O roteiro completo na estrutura O QUE + COMO + RESULTADO"
                        }
                      },
                      required: ["keyword", "company", "role", "script"],
                      additionalProperties: false
                    },
                    description: "Lista de roteiros, um para cada palavra-chave selecionada"
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

    // Map the response to include experience info from original mapping
    const enhancedScripts = scripts.map((script: any) => {
      const mapping = selectedMappings.find((m: ExperienceMapping) => 
        m.keyword.toLowerCase() === script.keyword?.toLowerCase()
      );
      return {
        keyword: script.keyword,
        experience: mapping ? `${mapping.role} — ${mapping.company}` : script.experience || "",
        company: mapping?.company || script.company || "",
        role: mapping?.role || script.role || "",
        script: script.script
      };
    });

    console.log("Generated scripts count:", enhancedScripts.length);

    return new Response(
      JSON.stringify({ scripts: enhancedScripts }),
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
