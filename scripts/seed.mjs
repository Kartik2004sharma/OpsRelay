import { FalkorDB } from "falkordb";
import { seedGraph } from "../src/lib/seed-data.mjs";
import { loadEnvFile } from "node:process";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }

const url = process.env.FALKORDB_URL || "falkor://127.0.0.1:6379";
const address = new URL(url);
if (!["localhost", "127.0.0.1", "[::1]"].includes(address.hostname) && !["falkors:", "rediss:"].includes(address.protocol)) throw new Error("Remote FalkorDB requires verified TLS.");
const db = await FalkorDB.connect({ url, socket: { connectTimeout: 5000, reconnectStrategy: false } });
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

const count = await seedGraph(graph);
console.log(`Seeded ${count} graph nodes in ${graphName}.`);
await db.close();
