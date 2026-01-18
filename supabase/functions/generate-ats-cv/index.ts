import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um assistente especializado em organizar CVs para sistemas ATS (Applicant Tracking Systems).

Sua tarefa é APENAS ORGANIZAR os dados fornecidos pelo usuário no formato estruturado.
REGRA CRÍTICA: NÃO altere, reescreva ou melhore NENHUM texto. Copie EXATAMENTE como o usuário forneceu.

Estrutura de saída JSON:
{
  "experiencias": [
    {
      "empresa": "Nome da Empresa",
      "localizacao": "CIDADE - PAÍS",
      "cargo": "Cargo",
      "periodo": "MES ANO - MES ANO ou ATUAL",
      "bullets": ["texto do bullet 1", "texto do bullet 2"]
    }
  ],
  "educacao": [
    {
      "instituicao": "Nome da Instituição",
      "curso": "Nome do Curso"
    }
  ]
}

INSTRUÇÕES CRÍTICAS PARA BULLETS:
1. Cada bullet deve conter APENAS o texto da realização - SEM traços, SEM ">", SEM marcadores no início
2. NUNCA inclua texto em parágrafo corrido - APENAS bullets separados
3. Se houver uma lista longa de realizações repetidas no final, IGNORE - use apenas os bullets individuais
4. Copie o CONTEÚDO de cada bullet exatamente como fornecido, mas remova qualquer marcador do início (-, >, •, etc)

INSTRUÇÕES PARA EDUCAÇÃO:
1. NÃO inclua caracteres especiais no início (-, >, •, etc)
2. Apenas extraia o nome da instituição e o nome do curso
3. Ignore credenciais, códigos, datas de emissão

OUTRAS REGRAS:
1. Para períodos, use formato: "MES ANO - MES ANO" (ex: "MAI 2024 - ATUAL")
2. Organize em ordem cronológica inversa (mais recente primeiro)
3. Se não conseguir identificar algum campo, deixe vazio
4. Retorne APENAS o JSON, sem explicações ou texto adicional`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, telefone, localizacao, email, linkedin, nacionalidade, idade, experiencias, educacao, idiomas } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const userPrompt = `Organize os seguintes dados de CV para formato ATS:

EXPERIÊNCIAS (copie EXATAMENTE):
${experiencias}

EDUCAÇÃO/CURSOS/CERTIFICADOS (copie EXATAMENTE):
${educacao}

Retorne APENAS o JSON estruturado, sem explicações.`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let parsedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Build final CV data
    const cvData = {
      nome: nome || "",
      telefone: telefone || "",
      localizacao: localizacao || "",
      email: email || "",
      linkedin: linkedin || "",
      nacionalidade: nacionalidade || "",
      idade: idade || "",
      experiencias: parsedData.experiencias || [],
      educacao: parsedData.educacao || [],
      idiomas: idiomas || [],
    };

    return new Response(JSON.stringify({ cv: cvData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating ATS CV:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar CV ATS";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
