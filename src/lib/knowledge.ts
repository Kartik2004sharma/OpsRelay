import { createHash, randomUUID } from "node:crypto";
import { rows, write } from "./graph";
import { getState, recordSupplyUpdate } from "./ops";
import { ApiError } from "./http";
import { validateNotice, noticeDates } from "./notice";

export type DocumentRow = { id: string; title: string; body: string; status: string; revision: number; sourceId: string; createdAt: string; reviewedBy: string | null };
export type RunRow = { id: string; question: string; summary: string; sourceIds: string; nextSteps: string; trace: string; revision: number; createdAt: string; model: string; citationRepair: boolean | null };
export type LessonRow = { id: string; text: string; sourceId: string; createdAt: string; actor: string };
export type DraftRow = { id: string; orderId: string; body: string; status: string; revision: number; sourceIds: string; createdAt: string; reviewer: string | null };

export async function knowledge() {
  const documents = await rows<DocumentRow>("MATCH (d:Document) RETURN d.id AS id,d.title AS title,d.body AS body,d.status AS status,d.revision AS revision,d.sourceId AS sourceId,d.createdAt AS createdAt,d.reviewedBy AS reviewedBy ORDER BY d.createdAt DESC LIMIT 30");
  const investigations = await rows<RunRow>("MATCH (r:AgentRun) RETURN r.id AS id,r.question AS question,r.summary AS summary,r.sourceIds AS sourceIds,r.nextSteps AS nextSteps,r.trace AS trace,r.revision AS revision,r.createdAt AS createdAt,r.model AS model,r.citationRepair AS citationRepair ORDER BY r.createdAt DESC LIMIT 12");
  const lessons = await rows<LessonRow>("MATCH (l:Lesson) RETURN l.id AS id,l.text AS text,l.sourceId AS sourceId,l.createdAt AS createdAt,l.actor AS actor ORDER BY l.createdAt DESC LIMIT 20");
  const drafts = await rows<DraftRow>("MATCH (d:MessageDraft) RETURN d.id AS id,d.orderId AS orderId,d.body AS body,d.status AS status,d.revision AS revision,d.sourceIds AS sourceIds,d.createdAt AS createdAt,d.reviewer AS reviewer ORDER BY d.createdAt DESC LIMIT 20");
  return { documents: documents.map((doc) => ({ ...doc, dates: noticeDates(doc.body) })), investigations: investigations.map((run) => ({ ...run, sourceIds: JSON.parse(run.sourceIds), nextSteps: JSON.parse(run.nextSteps), trace: JSON.parse(run.trace) })), lessons, drafts: drafts.map((draft) => ({ ...draft, sourceIds: JSON.parse(draft.sourceIds) })) };
}

export async function importNotice(title: unknown, body: unknown, actor: string) {
  const valid = validateNotice(title, body);
  const before = await getState();
  const hash = createHash("sha256").update(valid.body).digest("hex");
  const id = `DOC-${hash}`;
  const sourceId = `NOTICE-${hash}`;
  const count = (await rows<{ count: number }>("MATCH (d:Document) RETURN count(d) AS count"))[0]?.count || 0;
  if (count >= 30) throw new ApiError(429, "This workspace has reached its 30-document limit.");
  await write(`MERGE (doc:Document {id:$id}) ON CREATE SET doc.title=$title,doc.body=$body,doc.status='pending',doc.revision=$revision,doc.sourceId=$sourceId,doc.createdAt=$createdAt,doc.importedBy=$actor
    MERGE (source:SourceRecord {id:$sourceId}) ON CREATE SET source.title=$title,source.kind='uploaded notice',source.body=$body,source.recordedAt=$createdAt,source.status='pending review'
    MERGE (doc)-[:HAS_SOURCE]->(source)`, { id, sourceId, ...valid, revision: before.revision, createdAt: new Date().toISOString(), actor });
  return id;
}

