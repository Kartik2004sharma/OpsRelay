import { randomUUID } from "node:crypto";
import { rows, write } from "./graph";
import { allocate } from "./allocation";
import { ApiError } from "./http";

const COMPONENT_ID = "CMP-14";

type RootRow = { supplier: string; component: string; supplyId: string; supplyQuantity: number; stockQuantity: number; plannedDate: string; currentDate: string; supplierSourceId: string; stockSourceId: string; currentSourceId: string | null; revision: number };
type OrderRow = { id: string; product: string; units: number; dueDate: string; customer: string; quantity: number; bomSourceId: string; orderSourceId: string; owner: string | null; ownerSourceId: string | null };
type SourceRow = { id: string; title: string; kind: string; body: string; recordedAt: string; status: string };
type EventRow = { id: string; kind: string; arrivalDate: string; note: string; recordedAt: string; sourceId: string; recordedBy: string | null };
type ActionRow = { id: string; orderId: string; title: string; status: string; reviewer: string | null; reviewedAt: string | null; sourceId: string };

export type Impact = {
  id: string;
  product: string;
  customer: string;
  dueDate: string;
  required: number;
  covered: number;
  shortage: number;
  status: "at-risk" | "covered";
  owner: string | null;
  sourceIds: string[];
  path: string[];
};

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function getState() {
  const root = (await rows<RootRow>(`
    MATCH (supplier:Supplier)-[link:SUPPLIES]->(component:Component {id:$componentId})
    MATCH (supply:Supply)-[:FOR_COMPONENT]->(component)
    MATCH (lot:InventoryLot)-[:FOR_COMPONENT]->(component)
    RETURN supplier.name AS supplier, component.name AS component, supply.id AS supplyId,
           supply.quantity AS supplyQuantity, lot.quantity AS stockQuantity,
           supply.plannedDate AS plannedDate, supply.currentDate AS currentDate, link.sourceId AS supplierSourceId, lot.sourceId AS stockSourceId,
           supply.currentSourceId AS currentSourceId, coalesce(supply.revision,0) AS revision
  `, { componentId: COMPONENT_ID }))[0];
  if (!root) throw new Error("Company graph is empty. Run the seed command first.");

  const { supplier, component, supplyId, supplyQuantity, stockQuantity, plannedDate, currentDate, supplierSourceId, stockSourceId } = root;
  const events = await rows<EventRow>(`
    MATCH (event:SupplyEvent)-[:UPDATES]->(supply:Supply {id:$supplyId})
    RETURN event.id AS id, event.kind AS kind, event.arrivalDate AS arrivalDate,
           event.note AS note, event.recordedAt AS recordedAt, event.sourceId AS sourceId, event.recordedBy AS recordedBy
    ORDER BY event.recordedAt DESC
  `, { supplyId });
  const currentSourceId = root.currentSourceId || events[0]?.sourceId || supplierSourceId;
  const orderRows = await rows<OrderRow>(`
    MATCH (component:Component {id:$componentId})<-[requirement:REQUIRES]-(product:Product)<-[:FOR_PRODUCT]-(order:Order)-[:FOR_CUSTOMER]->(customer:Customer)
    OPTIONAL MATCH (order)-[:OWNED_BY]->(person:Person)
    RETURN order.id AS id, product.name AS product, order.quantity AS units, order.dueDate AS dueDate,
           customer.name AS customer, requirement.quantity AS quantity,
           requirement.sourceId AS bomSourceId, order.sourceId AS orderSourceId,
           person.name AS owner, person.sourceId AS ownerSourceId
    ORDER BY order.dueDate, order.id
  `, { componentId: COMPONENT_ID });

  const allocation = allocate(orderRows.map(({ id, units, dueDate, quantity }) => ({
    id, dueDate, required: units * quantity,
  })), stockQuantity, supplyQuantity, currentDate);
  const byId = new Map(allocation.map((item) => [item.id, item]));
  const impacts: Impact[] = orderRows.map(({ id, product, units, dueDate, customer, quantity, bomSourceId, orderSourceId, owner, ownerSourceId }) => {
    const result = byId.get(id)!;
    return {
      id, product, customer, dueDate, required: units * quantity,
      covered: result.covered, shortage: result.shortage,
      status: result.shortage ? "at-risk" : "covered", owner,
      sourceIds: [...new Set([currentSourceId, supplierSourceId, stockSourceId, bomSourceId, orderSourceId, ownerSourceId].filter((value): value is string => Boolean(value)))],
      path: [supplier, component, product, id, customer],
    };
  });

  const sources = await rows<SourceRow>(`
    MATCH (source:SourceRecord)
    RETURN source.id AS id, source.title AS title, source.kind AS kind, source.body AS body,
           source.recordedAt AS recordedAt, source.status AS status
    ORDER BY source.id
  `);
  const actions = await rows<ActionRow>(`
    MATCH (action:Action)
    RETURN action.id AS id, action.orderId AS orderId, action.title AS title,
           action.status AS status, action.reviewer AS reviewer,
           action.reviewedAt AS reviewedAt, action.sourceId AS sourceId
    ORDER BY action.createdAt DESC
  `);

  const revision = (await rows<{ revision: number }>("MATCH (s:Supply {id:$supplyId}) RETURN coalesce(s.revision,0) AS revision", { supplyId }))[0]?.revision;
  if (revision !== root.revision) throw new ApiError(409, "The company graph changed. Refresh and try again.");

  return {
    supplier, component, componentId: COMPONENT_ID,
    supplyId, supplyQuantity, stockQuantity, plannedDate, currentDate, currentSourceId, revision,
    impactedCount: impacts.filter((order) => order.status === "at-risk").length,
    impacts, sources, events, actions,
    lastUpdatedAt: [...sources.map((source) => source.recordedAt), ...events.map((event) => event.recordedAt), ...actions.map((action) => action.reviewedAt)].filter((value): value is string => Boolean(value)).sort().at(-1),
  };
}

