import { answerQuestion, getState, recordDelay, recordRecovery, reviewAction } from "@/lib/ops";
import { requireSession } from "@/lib/auth";
import { graphScope } from "@/lib/graph";
import { failure, json, readJson } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireSession();
    return await graphScope.run(session.graphName, async () => json({ ...await getState(), actor: session.actor, demo: session.demo }));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    return await graphScope.run(session.graphName, async () => {
      const actor = session.actor;
      const body = await readJson(request);
      if (body.kind === "ask") return json(await answerQuestion(body.question));
      const state = body.kind === "delay" ? await recordDelay(body.arrivalDate, body.note, actor)
        : body.kind === "recovery" ? await recordRecovery(body.arrivalDate, body.note, actor)
        : body.kind === "review" ? await reviewAction(body.id, body.decision, actor) : null;
      return state ? json({ ...state, actor, demo: session.demo }) : json({ error: "Choose delay, recovery, review, or ask." }, 400);
    });
  } catch (error) {
    return failure(error);
  }
}