export async function reviewNotice(id: unknown, decision: unknown, arrivalDate: unknown, actor: string) {
  if (typeof id !== "string" || !/^DOC-[a-f0-9]{64}$/.test(id)) throw new ApiError(400, "Invalid document ID.");
  const doc = (await rows<DocumentRow>("MATCH (d:Document {id:$id}) RETURN d.id AS id,d.body AS body,d.status AS status,d.revision AS revision,d.sourceId AS sourceId", { id }))[0];
  if (!doc || doc.status !== "pending") throw new ApiError(409, "This notice is no longer pending review.");
  if (decision === "reject") {
    const result = await write("MATCH (d:Document {id:$id,status:'pending'})-[:HAS_SOURCE]->(s:SourceRecord) SET d.status='rejected',d.reviewedBy=$actor,d.reviewedAt=$now,s.status='rejected' RETURN d.id AS id", { id, actor, now: new Date().toISOString() });
    if (!result.length) throw new ApiError(409, "This notice was already reviewed.");
    return;
  }
  if (decision !== "apply" || typeof arrivalDate !== "string" || !noticeDates(doc.body).includes(arrivalDate)) throw new ApiError(400, "Choose an arrival date present in the original notice.");
  const state = await getState();
  if (doc.revision !== state.revision) throw new ApiError(409, "Supply changed since this notice was imported. Reject it and import a current notice for review.");
  if (arrivalDate === state.currentDate) throw new ApiError(400, "The chosen arrival date already matches the current supply plan.");
  const note = `Reviewed notice ${id.slice(0, 16)}: arrival ${arrivalDate}. ${doc.body.slice(0, 180)}`;
  await recordSupplyUpdate(arrivalDate > state.currentDate ? "delay" : "recovery", arrivalDate, note, actor, id);
}

export async function rememberLesson(text: unknown, sourceId: unknown, actor: string) {
  if (typeof text !== "string" || text.trim().length < 12 || text.length > 500 || typeof sourceId !== "string") throw new ApiError(400, "Enter a lesson of 12–500 characters and an existing source.");
  const count = (await rows<{ count: number }>("MATCH (l:Lesson) RETURN count(l) AS count"))[0]?.count || 0;
  if (count >= 20) throw new ApiError(429, "This workspace has reached its 20-lesson limit.");
  const result = await write("MATCH (s:SourceRecord {id:$sourceId}) CREATE (l:Lesson {id:$id,text:$text,sourceId:$sourceId,actor:$actor,createdAt:$createdAt}) CREATE (l)-[:SUPPORTED_BY]->(s) RETURN l.id AS id", { id: `LESSON-${randomUUID()}`, text: text.trim(), sourceId, actor, createdAt: new Date().toISOString() });
  if (!result.length) throw new ApiError(400, "Choose an existing source for this lesson.");
}

export async function createMessageDraft(orderId: unknown, actor: string) {
  const state = await getState();
  const order = state.impacts.find((item) => item.id === orderId);
  if (!order) throw new ApiError(400, "Choose an order from this workspace.");
  const count = (await rows<{ count: number }>("MATCH (d:MessageDraft) RETURN count(d) AS count"))[0]?.count || 0;
  if (count >= 20) throw new ApiError(429, "This workspace has reached its 20-draft limit.");
  const body = `Subject: ${order.id} delivery review\n\nHello ${order.customer},\n\nWe are reviewing your ${order.product} commitment due ${order.dueDate}. Current component arrival: ${state.currentDate}. Required: ${order.required} motors; covered: ${order.covered}; shortage: ${order.shortage}.\n\n${order.shortage ? "We are assessing recovery options. An alternative delivery promise has not been confirmed." : "The current supply plan covers this commitment."}\n\nResponse owner: ${order.owner || "not recorded; assign an owner before outreach"}.\n\nPrepared by ${actor}. Review required; this message has not been sent.\nSources: ${order.sourceIds.join(", ")}`;
  await write("MATCH (s:Supply {id:$supplyId}) WHERE coalesce(s.revision,0)=$revision MATCH (o:Order {id:$orderId}) CREATE (d:MessageDraft {id:$id,orderId:$orderId,body:$body,status:'proposed',revision:$revision,sourceIds:$sourceIds,createdAt:$now}) CREATE (d)-[:FOR_ORDER]->(o) RETURN d.id AS id", { supplyId: state.supplyId, revision: state.revision, orderId, id: `MSG-${randomUUID()}`, body, sourceIds: JSON.stringify(order.sourceIds), now: new Date().toISOString() }).then((result) => { if (!result.length) throw new ApiError(409, "Supply changed; create a fresh draft."); });
}

export async function reviewMessageDraft(id: unknown, decision: unknown, actor: string) {
  if (typeof id !== "string" || !/^MSG-[a-f0-9-]{36}$/.test(id) || !["approved", "rejected"].includes(String(decision))) throw new ApiError(400, "Choose a draft and an approval decision.");
  const state = await getState();
  const result = await write("MATCH (s:Supply {id:$supplyId}) WHERE coalesce(s.revision,0)=$revision MATCH (d:MessageDraft {id:$id,status:'proposed'}) WHERE d.revision=$revision OR $decision='rejected' SET d.status=$decision,d.reviewer=$actor,d.reviewedAt=$now RETURN d.id AS id", { supplyId: state.supplyId, revision: state.revision, id, decision, actor, now: new Date().toISOString() });
  if (!result.length) throw new ApiError(409, "This draft was reviewed or its supply facts changed. Create a fresh draft.");
}
