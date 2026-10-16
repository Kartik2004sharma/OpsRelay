import { FalkorDB } from "falkordb";
import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }

const db = await FalkorDB.connect({ url: process.env.FALKORDB_URL || "falkor://127.0.0.1:6379", socket: { connectTimeout: 5000, reconnectStrategy: false } });
const graphName = process.env.FALKORDB_GRAPH || "opsrelay";
const graph = db.selectGraph(graphName);
const exists = (await db.list()).includes(graphName);

if (process.argv.includes("--reset")) {
  if (process.env.OPSRELAY_ALLOW_RESET !== "1") throw new Error("Set OPSRELAY_ALLOW_RESET=1 to delete the selected graph.");
  if (exists) await graph.delete();
} else if (exists && (await graph.roQuery("MATCH (n) RETURN count(n) AS count")).data?.[0]?.count > 0) {
  console.log(`Kept existing graph ${graphName} unchanged. Use the explicit reset command to replace it.`);
  await db.close();
  process.exit(0);
}

const nodes = [
  ["Supplier", { id: "SUP-01", name: "Kestrel Components" }],
  ["Component", { id: "CMP-14", name: "M14 drive motor" }],
  ["Supply", { id: "DEL-204", quantity: 6, plannedDate: "2026-10-20", currentDate: "2026-10-20", currentSourceId: "SRC-PO-204", revision: 0 }],
  ["InventoryLot", { id: "INV-01", quantity: 2, availableDate: "2026-10-15", sourceId: "SRC-STOCK-01" }],
  ["Product", { id: "PRD-A", name: "Atlas Conveyor" }],
  ["Product", { id: "PRD-B", name: "Boreal Sorter" }],
  ["Order", { id: "SO-1041", quantity: 2, dueDate: "2026-10-25", sourceId: "SRC-ORDER-1041" }],
  ["Order", { id: "SO-1042", quantity: 3, dueDate: "2026-10-28", sourceId: "SRC-ORDER-1042" }],
  ["Order", { id: "SO-1043", quantity: 1, dueDate: "2026-11-15", sourceId: "SRC-ORDER-1043" }],
  ["Customer", { id: "CUS-01", name: "Hightower Distribution" }],
  ["Customer", { id: "CUS-02", name: "Vale Foods" }],
  ["Customer", { id: "CUS-03", name: "Cedar Logistics" }],
  ["Person", { id: "P-01", name: "Ari Chen", sourceId: "SRC-OWNER-1" }],
  ["Person", { id: "P-02", name: "Sam Rivera", sourceId: "SRC-OWNER-2" }],
  ["Team", { id: "T-01", name: "Customer Operations" }],
  ["SourceRecord", { id: "SRC-PO-204", title: "Purchase order PO-204", kind: "purchase order", body: "Six M14 motors confirmed for 20 October 2026.", recordedAt: "2026-10-14T09:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-STOCK-01", title: "M14 inventory count", kind: "inventory record", body: "Two M14 motors are available in inventory on 15 October 2026.", recordedAt: "2026-10-15T00:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-BOM-A", title: "Atlas bill of materials", kind: "product record", body: "Each Atlas Conveyor requires two M14 motors.", recordedAt: "2026-10-14T09:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-BOM-B", title: "Boreal bill of materials", kind: "product record", body: "Each Boreal Sorter requires one M14 motor.", recordedAt: "2026-10-14T09:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-ORDER-1041", title: "Customer order SO-1041", kind: "order", body: "Hightower Distribution ordered two Atlas Conveyors for 25 October.", recordedAt: "2026-10-14T10:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-ORDER-1042", title: "Customer order SO-1042", kind: "order", body: "Vale Foods ordered three Boreal Sorters for 28 October.", recordedAt: "2026-10-14T10:05:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-ORDER-1043", title: "Customer order SO-1043", kind: "order", body: "Cedar Logistics ordered one Boreal Sorter for 15 November.", recordedAt: "2026-10-14T10:10:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-OWNER-1", title: "Account ownership roster", kind: "team record", body: "Ari Chen owns the Hightower delivery response.", recordedAt: "2026-10-14T11:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-OWNER-2", title: "Account ownership roster", kind: "team record", body: "Sam Rivera owns the Vale Foods delivery response.", recordedAt: "2026-10-14T11:00:00Z", status: "current" }],
  ["SourceRecord", { id: "SRC-PLAN-OLD", title: "Old supply planning note", kind: "decision", body: "Earlier draft expected the M14 shipment on 18 October; superseded by purchase order PO-204.", recordedAt: "2026-10-12T08:00:00Z", status: "superseded" }],
];

for (const [label, props] of nodes) {
  await graph.query(`MERGE (n:${label} {id:$id}) SET n += $props`, { params: { id: props.id, props } });
}

const edges = [
  ["Supplier", "SUP-01", "SUPPLIES", "Component", "CMP-14", { sourceId: "SRC-PO-204" }],
  ["Supply", "DEL-204", "FOR_COMPONENT", "Component", "CMP-14", {}],
  ["InventoryLot", "INV-01", "FOR_COMPONENT", "Component", "CMP-14", {}],
  ["Product", "PRD-A", "REQUIRES", "Component", "CMP-14", { quantity: 2, sourceId: "SRC-BOM-A" }],
  ["Product", "PRD-B", "REQUIRES", "Component", "CMP-14", { quantity: 1, sourceId: "SRC-BOM-B" }],
  ["Order", "SO-1041", "FOR_PRODUCT", "Product", "PRD-A", {}],
  ["Order", "SO-1042", "FOR_PRODUCT", "Product", "PRD-B", {}],
  ["Order", "SO-1043", "FOR_PRODUCT", "Product", "PRD-B", {}],
  ["Order", "SO-1041", "FOR_CUSTOMER", "Customer", "CUS-01", {}],
  ["Order", "SO-1042", "FOR_CUSTOMER", "Customer", "CUS-02", {}],
  ["Order", "SO-1043", "FOR_CUSTOMER", "Customer", "CUS-03", {}],
  ["Order", "SO-1041", "OWNED_BY", "Person", "P-01", {}],
  ["Order", "SO-1042", "OWNED_BY", "Person", "P-02", {}],
  ["Person", "P-01", "MEMBER_OF", "Team", "T-01", {}],
  ["Person", "P-02", "MEMBER_OF", "Team", "T-01", {}],
  ["SourceRecord", "SRC-PLAN-OLD", "SUPERSEDED_BY", "SourceRecord", "SRC-PO-204", {}],
];

for (const [fromLabel, fromId, edge, toLabel, toId, props] of edges) {
  await graph.query(`MATCH (a:${fromLabel} {id:$fromId}), (b:${toLabel} {id:$toId}) MERGE (a)-[r:${edge}]->(b) SET r += $props`, {
    params: { fromId, toId, props },
  });
}

const count = (await graph.query("MATCH (n) RETURN count(n) AS count")).data?.[0]?.count;
assert.equal(count, 25, "The synthetic baseline must contain 25 nodes.");
const requirements = (await graph.roQuery("MATCH (o:Order)-[:FOR_PRODUCT]->(p:Product)-[r:REQUIRES]->(:Component) RETURN o.id AS id, o.quantity * r.quantity AS required ORDER BY o.id")).data;
assert.deepEqual(requirements?.map((order) => order.required), [4, 3, 1], "Seeded orders must require 4, 3, and 1 motors.");
console.log(`Seeded ${count} graph nodes in ${graphName}.`);
await db.close();
