import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um especialista em extração de dados de currículos.

Sua tarefa é analisar o conteúdo textual de um currículo e extrair APENAS:
1) EXPERIÊNCIAS PROFISSIONAIS
2) EDUCAÇÃO / CERTIFICAÇÕES

NÃO EXTRAIA dados pessoais (nome, email, telefone, LinkedIn).

Retorne os campos como TEXTO pronto para colar em um formulário:
- experiencias: texto com todas as experiências, em blocos com Empresa | Cargo | Período e bullets
- educacao: texto com cursos/certificações em linhas, no formato "Curso - Instituição"

IMPORTANTE:
- Retorne apenas via tool call (sem markdown, sem explicações).`;

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function extractTextFromPdfBytes(pdfBytes: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const pdfString = decoder.decode(pdfBytes);

  const textParts: string[] = [];

  // Method 1: Extract text from BT/ET blocks (PDF text operators)
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match: RegExpExecArray | null;

  while ((match = btEtRegex.exec(pdfString)) !== null) {
    const block = match[1];

    // Tj operator - single string
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = tjRegex.exec(block)) !== null) {
      const text = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (text.trim()) textParts.push(text);
    }

    // TJ operator - array of strings
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    while ((textMatch = tjArrayRegex.exec(block)) !== null) {
      const arrayContent = textMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let strMatch: RegExpExecArray | null;
      while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
        const text = strMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\");
        if (text.trim()) textParts.push(text);
      }
    }
  }

  // Method 2: Extract readable ASCII strings as fallback
  const asciiRegex = /[\x20-\x7E\xC0-\xFF]{5,}/g;
  const asciiMatches = pdfString.match(asciiRegex) || [];

  const filteredAscii = asciiMatches.filter((s) => {
    const lower = s.toLowerCase();
    // Filter out PDF structure/metadata
    return (
      !lower.includes("/type") &&
      !lower.includes("/font") &&
      !lower.includes("/page") &&
      !lower.includes("stream") &&
      !lower.includes("endstream") &&
      !lower.includes("endobj") &&
      !lower.includes("/filter") &&
      !lower.includes("/length") &&
      !lower.includes("/resources") &&
      !lower.includes("/encoding") &&
      !lower.includes("/producer") &&
      !lower.includes("/creator") &&
      !lower.includes("flatedecode") &&
      !lower.includes("/subtype") &&
      !lower.includes("/basefont") &&
      !lower.startsWith("obj") &&
      !lower.startsWith("xref") &&
      s.length > 8
    );
  });

  // Combine results, prioritizing BT/ET extraction
  const allText = textParts.length > 50
    ? textParts.join(" ")
    : [...textParts, ...filteredAscii].join(" ");

  return allText
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F]/g, " ")
    .trim();
}

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
    let contentText = (body?.pdfContent || "").trim() as string;

    if (!contentText && pdfBase64) {
      console.log("extract-cv-pdf: decoding base64...");
      const bytes = base64ToBytes(pdfBase64);
      console.log("extract-cv-pdf: bytes length:", bytes.length);

      contentText = extractTextFromPdfBytes(bytes);
      console.log("extract-cv-pdf: extracted text length:", contentText?.length || 0);
      console.log("extract-cv-pdf: sample:", contentText?.substring(0, 200));
    }

    if (!contentText || contentText.replace(/\s/g, "").length < 100) {
      return json(
        {
          error:
            "Não foi possível extrair texto suficiente do PDF. O arquivo pode estar protegido, ser uma imagem escaneada, ou estar corrompido. Tente exportar novamente ou usar outro arquivo.",
        },
        400
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

    const userPrompt = `Extraia experiências e educação do currículo abaixo.

CURRÍCULO (texto):
${contentText.substring(0, 22000)}

Regras:
- Não inclua dados pessoais
- Experiências: blocos com empresa | cargo | período e bullets
- Educação: 1 por linha: Curso - Instituição`;

    const bodyPayload = {
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_cv_sections",
            description: "Extrai experiências e educação de um currículo em texto.",
            parameters: {
              type: "object",
              properties: {
                experiencias: { type: "string" },
                educacao: { type: "string" },
              },
              required: ["experiencias", "educacao"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_cv_sections" } },
    };

    console.log("extract-cv-pdf: calling AI gateway...");

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
    const toolCalls = data?.choices?.[0]?.message?.tool_calls;
    const argsStr = toolCalls?.[0]?.function?.arguments;

    if (!argsStr) {
      console.error("extract-cv-pdf: missing tool_calls", JSON.stringify(data)?.slice(0, 500));
      return json({ error: "A IA não retornou dados estruturados. Tente novamente." }, 500);
    }

    let parsed: { experiencias?: string; educacao?: string };
    try {
      parsed = JSON.parse(argsStr);
    } catch (e) {
      console.error("extract-cv-pdf: tool args parse error", e, argsStr?.slice(0, 500));
      return json({ error: "Erro ao interpretar resposta da IA. Tente novamente." }, 500);
    }

    console.log("extract-cv-pdf: success, experiencias length:", parsed.experiencias?.length, "educacao length:", parsed.educacao?.length);

    return json({
      experiencias: (parsed.experiencias || "").toString(),
      educacao: (parsed.educacao || "").toString(),
    });
  } catch (e) {
    console.error("extract-cv-pdf: unhandled error", e);
    return json({ error: e instanceof Error ? e.message : "Erro ao extrair dados do CV" }, 500);
  }
});
