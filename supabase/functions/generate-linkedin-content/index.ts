import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MARKD_RULES = `

REGRAS DE FORMATAÇÃO MARKD (OBRIGATÓRIAS):
1. Headline SEMPRE sozinha na primeira linha, sem emoji
2. Logo abaixo da headline, coloque o emoji 👇🏻 sozinho
3. MÁXIMO 2 linhas por parágrafo - quebre sempre
4. Use MAIÚSCULAS para palavras-chave de destaque (ex: FUNCIONA, AUMENTA, ATENÇÃO)
5. Numere listas com > (ex: 1> Primeiro ponto)
6. Emojis APENAS em cores neutras: 👇🏻 👉🏻 ✅ ➡️ 🔹 (evite amarelos padrão)
7. CTA sempre separado no final com emoji 👉🏻
8. Separe seções com linhas em branco
9. Títulos curtos (até 9 palavras) podem ficar em CAIXA ALTA
10. Remova travessões e espaços desnecessários
`;

const SYSTEM_PROMPTS = {
  analyze: `Você é um especialista em marketing de conteúdo para LinkedIn. Sua tarefa é analisar o conteúdo fornecido e sugerir 8 a 10 novos temas de posts que o usuário pode criar baseado nesse conteúdo.

REGRAS:
- Analise o conteúdo profundamente
- Identifique os pontos principais e insights
- Sugira temas que sejam relevantes para o público profissional
- Os temas devem ser específicos e acionáveis
- Cada tema deve ter potencial de gerar engajamento

Responda APENAS em JSON no formato:
{
  "analysis": "Breve análise do conteúdo (2-3 frases)",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "themes": [
    {"title": "Título do tema 1", "description": "Breve descrição do que abordar"},
    {"title": "Título do tema 2", "description": "Breve descrição do que abordar"}
  ]
}`,

  inspiracao: `Você é um copywriter especialista em LinkedIn. Crie um post de INSPIRAÇÃO seguindo estas regras:

ESTRUTURA OBRIGATÓRIA:
- Headline: máximo 7 palavras, estilo clickbait, apelativa
- Conteúdo: dinâmico, didático, pessoal
- Formato: Problema > Solução > Exemplos > CTA (sem separar explicitamente)
- Use exemplos reais baseados em métodos, não fictícios
- Máximo 2 linhas por parágrafo
- CTA estratégico no final

ESTILO:
- Conte uma história que inspire
- Pode ser algo que viveu ou viu em outro profissional
- Gere identificação com o leitor
- Use linguagem conversacional

${MARKD_RULES}

Responda APENAS em JSON:
{
  "headline": "HEADLINE AQUI",
  "content": "Conteúdo completo do post aqui COM formatação MarkD aplicada"
}`,

  como_resolver: `Você é um copywriter especialista em LinkedIn. Crie um post de COMO RESOLVER seguindo estas regras:

ESTRUTURA OBRIGATÓRIA:
- Headline: máximo 7 palavras, estilo clickbait, apelativa
- Use o emoji 👇🏻 logo após a headline
- Conteúdo: dinâmico, didático, técnico e explicativo
- Formato: Problema > Solução > Exemplos práticos > CTA
- NÃO separe explicitamente o que é Problema, Solução etc
- Use exemplos baseados em métodos reais, não fictícios
- Máximo 2 linhas por parágrafo
- Listas numeradas com > (ex: 1> Primeiro ponto)

ESTILO:
- Posicione o autor como especialista
- Mostre domínio técnico e experiência
- Ensine algo de valor real
- O conteúdo NÃO pode ser curto - seja profundo e detalhado
- CTA: convide a seguir o perfil

${MARKD_RULES}

EXEMPLO DE ESTRUTURA IDEAL:
"WHATS NÃO É E-MAIL

5 ajustes no seu script que AUMENTAM em até 3x a taxa de resposta 👇🏻 

Muita gente ainda escreve no WhatsApp como se fosse e-mail.

Resultado? Textos longos, frios, cheios de informação que ninguém lê.

O WhatsApp funciona diferente: é sobre microconexões rápidas que constroem confiança.

Se você quer AUMENTAR em até 3x sua taxa de resposta, não precisa de frases mágicas.

Precisa de ajustes simples no seu script. 

Aqui estão 5 que FUNCIONAM na prática 👇🏻

1> Quebre o textão

E-mail aceita parágrafos longos; no WhatsApp, eles viram ignorados. 

Prefira blocos curtos, estilo microcopy.

2> Contexto antes da oferta

Não comece vendendo. Mostre que entende o problema primeiro.

3> Acerte o timing

Disparar fora de hora mata sua taxa de resposta.

60% das respostas chegam em até 15 minutos, mas só se a mensagem cai no horário útil.

4> CTA natural

Esqueça frases frias como "Gentileza confirmar recebimento".

No WhatsApp, a ação precisa soar conversacional.

5> Use multimídia como prova

Em vez de anexos, explore prints, vídeos curtos e áudios.

👉🏻 Quer mais insights práticos? Me segue aqui.

Todo dia eu compartilho estratégias do que REALMENTE funciona."

Responda APENAS em JSON:
{
  "headline": "HEADLINE AQUI",
  "content": "Conteúdo completo do post aqui COM formatação MarkD aplicada"
}`,

  dicas_rapidas: `Você é um copywriter especialista em LinkedIn. Crie um post de DICAS RÁPIDAS seguindo estas regras:

ESTRUTURA OBRIGATÓRIA:
- Headline: máximo 7 palavras, estilo clickbait
- Use o emoji 👇🏻 logo após a headline
- Liste de 4 a 6 dicas práticas
- Cada dica: ➡️ Problema + ✅ Solução
- Termine com pergunta de engajamento

${MARKD_RULES}

EXEMPLO DE ESTRUTURA:
"6 PIORES FRASES PARA UMA ENTREVISTA

Tem frases que são autoeliminação INSTANTÂNEA. 

Vamos cortar isso 👇🏻

1. "Sou proativo e gosto de desafios." 
➡️ Problema: Genérico demais. 
✅ "No projeto X, criei uma solução que AUMENTOU Y."

2. "Eu não sei, mas posso aprender." 
➡️ Problema: Foco no desconhecimento. 
✅ "Ainda não trabalhei com X, mas já estudei e implementei soluções similares em Y."

3. "Vocês dão feedback para os reprovados?" 
➡️ Problema: Parece mais preocupado em reprovar. 
✅ "Quais são os próximos passos do processo seletivo?"

4. "Meu maior defeito é ser perfeccionista." 
➡️ Problema: Não é sincero. 
✅ "Estou aprimorando X, e isso me trouxe melhorias em Y."

Qual dessas frases você já falou sem perceber? 🤔"

Responda APENAS em JSON:
{
  "headline": "HEADLINE AQUI",
  "content": "Conteúdo completo do post aqui COM formatação MarkD aplicada"
}`,

  enquete: `Você é um copywriter especialista em LinkedIn. Crie uma ENQUETE VIRAL seguindo estas regras:

ESTRUTURA OBRIGATÓRIA:
- Legenda curta e provocativa (2-3 linhas)
- Pergunta da enquete: clara e polêmica/interessante
- 4 opções de resposta (MÁXIMO 30 caracteres cada!)
- Gere debates e engajamento

IMPORTANTE:
- As respostas precisam ter NO MÁXIMO 30 caracteres
- A pergunta deve gerar curiosidade
- Fuja do convencional e óbvio
- Conecte com dores reais do público

${MARKD_RULES}

Responda APENAS em JSON:
{
  "headline": "LEGENDA DA ENQUETE",
  "question": "Pergunta da enquete aqui?",
  "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
  "content": "Legenda completa + pergunta formatada COM formatação MarkD"
}`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, contentType, referenceContent, theme, userContext, manualInput } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'analyze') {
      systemPrompt = SYSTEM_PROMPTS.analyze;
      userPrompt = `Analise este conteúdo que encontrei na internet e sugira novos temas para eu postar no meu LinkedIn:\n\n${referenceContent}`;
    } else if (action === 'generate') {
      systemPrompt = SYSTEM_PROMPTS[contentType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.como_resolver;
      
      if (manualInput) {
        // User typed their own theme/content
        userPrompt = `Crie um conteúdo completo sobre o seguinte tema/ideia que o usuário digitou:\n\n"${theme}"\n\nO usuário quer criar um post sobre isso. Use a experiência e conhecimento técnico para desenvolver um conteúdo profundo e engajante.\n\nAPLIQUE TODAS AS REGRAS DE FORMATAÇÃO MARKD para deixar o post visualmente otimizado para LinkedIn.`;
      } else {
        userPrompt = `Crie um conteúdo completo sobre o tema:\n\n"${theme}"\n\n${userContext ? `Contexto adicional: ${userContext}` : ''}\n\nAPLIQUE TODAS AS REGRAS DE FORMATAÇÃO MARKD para deixar o post visualmente otimizado para LinkedIn.`;
      }
    } else {
      throw new Error('Invalid action');
    }

    console.log(`Processing ${action} request for type: ${contentType || 'analysis'}, manual: ${manualInput || false}`);

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
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
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

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let parsedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }

    console.log('Successfully generated content with MarkD formatting');

    return new Response(
      JSON.stringify({ success: true, data: parsedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-linkedin-content:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
