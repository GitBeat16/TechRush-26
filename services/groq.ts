/**
 * Thin server-only client for Groq's OpenAI-compatible chat completions API.
 *
 * Never import this from a client component — it exists so the API key
 * stays on the server. Callers pass the key explicitly rather than reading
 * process.env here, so this module has no hidden dependency on how the
 * caller sources credentials.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
// Kept short and well under common serverless function limits (Vercel Hobby
// caps a function at 10s). If Groq is slow or unreachable, we want our own
// code to hit this timeout and fall back to the local comparer — not have
// the platform kill the function first and hand the client a raw error page.
const REQUEST_TIMEOUT_MS = 8000;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqCompletionOptions {
  apiKey: string;
  messages: GroqMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Calls Groq's chat completions endpoint with a message list and returns the raw text. */
export async function requestGroqCompletion({
  apiKey,
  messages,
  model = process.env.GROQ_MODEL || DEFAULT_MODEL,
  maxTokens = 1200,
  temperature = 0.4,
}: GroqCompletionOptions): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Groq responded ${response.status}: ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const text = payload.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      throw new Error("Groq returned an empty completion");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Convenience wrapper for one-shot, single-user-message calls (e.g. the compare feature). */
export async function requestGroqPrompt(options: {
  apiKey: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  return requestGroqCompletion({
    apiKey: options.apiKey,
    messages: [{ role: "user", content: options.prompt }],
    model: options.model,
    maxTokens: options.maxTokens,
  });
}