async function recordSupplyUpdate(kind: "delay" | "recovery", arrivalDate: unknown, rawNote: unknown, actor: string) {
  if (!validDate(arrivalDate)) throw new Error("Enter a valid arrival date in YYYY-MM-DD format.");
  const note = typeof rawNote === "string" ? rawNote.trim().replace(/\s+/g, " ") : "";
  if (note.length < 8 || note.length > 280) throw new Error("Source note must be 8–280 characters.");
  const before = await getState();
  if (kind === "delay" && arrivalDate <= before.currentDate) throw new Error("A delay must move arrival later than the current date.");
  if (kind === "recovery" && arrivalDate >= before.currentDate) throw new Error("A recovery must move arrival earlier than the current date.");
  const id = randomUUID();
  const sourceId = `SRC-${id}`;
  const recordedAt = new Date().toISOString();
  const allocation = allocate(before.impacts.map((order) => ({ id: order.id, dueDate: order.dueDate, required: order.required })), before.stockQuantity, before.supplyQuantity, arrivalDate);
  const threatened = new Set(allocation.filter((order) => order.shortage > 0).map((order) => order.id));
  const drafts = before.impacts.filter((order) => threatened.has(order.id)).map((order) => ({ id: `${id}-${order.id}`, orderId: order.id, title: `Review ${order.id} delivery with ${order.customer}` }));
  const updated = await write<{ id: string }>(`
    MATCH (supply:Supply {id:$supplyId})
    WHERE coalesce(supply.revision,0) = $revision
    MATCH (previous:SourceRecord {id:$previousSourceId})
    OPTIONAL MATCH (pending:Action {status:'proposed'})
    WITH supply, previous, collect(pending) AS pendingActions
    CREATE (source:SourceRecord {id:$sourceId, title:$title, kind:$kind, body:$note, recordedAt:$recordedAt, status:'current'})
    CREATE (event:SupplyEvent {id:$id, kind:$kind, arrivalDate:$arrivalDate, note:$note, recordedAt:$recordedAt, sourceId:$sourceId, recordedBy:$actor})
    CREATE (event)-[:UPDATES]->(supply)
    CREATE (event)-[:SUPPORTED_BY]->(source)
    CREATE (previous)-[:SUPERSEDED_BY]->(source)
    SET supply.currentDate = $arrivalDate, supply.currentSourceId = $sourceId, supply.revision = $revision + 1
    SET previous.status = 'superseded'
    FOREACH (draft IN $drafts |
      CREATE (action:Action {id:draft.id, orderId:draft.orderId, title:draft.title, status:'proposed', createdAt:$recordedAt, sourceId:$sourceId})
      CREATE (action)-[:RESPONDS_TO]->(event))
    FOREACH (action IN CASE WHEN $closePending THEN pendingActions ELSE [] END |
      SET action.status = 'superseded', action.reviewedAt = $recordedAt)
    RETURN event.id AS id
  `, { supplyId: before.supplyId, revision: before.revision, previousSourceId: before.currentSourceId, sourceId, title: kind === "delay" ? "Supplier delay notice" : "Recovery confirmation", kind, note, recordedAt, id, arrivalDate, actor, drafts, closePending: true });
  if (!updated.length) throw new ApiError(409, "The company graph changed. Refresh and try again.");
  return getState();
}

