import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um especialista em cartas de apresentação profissionais. Seu trabalho é criar cartas autênticas, humanizadas e impactantes.

REGRAS CRÍTICAS - LINGUAGEM:
- NUNCA use palavras típicas de IA como: "impulsionar", "impulsionada", "alavancagem", "proativo", "sinergia", "inovador"
- NUNCA use linguagem muito formal como: "Prezado(a)", "Venho por meio desta", "Cordialmente"
- SEJA descontraído e dinâmico, mas escreva corretamente
- USE uma linguagem humanizada e natural, como uma conversa profissional casual

O QUE NÃO DEVE ter:
- Clichês e expressões comuns
- Estrutura sintática simples e repetitiva
- Falta de variação vocabular
- Uso inadequado de jargões
- Informações vagas e genéricas
- Falta de exemplos específicos
- Uso excessivo de generalizações
- Repetição de ideias sem desenvolvimento
- Estilo de escrita formal e impessoal
- Uso excessivo de jargões técnicos
- Texto excessivamente longo e detalhado
- Falta de conexão lógica entre parágrafos
- Uso inadequado de transições
- Respostas evasivas ou genéricas

O QUE DEVE ter:
- Linguagem humanizada e natural
- Exemplos específicos e detalhes relevantes
- Opiniões pessoais e subjetividade
- Humor sutil quando apropriado
- Tom autêntico e credível
- Emoção genuína
- Conexão clara entre experiências e valor

FORMATOS DOS 3 MODELOS:

1. MODELO COMPLETO (mais extenso):
   - Abrange todas as áreas de interesse do candidato
   - Explora experiências de forma detalhada
   - Conta a jornada profissional completa
   - CTA criativo tipo "Bora conversar?" ou variação

2. MODELO OBJETIVA (não tão extenso):
   - Prioriza especificar a jornada
   - Foco principal nos resultados
   - Direto ao ponto, mas com personalidade
   - CTA criativo tipo "Bora trocar uma ideia?" ou variação

3. MODELO TÉCNICA (curto e objetivo):
   - Explora experiências de forma técnica
   - Foco em resultados mensuráveis
   - Carta não muito personalizável
   - CTA criativo tipo "Que tal um papo?" ou variação

Para cada modelo, crie uma carta ÚNICA e AUTÊNTICA baseada nos dados fornecidos.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData } = await req.json();
    console.log("Generating cover letters for:", formData.nome);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const userPrompt = `Crie 3 modelos de carta de apresentação para este candidato:

DADOS DO CANDIDATO:
- Nome: ${formData.nome}
- Idade: ${formData.idade}
- Localização: ${formData.localizacao}
- Profissão: ${formData.profissao}
- Estado Civil: ${formData.estadoCivil}
- Interesses: ${formData.interesses}
- Soft Skills: ${formData.softSkills}
- Hard Skills: ${formData.hardSkills}
- Último Cargo: ${formData.ultimoCargo}
- Cargos de Interesse: ${formData.cargosInteresse}

ANÁLISE DO CURRÍCULO:
${formData.cvAnalysis}

Gere os 3 modelos de carta de apresentação seguindo as especificações.`;

    const toolSchema = {
      type: "function",
      function: {
        name: "generate_cover_letters",
        description: "Gera 3 modelos de carta de apresentação",
        parameters: {
          type: "object",
          properties: {
            modelos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: {
                    type: "string",
                    enum: ["completa", "objetiva", "tecnica"]
                  },
                  titulo: {
                    type: "string",
                    description: "Título descritivo do modelo"
                  },
                  descricao: {
                    type: "string",
                    description: "Breve descrição do modelo (1-2 frases)"
                  },
                  conteudo: {
                    type: "string",
                    description: "O texto completo da carta de apresentação"
                  },
                  cta: {
                    type: "string",
                    description: "Call-to-action no final da carta"
                  }
                },
                required: ["tipo", "titulo", "descricao", "conteudo", "cta"]
              },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["modelos"]
        }
      }
    };

    console.log("Calling Lovable AI Gateway...");
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
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "generate_cover_letters" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
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
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data, null, 2));
      throw new Error('Resposta inválida da IA');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Cover letters generated successfully:", result.modelos?.length);

    return new Response(
      JSON.stringify({ modelos: result.modelos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating cover letter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar carta de apresentação';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
