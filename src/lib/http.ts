export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  let originHost: string | null = null;
  try { originHost = origin ? new URL(origin).host : null; } catch { throw new ApiError(403, "Invalid request origin."); }
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && originHost !== request.headers.get("host"))) {
    throw new ApiError(403, "This request must come from the OpsRelay website.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ApiError(415, "Send a JSON operation.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Send a valid JSON operation.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new ApiError(413, "The request is too large."); }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new ApiError(400, "Send a valid JSON operation."); }
}

export function failure(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  const message = error instanceof Error ? error.message : "Unknown error";
  const validation = /^(Enter|Choose|Source note|A delay|A recovery|Invalid action|This action)/.test(message);
  if (!validation) console.error("OpsRelay request failed", { code: (error as { code?: string })?.code || "INTERNAL" });
  return json({ error: validation ? message : "Company graph is unavailable. Please try again shortly." }, validation ? 400 : 503);
}
