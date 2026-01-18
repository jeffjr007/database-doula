import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um especialista em AJUSTE de currículos para o mercado brasileiro.

FUNÇÃO: Você é um AJUSTADOR de CV, NÃO um criador. Sua tarefa é pegar o CV existente do candidato e ajustar os textos para incluir palavras-chave da vaga alvo.

Você receberá:
- experiences: experiências profissionais REAIS do candidato (extraídas do CV dele)
- educacao: formação acadêmica REAL do candidato
- jobDescription: descrição da vaga para a qual ele está se candidatando

REGRAS ABSOLUTAS:
1. NUNCA INVENTE - Use APENAS informações que estão no CV original
2. NUNCA OMITA experiências - Mantenha TODAS as empresas, cargos e períodos exatamente como vieram
3. REESCREVA os bullets - Reformule para incluir palavras-chave da vaga, mantendo o mesmo significado
4. MANTENHA métricas e resultados originais - Se o candidato mencionou "aumento de 20%", mantenha
5. NÃO adicione ferramentas/sistemas que o candidato não mencionou
6. Educação: organize e limpe duplicatas, mas não invente cursos

ESTRATÉGIA DE AJUSTE:
- Identifique as palavras-chave técnicas e comportamentais da vaga
- Reformule cada bullet para naturalmente incluir termos relevantes
- Priorize verbos de ação: implementei, liderei, desenvolvi, otimizei, gerenciei
- Mantenha a essência do que o candidato REALMENTE fez

SEÇÕES A GERAR:
- sumario: 2 parágrafos estratégicos + 4 bullets baseados nas experiências reais
- sistemas: ferramentas que o candidato MENCIONOU (max 6)
- skills: habilidades técnicas REAIS do candidato (max 6)
- competencias: comportamentais inferidas das experiências (max 6)
- realizacoes: 6 conquistas REAIS com métricas do CV original
- educacao: formações REAIS organizadas
- experiencias: TODAS as experiências com bullets AJUSTADOS

IMPORTANTE: Responda APENAS via tool call.`;

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

    const userPrompt = `Gere o currículo com base nos dados abaixo.\n\nEXPERIÊNCIAS:\n${String(experiences).substring(0, 22000)}\n\nVAGA ALVO:\n${String(jobDescription).substring(0, 22000)}\n\nEDUCAÇÃO:\n${String(educacao || "").substring(0, 12000)}\n\nSaída: use o schema exigido pela ferramenta.`;

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
