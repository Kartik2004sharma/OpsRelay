import { answerQuestion, getState, recordDelay, recordRecovery, reviewAction } from "@/lib/ops";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const validation = /^(Enter|Choose|Source note|A delay|A recovery|Invalid action|This action)/.test(message);
  if (!validation) console.error("OpsRelay operation failed:", error);
  return Response.json({ error: validation ? message : "Company graph is unavailable. Check FalkorDB and try again." }, { status: validation ? 400 : 503 });
}

export async function GET() {
  try {
    return Response.json(await getState());
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Choose a valid operation.");
  } catch {
    return Response.json({ error: "Send a valid JSON operation." }, { status: 400 });
  }
  try {
    if (body.kind === "delay") return Response.json(await recordDelay(body.arrivalDate, body.note));
    if (body.kind === "recovery") return Response.json(await recordRecovery(body.arrivalDate, body.note));
    if (body.kind === "review") return Response.json(await reviewAction(body.id, body.decision, body.reviewer));
    if (body.kind === "ask") return Response.json(await answerQuestion(body.question));
    return Response.json({ error: "Choose delay, recovery, review, or ask." }, { status: 400 });
  } catch (error) {
    return failure(error);
  }
}
