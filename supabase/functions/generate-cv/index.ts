import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um especialista em criação de currículos personalizados estratégicos para o mercado brasileiro, seguindo o Método Perfil Glorioso.

Você receberá:
- experiences: experiências profissionais do CV atual do candidato
- educacao: formação acadêmica e certificações do candidato
- jobDescription: descrição da vaga alvo para personalização

Seu objetivo: Criar um currículo PERSONALIZADO para a vaga, reescrevendo as experiências para incluir palavras-chave da vaga SEM INVENTAR FATOS.

ESTRUTURA OBRIGATÓRIA DO CURRÍCULO:

1. SUMÁRIO (sumario):
   - paragrafos: 2 parágrafos de apresentação profissional mostrando senioridade e expertise
   - bullets: exatamente 4-5 tópicos com resultados e conquistas principais

2. SISTEMAS (sistemas): exatamente 4 ferramentas/sistemas que o candidato domina

3. SKILLS (skills): exatamente 4 habilidades técnicas principais

4. COMPETÊNCIAS (competencias): exatamente 4 competências comportamentais/soft skills

5. REALIZAÇÕES (realizacoes): exatamente 6 realizações com métricas e resultados quantificáveis

6. EDUCAÇÃO (educacao): formação acadêmica e certificações (limpar duplicatas)

7. EXPERIÊNCIAS (experiencias): TODAS as experiências profissionais do candidato com bullets reescritos contendo palavras-chave da vaga

REGRAS CRÍTICAS:
- NUNCA omitir experiências do candidato - incluir TODAS
- NUNCA inventar empresas, cargos, ferramentas ou resultados
- Cada bullet de experiência deve conter ao menos 1 palavra-chave da vaga
- Manter a estrutura: empresa, cargo, período, bullets
- Reescrever bullets conectando as experiências reais às palavras-chave da vaga
- Priorizar resultados quantificáveis (%, números, métricas)

IMPORTANTE: Responda APENAS via tool call, sem texto adicional.`;

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { experiences, jobDescription, educacao } = await req.json();

    if (!experiences || String(experiences).trim().length < 50) {
      return json({ error: "Experiências insuficientes para gerar o currículo." }, 400);
    }
    if (!jobDescription || String(jobDescription).trim().length < 50) {
      return json({ error: "Descrição da vaga insuficiente." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

    const userPrompt = `Esse é o meu CV atual:

EXPERIÊNCIAS PROFISSIONAIS:
${String(experiences).substring(0, 22000)}

EDUCAÇÃO E QUALIFICAÇÕES:
${String(educacao || "Não informado").substring(0, 12000)}

---

Essa é a vaga na qual eu preciso enviar um CV personalizado:

${String(jobDescription).substring(0, 22000)}

---

Baseado em minhas experiências e no que essa vaga pede, refaça minhas experiências respeitando minhas habilidades, ferramentas, conhecimentos e resultados entregues, mas que tenha presente em cada descrição de bullet point palavras-chaves que essa vaga pede.

Crie o currículo completo seguindo a estrutura exata definida no schema da ferramenta.`;

    const toolSchema = {
      type: "function",
      function: {
        name: "generate_cv",
        description: "Gera CV estruturado para o template do app.",
        parameters: {
          type: "object",
          properties: {
            sumario: {
              type: "object",
              properties: {
                paragrafos: { type: "array", items: { type: "string" } },
                bullets: { type: "array", items: { type: "string" } },
              },
              required: ["paragrafos", "bullets"],
              additionalProperties: false,
            },
            sistemas: { type: "array", items: { type: "string" } },
            skills: { type: "array", items: { type: "string" } },
            competencias: { type: "array", items: { type: "string" } },
            realizacoes: { type: "array", items: { type: "string" } },
            educacao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  curso: { type: "string" },
                  instituicao: { type: "string" },
                },
                required: ["curso", "instituicao"],
                additionalProperties: false,
              },
            },
            experiencias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  empresa: { type: "string" },
                  cargo: { type: "string" },
                  periodo: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                },
                required: ["empresa", "cargo", "periodo", "bullets"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "sumario",
            "sistemas",
            "skills",
            "competencias",
            "realizacoes",
            "educacao",
            "experiencias",
          ],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "generate_cv" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("generate-cv: AI gateway error", resp.status, t);
      if (resp.status === 429) return json({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }, 429);
      if (resp.status === 402) return json({ error: "Créditos insuficientes. Adicione créditos na sua conta." }, 402);
      return json({ error: "Falha ao gerar currículo com IA." }, 500);
    }

    const data = await resp.json();
    const toolCalls = data?.choices?.[0]?.message?.tool_calls;
    const argsStr = toolCalls?.[0]?.function?.arguments;

    if (!argsStr) {
      console.error("generate-cv: missing tool_calls", JSON.stringify(data)?.slice(0, 500));
      return json({ error: "A IA não retornou dados estruturados. Tente novamente." }, 500);
    }

    let cv: any;
    try {
      cv = JSON.parse(argsStr);
    } catch (e) {
      console.error("generate-cv: tool args parse error", e, argsStr?.slice(0, 500));
      return json({ error: "Erro ao interpretar resposta da IA. Tente novamente." }, 500);
    }

    return json({ cv });
  } catch (e) {
    console.error("generate-cv: unhandled error", e);
    return json({ error: e instanceof Error ? e.message : "Erro ao gerar CV" }, 500);
  }
});
