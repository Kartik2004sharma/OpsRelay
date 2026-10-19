import { ApiError } from "./http";
import type { ModelContent } from "./agent-loop";

export function modelConfigured() { return Boolean(process.env.GEMINI_API_KEY); }

export async function generate(contents: ModelContent[], system: string, config: Record<string, unknown>, signal?: AbortSignal) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ApiError(503, "The cloud agent is not configured. Add a server-side Gemini API key.");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  if (!/^[a-z0-9.-]{1,80}$/.test(model)) throw new ApiError(503, "The model configuration is invalid.");
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, ...config }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(25_000)]) : AbortSignal.timeout(25_000),
    });
  } catch { throw new ApiError(504, "The cloud model timed out or could not be reached. Your company state was not changed."); }
  if (response.status === 429) throw new ApiError(429, "The model's free quota is exhausted. Try again later; no paid fallback is enabled.");
  if (!response.ok) throw new ApiError(502, `The cloud model rejected this request (HTTP ${response.status}). Check server model access and key configuration.`);
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, "The model returned an empty response.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 256_000) { await reader.cancel(); throw new ApiError(502, "The model response exceeded its size budget."); }
    chunks.push(value);
  }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(502, "The model returned malformed JSON."); }
  const content = data.candidates?.[0]?.content as ModelContent | undefined;
  if (!content?.parts?.length) throw new ApiError(502, "The model did not return a usable answer.");
  return content;
}
