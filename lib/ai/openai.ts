/**
 * Shared OpenAI API helper (server-side only).
 * Uses direct fetch — no SDK required.
 * Requires: OPENAI_API_KEY environment variable.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAICallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Call OpenAI chat completions and return the text response.
 * Returns { text } on success or { error } on failure.
 */
export async function callOpenAI(
  messages: OpenAIMessage[],
  options: OpenAICallOptions = {}
): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "OPENAI_API_KEY not configured" };

  let res: Response;
  try {
    res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.3,
        messages,
      }),
    });
  } catch (e) {
    return { error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
  }

  let body: { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  try {
    body = await res.json() as typeof body;
  } catch {
    return { error: `Non-JSON response (status ${res.status})` };
  }

  if (!res.ok) {
    return { error: body.error?.message ?? `OpenAI API error ${res.status}` };
  }

  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) return { error: "Empty response from OpenAI" };
  return { text };
}
