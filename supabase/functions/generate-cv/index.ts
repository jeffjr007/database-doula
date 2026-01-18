import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um especialista PREMIUM em criação de currículos personalizados estratégicos para o mercado brasileiro, seguindo o Método Perfil Glorioso.

VOCÊ RECEBERÁ:
1. experiences: As experiências profissionais REAIS do candidato (extraídas do CV dele)
2. educacao: A formação acadêmica e certificações REAIS do candidato
3. jobDescription: A descrição da vaga alvo para personalização

SEU OBJETIVO PRINCIPAL:
Reescrever as experiências profissionais do candidato MANTENDO todos os fatos reais (empresas, cargos, períodos), mas INSERINDO palavras-chave da vaga em cada bullet point.

ESTRUTURA OBRIGATÓRIA DO CURRÍCULO (MÉTODO PERFIL GLORIOSO):

1. SUMÁRIO (sumario):
   - paragrafos: 2 parágrafos de apresentação profissional mostrando senioridade e expertise
   - bullets: EXATAMENTE 4 tópicos com RESULTADOS e CONQUISTAS quantificáveis

2. SISTEMAS (sistemas): EXATAMENTE 4 ferramentas/sistemas que o candidato domina (extrair do CV ou inferir da área)

3. SKILLS (skills): EXATAMENTE 4 habilidades técnicas principais

4. COMPETÊNCIAS (competencias): EXATAMENTE 4 competências comportamentais/soft skills

5. REALIZAÇÕES (realizacoes): EXATAMENTE 6 realizações com MÉTRICAS e RESULTADOS quantificáveis

6. EDUCAÇÃO (educacao): Formação acadêmica e certificações do candidato (usar os dados recebidos, limpar duplicatas)

7. EXPERIÊNCIAS (experiencias): TODAS as experiências profissionais do candidato reescritas

REGRAS CRÍTICAS PARA EXPERIÊNCIAS:
- Incluir TODAS as experiências do candidato (NUNCA omitir nenhuma)
- NUNCA inventar empresas, cargos, ferramentas ou resultados
- Cada experiência deve ter entre 3 e 6 bullets NO MÁXIMO
- SELECIONAR os bullets mais relevantes para a vaga (não incluir todos, apenas os melhores)
- REESCREVER os bullets selecionados inserindo palavras-chave da vaga
- PRIORIZAR bullets com resultados quantificáveis (%, números, métricas)
- Bullets devem ser concisos e impactantes (máximo 2 linhas cada)

REGRA DE SELEÇÃO DE BULLETS:
Para cada experiência do candidato:
1. Analise todos os bullets originais
2. Identifique os 3 a 6 mais relevantes para a vaga
3. Reescreva apenas esses bullets com palavras-chave da vaga
4. Descarte os bullets menos relevantes

EXEMPLO:
Se o candidato tem 15 bullets em uma experiência, selecione apenas os 4-6 mais relevantes para a vaga e reescreva-os.

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

=== MINHAS EXPERIÊNCIAS PROFISSIONAIS ===
${String(experiences).substring(0, 25000)}

=== MINHA EDUCAÇÃO E QUALIFICAÇÕES ===
${String(educacao || "Não informado").substring(0, 15000)}

---

Essa é a vaga na qual eu preciso enviar um CV personalizado:

=== DESCRIÇÃO DA VAGA ===
${String(jobDescription).substring(0, 25000)}

---

TAREFA:
Baseado em minhas experiências REAIS e no que essa vaga pede, refaça minhas experiências respeitando minhas habilidades, ferramentas, conhecimentos e resultados entregues, mas inserindo em cada descrição de bullet point palavras-chaves que essa vaga pede.

PRECISO QUE SEJA CRIADO SEGUINDO O MÉTODO PERFIL GLORIOSO:
1. Sumário inicial com apresentação mostrando senioridade + 4 tópicos com resultados
2. 4 Sistemas que domino
3. 4 Skills que possuo
4. 4 Competências principais que possuo
5. 6 Realizações que tive
6. Educação e qualificações (usar os dados que enviei)
7. TODAS as minhas experiências profissionais REESCRITAS com palavras-chave da vaga

REGRAS:
- Use APENAS informações do meu CV real
- NUNCA invente empresas ou cargos
- REESCREVA os bullets com palavras-chave da vaga
- MANTENHA TODAS as experiências que enviei`;

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
