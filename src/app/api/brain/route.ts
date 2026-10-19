import { requireSession, limit } from "@/lib/auth";
import { graphScope } from "@/lib/graph";
import { failure, json, readJson, ApiError } from "@/lib/http";
import { knowledge, importNotice, reviewNotice, rememberLesson, createMessageDraft, reviewMessageDraft } from "@/lib/knowledge";
import { investigate } from "@/lib/agent";
import { modelConfigured } from "@/lib/gemini";
import { ragStatus, indexDocument, searchKnowledge } from "@/lib/graphrag";

export async function GET() {
  try {
    const session = await requireSession();
    return await graphScope.run(session.graphName, async () => json({ ...await knowledge(), agentConfigured: modelConfigured(), graphRag: await ragStatus() }));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson(request, 32_768);
    return await graphScope.run(session.graphName, async () => {
      const actor = session.actor;
      if (body.kind === "index_document" || body.kind === "search_knowledge") {
        await limit(`rag:${session.graphName}`, 3, 60);
        await limit("rag-global", 20, 3600);
        return json(body.kind === "index_document" ? await indexDocument(body.id) : await searchKnowledge(body.question));
      }
      if (body.kind === "investigate") {
        await limit(`agent:${session.graphName}`, 4, 60);
        await limit("agent-global", 30, 3600);
        return json(await investigate(body.question, actor));
      }
      if (body.kind === "import_notice") await importNotice(body.title, body.body, actor);
      else if (body.kind === "review_notice") await reviewNotice(body.id, body.decision, body.arrivalDate, actor);
      else if (body.kind === "remember") await rememberLesson(body.text, body.sourceId, actor);
      else if (body.kind === "create_draft") await createMessageDraft(body.orderId, actor);
      else if (body.kind === "review_draft") await reviewMessageDraft(body.id, body.decision, actor);
      else throw new ApiError(400, "Choose a supported company brain operation.");
      return json({ ...await knowledge(), agentConfigured: modelConfigured() });
    });
  } catch (error) { return failure(error); }
}
