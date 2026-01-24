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

interface StructuredFeedback {
  introduction: string;
  strengths: string[];
  improvements: string[];
  practicalTip: string;
  closing: string;
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

IMPORTANTE: Você DEVE responder EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto adicional.

O formato de resposta DEVE ser:
{
  "introduction": "Uma ou duas frases introdutórias acolhedoras e personalizadas",
  "strengths": ["Ponto forte 1 específico", "Ponto forte 2 específico", "Ponto forte 3 opcional"],
  "improvements": ["Melhoria 1 com exemplo concreto", "Melhoria 2 com exemplo concreto"],
  "practicalTip": "Uma dica prática e acionável para a próxima prática",
  "closing": "Uma frase motivacional de encerramento"
}

Regras:
- Cada item de strengths e improvements deve ser uma frase completa e específica
- Use exemplos diretos do que a pessoa falou quando possível
- Mantenha o tom construtivo e motivador
- strengths: 2-3 itens máximo
- improvements: 2-3 itens máximo
- NÃO use markdown (**, ##, etc.) dentro dos textos
- Responda APENAS o JSON, sem explicações adicionais`;

    let userPrompt: string;

    if (hasRealTranscription) {
      userPrompt = `ROTEIRO PREPARADO - "Fale sobre você":
${aboutMeScript || "(Não disponível)"}

O QUE O CANDIDATO REALMENTE FALOU - "Fale sobre você":
${spokenAboutMe || "(Candidato não gravou ou transcrição não disponível)"}

---

ROTEIROS PREPARADOS - "Fale sobre suas experiências":
${experienceScripts || "(Não disponível)"}

O QUE O CANDIDATO REALMENTE FALOU - "Fale sobre suas experiências":
${spokenExperiences || "(Candidato não gravou ou transcrição não disponível)"}

Forneça sua análise CIRÚRGICA comparando o que foi planejado com o que foi realmente dito. Responda APENAS em JSON.`;
    } else {
      userPrompt = `O candidato praticou mas a transcrição de voz não está disponível.

ROTEIROS QUE O CANDIDATO PREPAROU:

"Fale sobre você":
${aboutMeScript}

"Fale sobre suas experiências":
${experienceScripts}

Gravou "Sobre você": ${hasAudio1 ? 'Sim' : 'Não'}
Gravou "Experiências": ${hasAudio2 ? 'Sim' : 'Não'}

Forneça um feedback encorajador baseado na qualidade dos roteiros preparados e dicas gerais para a prática de entrevistas. Responda APENAS em JSON.`;
    }

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
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    console.log("Raw AI response:", rawContent);

    // Try to parse as JSON
    let structuredFeedback: StructuredFeedback;
    try {
      // Remove any potential markdown code blocks
      const cleanedContent = rawContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      structuredFeedback = JSON.parse(cleanedContent);
      
      // Validate structure
      if (!structuredFeedback.introduction || !Array.isArray(structuredFeedback.strengths) || !Array.isArray(structuredFeedback.improvements)) {
        throw new Error("Invalid structure");
      }
    } catch (parseError) {
      console.error("Failed to parse JSON, using fallback:", parseError);
      // Return a fallback structured response
      structuredFeedback = {
        introduction: "Parabéns por completar a simulação de entrevista!",
        strengths: [
          "Você demonstrou comprometimento ao praticar seus roteiros",
          "Seus roteiros estão bem estruturados com informações relevantes"
        ],
        improvements: [
          "Continue praticando para ganhar mais naturalidade na fala",
          "Tente adicionar mais pausas estratégicas para dar ênfase aos pontos importantes"
        ],
        practicalTip: "Grave-se novamente e compare com esta gravação para acompanhar sua evolução.",
        closing: "Continue praticando! Cada simulação te deixa mais preparado para a entrevista real."
      };
    }

    return new Response(
      JSON.stringify({ 
        feedback: structuredFeedback,
        isStructured: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in analyze-interview-performance:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao analisar desempenho";
    
    // Return fallback structured response on error
    const fallbackFeedback: StructuredFeedback = {
      introduction: "Parabéns por completar a simulação!",
      strengths: [
        "Você tomou a iniciativa de praticar, isso é fundamental"
      ],
      improvements: [
        "Continue praticando para aperfeiçoar sua apresentação"
      ],
      practicalTip: "Tente novamente a simulação para ganhar mais confiança.",
      closing: "Cada prática te aproxima do sucesso na entrevista real!"
    };
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        feedback: fallbackFeedback,
        isStructured: true
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
