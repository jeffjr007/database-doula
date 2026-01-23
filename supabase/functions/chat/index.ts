import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return unauthorizedResponse(authError || "Não autorizado");
    }

    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat request from user:", user.id, "messages:", messages?.length || 0, "context:", context);

    // Build system prompt based on context
    let systemPrompt = `Você é a IA Mentora da plataforma Perfil Glorioso, especializada em desenvolvimento de carreira, criação de CVs profissionais e preparação para processos seletivos.

Seu papel é:
- Guiar os mentorados através das etapas do programa de mentoria
- Ajudar na construção de CVs profissionais e impactantes
- Oferecer insights estratégicos para LinkedIn e networking
- Preparar candidatos para entrevistas e processos seletivos
- Ser motivacional mas também prático e direto

Mantenha um tom profissional, empático e encorajador. Responda sempre em português brasileiro.`;

    // Add context-specific instructions
    if (context === "cv") {
      systemPrompt += `

CONTEXTO ESPECÍFICO: Criação de CV
Você está ajudando o mentorado a criar um CV profissional e otimizado para ATS (Applicant Tracking Systems).
- Faça perguntas estratégicas para coletar informações
- Sugira melhorias e palavras-chave relevantes
- Ajude a quantificar conquistas e resultados
- Mantenha foco em clareza e impacto`;
    } else if (context === "linkedin") {
      systemPrompt += `

CONTEXTO ESPECÍFICO: LinkedIn Estratégico
Você está ajudando o mentorado a otimizar seu perfil do LinkedIn.
- Analise e sugira melhorias para headline, sobre, experiências
- Foque em palavras-chave e SEO do LinkedIn
- Sugira estratégias de networking e conteúdo`;
    } else if (context === "interview") {
      systemPrompt += `

CONTEXTO ESPECÍFICO: Preparação para Entrevistas
Você está ajudando o mentorado a se preparar para entrevistas.
- Simule perguntas comportamentais e técnicas
- Ensine técnicas como STAR para respostas estruturadas
- Dê feedback construtivo sobre respostas`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini", // GPT-5 Mini - bom custo-benefício
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Limite de requisições atingido. Por favor, aguarde alguns segundos e tente novamente." 
          }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Créditos insuficientes. Por favor, adicione créditos em Settings → Workspace → Usage." 
          }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA. Tente novamente." }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
