import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders } from "../_shared/auth.ts";

interface PerformanceInput {
  aboutMeScript: string;
  experienceScripts: string;
  hasAudio1: boolean;
  hasAudio2: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await validateAuth(req);
    if (authResult instanceof Response) return authResult;

    const { aboutMeScript, experienceScripts, hasAudio1, hasAudio2 } = await req.json() as PerformanceInput;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é uma recrutadora experiente e mentora de carreira chamada Ana. Sua missão é dar um feedback construtivo e encorajador para candidatos que acabaram de praticar uma simulação de entrevista.

Você deve:
1. Ser amigável e motivadora, mas também honesta
2. Destacar pontos positivos primeiro
3. Dar dicas práticas de melhoria
4. Usar linguagem simples e direta
5. Manter o feedback conciso (máximo 200 palavras)

Estrutura do feedback:
- Parabéns por praticar (breve)
- Pontos fortes baseados nos roteiros que eles prepararam
- 2-3 dicas práticas de melhoria para entrevistas reais
- Encorajamento final`;

    const userPrompt = `O candidato acabou de praticar duas perguntas de entrevista:

1. "Me fale sobre você" - Roteiro preparado:
${aboutMeScript}

2. "Me fale sobre suas experiências" - Roteiros preparados:
${experienceScripts}

O candidato gravou áudio para a primeira pergunta: ${hasAudio1 ? 'Sim' : 'Não'}
O candidato gravou áudio para a segunda pergunta: ${hasAudio2 ? 'Sim' : 'Não'}

Forneça um feedback construtivo e encorajador sobre a preparação deste candidato, baseando-se nos roteiros que ele criou. Destaque a qualidade da estrutura dos roteiros e dê dicas para a performance na entrevista real.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Parabéns por completar a simulação!";

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in analyze-interview-performance:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao analisar desempenho";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        feedback: "Parabéns por completar a simulação! Continue praticando seus roteiros para ganhar mais confiança."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
