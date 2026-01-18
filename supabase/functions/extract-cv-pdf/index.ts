import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um ESPECIALISTA MÁXIMO em leitura e extração de dados de currículos profissionais.

TAREFA CRÍTICA: Analisar o documento PDF enviado e extrair TODAS as experiências profissionais e TODA a formação acadêmica.

=== EXPERIÊNCIAS PROFISSIONAIS ===
Procure e extraia TUDO relacionado a trabalho:
- Nomes de empresas (qualquer empresa mencionada)
- Cargos/funções (Analista, Gerente, CEO, Coordenador, Desenvolvedor, etc.)
- Períodos de trabalho (datas, anos, duração)
- Atividades realizadas (bullets com verbos de ação)
- Resultados e métricas mencionados (%, números, conquistas)

FORMATO OBRIGATÓRIO para cada experiência:
NOME_DA_EMPRESA, Local · Modalidade — CARGO_OCUPADO
PERÍODO (ex: JAN 2020 - ATUAL)
> Primeira atividade ou resultado
> Segunda atividade ou resultado
> Terceira atividade (continue listando TODAS)

=== EDUCAÇÃO E QUALIFICAÇÕES ===
Procure e extraia TUDO relacionado a formação:
- Graduações e pós-graduações
- Cursos livres e técnicos
- Certificações profissionais
- Workshops e treinamentos
- Nomes de instituições de ensino

FORMATO OBRIGATÓRIO para cada item:
Nome da Instituição, - Nome do Curso/Certificação

=== REGRAS ABSOLUTAS ===
1. NUNCA retorne campos vazios - sempre extraia ALGO
2. Copie EXATAMENTE o texto do currículo - não invente nada
3. Mantenha TODOS os bullets e detalhes de cada experiência
4. Se houver métricas (%, números), MANTENHA exatamente como estão
5. IGNORE dados pessoais (email, telefone, endereço, CPF)
6. Se algo não estiver 100% claro, extraia do jeito que está no documento
7. Liste as experiências na ORDEM que aparecem no documento
8. COPIE todos os resultados e conquistas mencionados`;

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const pdfBase64 = body?.pdfBase64 as string | undefined;

    if (!pdfBase64) {
      return json({ error: "Nenhum arquivo PDF foi enviado." }, 400);
    }

    // Limpar o base64 de possíveis prefixos
    let cleanBase64 = pdfBase64;
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.replace(/\s/g, "");

    console.log("extract-cv-pdf: PDF base64 length:", cleanBase64.length);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

    // Usar GPT-5 Mini com capacidade multimodal para "ver" o PDF
    // Enviamos o PDF como base64 para o modelo analisar diretamente
    const userPrompt = `Analise este documento PDF de currículo e extraia TODAS as informações de experiência profissional e educação.

IMPORTANTE: 
- Copie EXATAMENTE o texto como está no documento
- Inclua TODOS os bullets e detalhes de cada experiência
- NÃO omita nenhuma informação
- Mantenha números, porcentagens e métricas exatamente como aparecem

Por favor, extraia:
1. TODAS as experiências profissionais com empresa, cargo, período e TODOS os bullets de atividades/resultados
2. TODA a formação acadêmica, cursos e certificações`;

    const bodyPayload = {
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "file",
              file: {
                filename: "curriculo.pdf",
                file_data: `data:application/pdf;base64,${cleanBase64}`
              }
            }
          ]
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_cv_sections",
            description: "Extrai experiências profissionais e educação de um currículo. Copie EXATAMENTE o texto do documento.",
            parameters: {
              type: "object",
              properties: {
                experiencias: { 
                  type: "string",
                  description: "TODAS as experiências profissionais COMPLETAS, copiadas exatamente do documento. Inclua empresa, cargo, período e TODOS os bullets com atividades e resultados. Use o formato: EMPRESA, Local · Modalidade — CARGO\\nPERÍODO\\n> bullet1\\n> bullet2\\n\\n para cada experiência."
                },
                educacao: { 
                  type: "string",
                  description: "TODA a formação acadêmica, cursos e certificações. Use o formato: Instituição, - Nome do Curso para cada item, um por linha."
                },
              },
              required: ["experiencias", "educacao"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_cv_sections" } },
    };

    console.log("extract-cv-pdf: calling AI gateway with multimodal PDF...");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("extract-cv-pdf: AI gateway error", resp.status, t);
      if (resp.status === 429) return json({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }, 429);
      if (resp.status === 402) return json({ error: "Créditos insuficientes. Adicione créditos na sua conta." }, 402);
      return json({ error: "Falha ao processar o currículo com IA." }, 500);
    }

    const data = await resp.json();
    console.log("extract-cv-pdf: AI response received");
    
    const toolCalls = data?.choices?.[0]?.message?.tool_calls;
    const argsStr = toolCalls?.[0]?.function?.arguments;

    if (!argsStr) {
      console.error("extract-cv-pdf: missing tool_calls", JSON.stringify(data)?.slice(0, 1000));
      return json({ error: "A IA não retornou dados estruturados. Tente novamente." }, 500);
    }

    let parsed: { experiencias?: string; educacao?: string };
    try {
      parsed = JSON.parse(argsStr);
    } catch (e) {
      console.error("extract-cv-pdf: tool args parse error", e, argsStr?.slice(0, 500));
      return json({ error: "Erro ao interpretar resposta da IA. Tente novamente." }, 500);
    }

    const experiencias = (parsed.experiencias || "").toString().trim();
    const educacao = (parsed.educacao || "").toString().trim();

    console.log("extract-cv-pdf: SUCCESS");
    console.log("extract-cv-pdf: experiencias preview:", experiencias.substring(0, 500));
    console.log("extract-cv-pdf: educacao preview:", educacao.substring(0, 300));

    // Validar que extraímos algo útil
    if (experiencias.length < 50 && educacao.length < 20) {
      console.error("extract-cv-pdf: insufficient data extracted");
      return json({ 
        error: "Não foi possível extrair dados suficientes do PDF. Verifique se o arquivo é um currículo válido e não está protegido por senha." 
      }, 400);
    }

    return json({
      experiencias: experiencias,
      educacao: educacao,
    });
  } catch (e) {
    console.error("extract-cv-pdf: unhandled error", e);
    return json({ error: e instanceof Error ? e.message : "Erro ao extrair dados do CV" }, 500);
  }
});
