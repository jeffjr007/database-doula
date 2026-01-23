import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface ConquistaInput {
  tipo: string;
  titulo: string;
}

interface ExperienciaInput {
  empresa: string;
  cargo: string;
  descricao: string;
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

    const { titulos_linkedin, experiencias, conquistas } = await req.json();

    console.log('Generating achievement descriptions for user:', user.id);
    console.log('Títulos:', titulos_linkedin);
    console.log('Experiências:', experiencias?.length || 0);
    console.log('Conquistas:', conquistas?.length || 0);

    if (!titulos_linkedin || !experiencias?.length || !conquistas?.length) {
      return new Response(
        JSON.stringify({ error: 'Preencha todos os campos: títulos, experiências e conquistas.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Build the prompt based on the mentor's template
    const experienciasTexto = experiencias
      .slice(0, 3)
      .map((exp: ExperienciaInput, i: number) => 
        `${i + 1}. ${exp.cargo} na ${exp.empresa}:\n${exp.descricao}`
      )
      .join('\n\n');

    const conquistasTexto = conquistas
      .map((c: ConquistaInput, i: number) => `${i + 1}. [${c.tipo}] ${c.titulo}`)
      .join('\n');

    const systemPrompt = `Você é um especialista em carreiras e otimização de currículos para sistemas ATS (Applicant Tracking System).

Sua tarefa é criar descrições otimizadas para conquistas e certificados, inserindo palavras-chave relevantes aos cargos-objetivo do candidato.

REGRAS IMPORTANTES:
1. NÃO invente fatos ou conquistas - use APENAS o que foi fornecido
2. Mantenha a linguagem humanizada e profissional
3. Insira palavras-chave dos cargos-objetivo naturalmente no texto
4. Cada descrição deve ter entre 80-150 caracteres
5. Use verbos de ação no início quando apropriado
6. Considere as experiências reais para contextualizar as conquistas
7. Retorne EXATAMENTE o mesmo número de descrições que conquistas recebidas`;

    const userPrompt = `Esses são os meus objetivos de cargo:

${titulos_linkedin}

Essas são as minhas experiências mais recentes:

${experienciasTexto}

Baseado nos meus objetivos e nas minhas experiências, preciso criar uma Descrição das minhas conquistas e certificados. Essas foram as conquistas e certificados que obtive:

${conquistasTexto}

Considere todas as palavras-chave relacionadas a cada um desses cargos que tenho como objetivo, baseado em como as empresas publicam nas vagas e colocam em "Atividades" e "Requisitos" e insira essas palavras-chaves ao longo de cada descrição das conquistas e certificados. Não invente nada, considere meus objetivos e experiências reais para essa criação. Crie de forma humanizada.

Retorne um JSON no formato:
{
  "descricoes": [
    { "titulo_original": "...", "descricao": "..." }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    console.log('AI Response:', content);

    // Parse JSON from response
    let descricoes;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        descricoes = parsed.descricoes || parsed;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback: create descriptions from the raw text
      descricoes = conquistas.map((c: ConquistaInput) => ({
        titulo_original: c.titulo,
        descricao: `${c.tipo}: ${c.titulo} - Competência desenvolvida alinhada aos objetivos profissionais.`
      }));
    }

    return new Response(
      JSON.stringify({ descricoes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar descrições' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
