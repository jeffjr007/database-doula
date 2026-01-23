import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface Experience {
  company: string;
  role: string;
  description: string;
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

    const { keywords, experiences, linkedinAbout, companyName, jobDescription } = await req.json();

    console.log("Generating interview scripts for user:", user.id);
    console.log("Keywords count:", keywords?.length || 0);
    console.log("Experiences length:", experiences?.length || 0);
    console.log("Target company:", companyName);

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
4. Conecte cada palavra-chave da vaga com uma experiência real do candidato
5. Use primeira pessoa ("Eu fiz...", "Implementei...", "Liderei...")
6. Mantenha cada roteiro entre 50-80 palavras
7. Distribua as palavras-chave entre as diferentes experiências do candidato
8. Se uma palavra-chave não tem conexão clara com as experiências, adapte de forma natural

EXEMPLO DE ROTEIRO BOM:
"Quando trabalhei na [Empresa], fui responsável por [O QUE]. Para isso, implementei [COMO - metodologia/processo/ferramenta], o que resultou em [RESULTADO - impacto concreto ou qualitativo]."

EXEMPLO RUIM (genérico demais):
"Tenho experiência em gestão de projetos e trabalho bem em equipe."`;

    const userPrompt = `Analise as informações do candidato e crie roteiros de entrevista personalizados.

EMPRESA ALVO: ${companyName || "Não especificada"}

DESCRIÇÃO DA VAGA:
${jobDescription || "Não fornecida"}

PERFIL DO CANDIDATO (Sobre do LinkedIn):
${linkedinAbout || "Não fornecido"}

EXPERIÊNCIAS PROFISSIONAIS:
${experiences || "Não fornecidas"}

PALAVRAS-CHAVE DA VAGA QUE DEVEM SER ABORDADAS:
${keywords?.join(", ") || "Nenhuma"}

---

Agora, crie roteiros de entrevista para CADA uma das ${keywords?.length || 0} palavras-chave acima. 

Para cada roteiro:
1. Identifique qual experiência do candidato melhor se conecta com a palavra-chave
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
              description: "Gera roteiros de entrevista personalizados para cada palavra-chave",
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
                        experience: {
                          type: "string",
                          description: "A experiência usada (cargo na empresa)"
                        },
                        script: {
                          type: "string",
                          description: "O roteiro completo na estrutura O QUE + COMO + RESULTADO"
                        }
                      },
                      required: ["keyword", "experience", "script"],
                      additionalProperties: false
                    },
                    description: "Lista de roteiros, um para cada palavra-chave"
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

    console.log("Generated scripts count:", scripts.length);

    return new Response(
      JSON.stringify({ scripts }),
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
