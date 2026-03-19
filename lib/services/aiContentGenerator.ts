/**
 * Server-side AI content generator via OpenAI API.
 * Requires: OPENAI_API_KEY environment variable.
 * Never import from client components.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export interface GeneratedContent {
  summary: string;
  description: string;
  tags: string[];
  sourceUsed: "transcript" | "metadata";
}

export type GenerateContentResult =
  | { ok: true; data: GeneratedContent }
  | { ok: false; error: string };

// ── Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt(
  source: "transcript" | "metadata",
  context: string,
  videoTitle?: string
): string {
  const titleLine = videoTitle ? `영상 제목: ${videoTitle}\n` : "";
  const sourceNote =
    source === "transcript"
      ? "아래는 유튜브 영상의 자막 텍스트입니다."
      : "아래는 유튜브 영상의 메타데이터(제목, 설명, 채널명)입니다.";

  return `당신은 기독교 신앙 커뮤니티 플랫폼의 콘텐츠 작성을 돕는 어시스턴트입니다.

${sourceNote}
${titleLine}
---
${context.slice(0, 6000)}
---

위 내용을 바탕으로 SNS 게시글용 콘텐츠를 생성해주세요.

규칙:
- 한국어로 작성하세요
- 자연스럽고 읽기 쉬운 문체로 작성하세요
- 과도한 종교적 표현이나 과장은 피하세요
- description은 실제로 영상을 보지 않은 사람도 내용을 파악할 수 있도록 작성하세요
- tags는 소문자 영어 또는 한국어 단어로, # 없이 작성하세요
- 응답은 반드시 아래 JSON 형식만 출력하세요 (설명 없이)

{
  "summary": "1-2문장 핵심 요약",
  "description": "3-4단락의 게시글 본문 초안. 영상의 핵심 내용, 인상적인 포인트, 독자에게 전하고 싶은 메시지를 담으세요.",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}`;
}

// ── Anthropic API call ─────────────────────────────────────────────────────

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

async function callOpenAI(prompt: string): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "OPENAI_API_KEY not configured" };

  let res: Response;
  try {
    res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    return { error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
  }

  let body: OpenAIResponse;
  try {
    body = await res.json() as OpenAIResponse;
  } catch {
    return { error: `Non-JSON response from OpenAI (status ${res.status})` };
  }

  if (!res.ok) {
    return { error: body.error?.message ?? `OpenAI API error ${res.status}` };
  }

  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) return { error: "Empty response from OpenAI" };
  return { text };
}

// ── JSON parsing ───────────────────────────────────────────────────────────

function parseGeneratedJson(raw: string): { summary: string; description: string; tags: string[] } | null {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const obj = JSON.parse(cleaned) as { summary?: unknown; description?: unknown; tags?: unknown };
    if (
      typeof obj.summary === "string" &&
      typeof obj.description === "string" &&
      Array.isArray(obj.tags)
    ) {
      return {
        summary: obj.summary.trim(),
        description: obj.description.trim(),
        tags: (obj.tags as unknown[])
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 5),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface ContentGeneratorInput {
  source: "transcript" | "metadata";
  context: string;          // transcript text OR "title\ndescription\nchannelTitle"
  videoTitle?: string;      // only for metadata source
}

/**
 * Generate summary, description, and tags from YouTube content context.
 * Caller decides whether context is transcript or metadata.
 */
export async function generateContent(
  input: ContentGeneratorInput
): Promise<GenerateContentResult> {
  const prompt = buildPrompt(input.source, input.context, input.videoTitle);
  const result = await callOpenAI(prompt);

  if ("error" in result) return { ok: false, error: result.error };

  const parsed = parseGeneratedJson(result.text);
  if (!parsed) {
    return { ok: false, error: "Failed to parse AI response as JSON" };
  }

  return {
    ok: true,
    data: {
      summary: parsed.summary,
      description: parsed.description,
      tags: parsed.tags,
      sourceUsed: input.source,
    },
  };
}
