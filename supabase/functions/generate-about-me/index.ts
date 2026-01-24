import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface AboutMeInput {
  nome: string;
  idade: string;
  localizacao: string;
  estadoCivil: string;
  hobbies: string;
  metas: string;
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

    const { nome, idade, localizacao, estadoCivil, hobbies, metas }: AboutMeInput = await req.json();

    console.log("Generating 'About Me' script for user:", user.id);
    console.log("Input data:", { nome, idade, localizacao, estadoCivil });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um mentor de carreira experiente do Método Perfil Glorioso. Sua tarefa é criar um roteiro de resposta para a pergunta "Me fale sobre você" em entrevistas de emprego.

OBJETIVO:
Criar uma resposta pessoal e autêntica que demonstre disciplina, foco e características que recrutadores valorizam, conectando hobbies e metas pessoais a benefícios profissionais.

ESTILO DE ESCRITA:
- Natural, humano e direto
- Evite termos formais ou robóticos
- Soe como uma conversa fluida
- Use primeira pessoa
- O candidato deve se apresentar com confiança

ESTRUTURA DA RESPOSTA:
1. Apresentação básica (nome, idade, localização)
2. Situação pessoal (estado civil, moradia)
3. Hobbies conectados a disciplina/foco (mostrar como beneficiam o trabalho)
4. Metas pessoais conectadas a crescimento profissional
5. Fechamento natural que demonstre dedicação

GATILHOS MENTAIS A USAR:
- Disciplina: rotina, consistência, compromisso
- Foco: organização, priorização, objetivos claros
- Resiliência: superação, persistência, adaptabilidade
- Vontade de aprender: curiosidade, desenvolvimento contínuo

REGRAS:
1. Conecte CADA hobby/meta a um benefício profissional de forma natural
2. NÃO use bullet points - escreva em parágrafos fluidos
3. Mantenha entre 100-150 palavras
4. Use linguagem conversacional, como se estivesse realmente falando
5. Mostre que hábitos pessoais refletem postura profissional`;

    const userPrompt = `Crie um roteiro de "Me fale sobre você" com estas informações:

NOME: ${nome}
IDADE: ${idade}
LOCALIZAÇÃO: ${localizacao}
ESTADO CIVIL/FILHOS: ${estadoCivil}
HOBBIES: ${hobbies}
METAS PESSOAIS: ${metas}

Gere uma resposta natural e fluida que conecte os hobbies e metas a características profissionais valorizadas por recrutadores.`;

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

    const script = data.choices?.[0]?.message?.content || "";

    console.log("Generated script length:", script.length);

    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-about-me:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
