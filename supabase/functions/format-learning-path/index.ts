import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormattedModule {
  title: string;
  emoji: string;
  focus: string;
  courses: {
    name: string;
    url: string | null;
    platform: string | null;
    duration: string | null;
  }[];
}

interface FormattedLearningPath {
  modules: FormattedModule[];
  totalCourses: number;
  estimatedHours: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { learningPath } = await req.json();

    if (!learningPath || typeof learningPath !== 'string') {
      return new Response(
        JSON.stringify({ error: "Learning path text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente especializado em formatar trilhas de aprendizado.
Sua tarefa é analisar o texto bruto de uma trilha de desenvolvimento e estruturá-la em JSON.

REGRAS:
1. Identifique módulos (geralmente indicados por "MÓDULO", numeração ou emojis como 🔹🔸🔷🔶)
2. Para cada módulo, extraia:
   - title: Nome do módulo (sem o número/emoji)
   - emoji: Emoji apropriado (🎯 para foco, 📊 para dados, 💻 para tech, 🧠 para soft skills, etc)
   - focus: A descrição do foco do módulo (se houver linha "Foco:")
   - courses: Lista de cursos
3. Para cada curso, extraia:
   - name: Nome do curso (limpo, sem URLs)
   - url: URL do curso se houver (http/https)
   - platform: Plataforma (ex: "Udemy", "Coursera", "LinkedIn Learning", "Alura") - infira pela URL ou texto
   - duration: Duração se mencionada (ex: "2h", "4 semanas")
4. Se o texto não tiver estrutura clara de módulos, crie módulos lógicos agrupando cursos por tema
5. Sempre retorne JSON válido, mesmo que a entrada seja confusa
6. Estime totalCourses e estimatedHours (pode ser null se não souber)

RETORNE APENAS JSON, sem markdown, sem explicação.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Formate esta trilha de aprendizado em JSON estruturado:\n\n${learningPath}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let formattedPath: FormattedLearningPath;
    try {
      formattedPath = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedContent);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate structure
    if (!formattedPath.modules || !Array.isArray(formattedPath.modules)) {
      throw new Error("Invalid response structure: missing modules array");
    }

    return new Response(
      JSON.stringify(formattedPath),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error formatting learning path:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
