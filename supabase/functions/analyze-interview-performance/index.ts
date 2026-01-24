import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders } from "../_shared/auth.ts";

interface PerformanceInput {
  aboutMeScript: string;
  experienceScripts: string;
  spokenAboutMe: string;
  spokenExperiences: string;
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

    const { 
      aboutMeScript, 
      experienceScripts, 
      spokenAboutMe, 
      spokenExperiences,
      hasAudio1, 
      hasAudio2 
    } = await req.json() as PerformanceInput;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const hasRealTranscription = (spokenAboutMe && spokenAboutMe.trim().length > 10) || 
                                  (spokenExperiences && spokenExperiences.trim().length > 10);

    const systemPrompt = `Você é uma recrutadora experiente e mentora de carreira chamada Ana. Sua missão é dar um feedback CIRÚRGICO e ASSERTIVO para candidatos que acabaram de praticar uma simulação de entrevista.

Você recebeu:
1. Os ROTEIROS que o candidato preparou (o que ele deveria falar)
2. O que o candidato REALMENTE FALOU (transcrição de voz)

Sua análise deve ser PRECISA e focar em:

## ANÁLISE COMPARATIVA
- Compare o que foi PLANEJADO vs o que foi REALMENTE DITO
- Identifique pontos que foram esquecidos ou pulados
- Destaque informações que foram adicionadas espontaneamente (bom sinal!)
- Avalie se a estrutura e ordem das informações foi mantida

## ANÁLISE DE COMUNICAÇÃO
- Clareza: As frases foram completas? Houve hesitações?
- Coerência: O raciocínio foi fácil de seguir?
- Impacto: As conquistas e resultados foram mencionados?
- Naturalidade: Soou decorado ou genuíno?

## FEEDBACK ESTRUTURADO
1. **O que você fez muito bem** (2-3 pontos específicos)
2. **Oportunidades de melhoria** (2-3 pontos específicos com exemplos do que foi dito)
3. **Dica prática** (1 ação concreta para a próxima prática)

Mantenha o feedback construtivo, específico e motivador. Use exemplos diretos do que a pessoa falou.
Limite: máximo 300 palavras.`;

    let userPrompt: string;

    if (hasRealTranscription) {
      userPrompt = `## ROTEIRO PREPARADO - "Fale sobre você":
${aboutMeScript || "(Não disponível)"}

## O QUE O CANDIDATO REALMENTE FALOU - "Fale sobre você":
${spokenAboutMe || "(Candidato não gravou ou transcrição não disponível)"}

---

## ROTEIROS PREPARADOS - "Fale sobre suas experiências":
${experienceScripts || "(Não disponível)"}

## O QUE O CANDIDATO REALMENTE FALOU - "Fale sobre suas experiências":
${spokenExperiences || "(Candidato não gravou ou transcrição não disponível)"}

---

Por favor, forneça uma análise CIRÚRGICA comparando o que foi planejado com o que foi realmente dito. Seja específico e use exemplos diretos das falas.`;
    } else {
      // Fallback for cases without transcription
      userPrompt = `O candidato praticou mas a transcrição de voz não está disponível.

## ROTEIROS QUE O CANDIDATO PREPAROU:

**"Fale sobre você":**
${aboutMeScript}

**"Fale sobre suas experiências":**
${experienceScripts}

Gravou "Sobre você": ${hasAudio1 ? 'Sim' : 'Não'}
Gravou "Experiências": ${hasAudio2 ? 'Sim' : 'Não'}

Forneça um feedback encorajador baseado na qualidade dos roteiros preparados e dicas gerais para a prática de entrevistas.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
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
