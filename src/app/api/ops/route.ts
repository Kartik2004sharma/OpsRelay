import { answerQuestion, getState, recordDelay, recordRecovery, reviewAction } from "@/lib/ops";
import { requireOperator } from "@/lib/auth";
import { failure, json, readJson } from "@/lib/http";

export async function GET() {
  try {
    const actor = await requireOperator();
    return json({ ...await getState(), actor });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireOperator();
    const body = await readJson(request);
    if (body.kind === "ask") return json(await answerQuestion(body.question));
    const state = body.kind === "delay" ? await recordDelay(body.arrivalDate, body.note, actor)
      : body.kind === "recovery" ? await recordRecovery(body.arrivalDate, body.note, actor)
      : body.kind === "review" ? await reviewAction(body.id, body.decision, actor) : null;
    return state ? json({ ...state, actor }) : json({ error: "Choose delay, recovery, review, or ask." }, 400);
  } catch (error) {
    return failure(error);
  }
}
