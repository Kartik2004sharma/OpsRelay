import { randomBytes } from "node:crypto";
import { database } from "./graph";
import { createSession, limit } from "./auth";
import { seedGraph } from "./seed-data.mjs";
import { ApiError } from "./http";

export async function startDemo(secure: boolean) {
  await limit("demo-create", 12, 60);
  const db = await database();
  const connection = await db.connection;
  const base = process.env.FALKORDB_GRAPH || "opsrelay";
  const registry = `opsrelay:${base}:demos`;
  const expired = await connection.zRangeByScore(registry, 0, Date.now());
  // shortcut: expired disposable demos are collected on the next demo creation, not by a background worker.
  for (const name of expired) {
    if (name.startsWith(`${base}_demo_`) && /^[a-f0-9]{24}$/.test(name.slice(`${base}_demo_`.length))) {
      try { await db.selectGraph(name).delete(); } catch (error) { if (!String(error).includes("does not exist")) throw error; }
    }
    await connection.zRem(registry, name);
  }
  const graphName = `${base}_demo_${randomBytes(12).toString("hex")}`;
  const reserved = await connection.eval("if redis.call('ZCARD',KEYS[1]) >= 40 then return 0 end; redis.call('ZADD',KEYS[1],ARGV[1],ARGV[2]); return 1", {
    keys: [registry], arguments: [String(Date.now() + 3600000), graphName],
  });
  if (!reserved) throw new ApiError(429, "All demo workspaces are in use. Please try again later.");
  try {
    await seedGraph(db.selectGraph(graphName));
    await createSession({ actor: "Demo reviewer", graphName, demo: true }, secure);
  } catch (error) {
    await connection.zRem(registry, graphName);
    try { await db.selectGraph(graphName).delete(); } catch { /* no graph was created */ }
    throw error;
  }
}