export function recordDelay(arrivalDate: unknown, note: unknown, actor: string) {
  return recordSupplyUpdate("delay", arrivalDate, note, actor);
}

export function recordRecovery(arrivalDate: unknown, note: unknown, actor: string) {
  return recordSupplyUpdate("recovery", arrivalDate, note, actor);
}

export async function reviewAction(id: unknown, decision: unknown, reviewer: unknown) {
  if (typeof id !== "string" || !/^[a-f0-9-]{36}-SO-\d{4}$/.test(id)) throw new Error("Invalid action ID.");
  if (decision !== "approved" && decision !== "rejected") throw new Error("Choose approve or reject.");
  const actor = typeof reviewer === "string" ? reviewer.trim().replace(/\s+/g, " ") : "";
  if (actor.length < 2 || actor.length > 60) throw new Error("Enter a reviewer name (2–60 characters).");
  const updated = await write<{ id: string }>(`
    MATCH (action:Action {id:$id, status:'proposed'})
    SET action.status = $decision, action.reviewer = $reviewer, action.reviewedAt = $reviewedAt
    RETURN action.id AS id
  `, { id, decision, reviewer: actor, reviewedAt: new Date().toISOString() });
  if (!updated.length) throw new Error("This action was already reviewed or does not exist.");
  return getState();
}

export async function answerQuestion(rawQuestion: unknown) {
  const question = typeof rawQuestion === "string" ? rawQuestion.trim().replace(/\s+/g, " ") : "";
  if (question.length < 8 || question.length > 300) throw new Error("Enter a question of 8–300 characters.");
  const state = await getState();
  const atRisk = state.impacts.filter((order) => order.status === "at-risk");
  const focus = /who|owner|contact|responsib/i.test(question) ? "owners" : /source|why|evidence|proof/i.test(question) ? "evidence" : /impact|risk|threat|commitment|order|delay|motor|supply|recover/i.test(question) ? "impact" : "scope";
  const answer = focus === "owners"
    ? atRisk.length ? atRisk.map((order) => `${order.id}: ${order.owner || "owner not recorded"} should review the ${order.shortage}-motor shortage for ${order.customer}.`).join(" ") : "No current order shortage needs an owner response."
    : focus === "evidence"
      ? atRisk.length ? atRisk.map((order) => `${order.id} follows ${order.path.join(" → ")}; ${order.required} motors are needed and ${order.covered} are covered by its due date.`).join(" ") : "The current graph shows all seeded orders covered. Open any order to inspect its source path."
      : focus === "scope" ? "I can trace supplier delays, order coverage, response owners, and source evidence in this company graph. Ask which commitments are at risk or who owns their response."
      : atRisk.length ? `${atRisk.length} customer commitments are at risk after the ${state.component} arrival moved to ${state.currentDate}. ${atRisk.map((order) => `${order.id} needs ${order.required} motors and is short ${order.shortage}`).join("; ")}.`
        : `All ${state.impacts.length} seeded customer commitments are covered under the current ${state.component} arrival date of ${state.currentDate}.`;
  return {
    answer,
    mode: "Deterministic graph analysis",
    sources: [...new Set((atRisk.length ? atRisk : state.impacts).flatMap((order) => order.sourceIds))],
    graphPaths: (atRisk.length ? atRisk : state.impacts).map((order) => ({ orderId: order.id, path: order.path })),
  };
}
