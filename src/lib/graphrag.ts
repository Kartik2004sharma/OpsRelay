import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { database, graphScope, rows, write } from "./graph";
import { ApiError } from "./http";

export const ragConfigured = () => process.env.GRAPHRAG_ENABLED === "1" && Boolean(process.env.GEMINI_API_KEY);
export type Evidence = { sourceId: string; chunkId: string; text: string; entities: string[]; title: string; historical: boolean };
const workspace = () => {
  const scope = graphScope.getStore();
  if (!scope) throw new ApiError(500, "A workspace is required for document search.");
  return scope;
};
const companion = (scope: string) => `opsrelay_rag_${createHash("sha256").update(scope).digest("hex").slice(0, 32)}`;

async function worker(payload: Record<string, unknown>) {
  if (!ragConfigured()) throw new ApiError(503, "Document search is not configured. Enable the GraphRAG SDK worker and server-side Gemini key.");
  const scope = workspace();
  const connection = await (await database()).connection;
  const lockKey = `opsrelay:${process.env.FALKORDB_GRAPH || "opsrelay"}:rag-worker`;
  const token = randomUUID();
  if (!await connection.set(lockKey, token, { NX: true, EX: 85 })) throw new ApiError(429, "Document search is busy. Retry in a minute.");
  try {
    const output = await new Promise<string>((resolve, reject) => {
      // Docker copies the worker explicitly; do not trace the interpreter or private environment.
      const child = execFile(/* turbopackIgnore: true */ process.env.GRAPHRAG_PYTHON || "python3",
        [path.join(process.cwd(), "graphrag/worker.py")],
        { timeout: payload.operation === "search" ? 25_000 : 75_000, maxBuffer: 65_536, killSignal: "SIGKILL", env: {
          NODE_ENV: process.env.NODE_ENV, PATH: process.env.PATH, PYTHONUNBUFFERED: "1", FALKORDB_URL: process.env.FALKORDB_URL,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY, GEMINI_MODEL: process.env.GEMINI_MODEL,
          GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL,
        } },
        (error, stdout, stderr) => {
          if (error) {
            // Log only failure codes/classes; vendor messages may contain private evidence.
            console.error("GraphRAG worker failure", { code: error.code, signal: error.signal, type: stdout.match(/"errorType":\s*"([A-Za-z]+)"/)?.[1] || stderr.match(/(?:^|\n)([A-Za-z]+Error):/)?.[1] || "unknown", status: stdout.match(/"status":\s*(\d{3})/)?.[1] });
            reject(new ApiError(stdout.includes('"SDK_QUOTA"') ? 429 : 503,
              stdout.includes('"SDK_QUOTA"') ? "The model’s free quota is exhausted. No paid fallback is enabled." : "Document indexing or search could not finish. Check the SDK worker and cloud provider, then retry."));
          } else resolve(stdout);
        });
      child.stdin?.on("error", () => { /* execFile reports worker startup failures. */ });
      child.stdin?.end(JSON.stringify({ ...payload, graphName: companion(scope) }));
    });
    return JSON.parse(output);
  } finally {
    const base = process.env.FALKORDB_GRAPH || "opsrelay";
    if (scope.startsWith(`${base}_demo_`)) {
      const expiry = await connection.zScore(`opsrelay:${base}:demos`, scope);
      for (const key of [companion(scope), `${companion(scope)}__ontology`]) {
        await connection.expire(key, Math.max(1, Math.ceil((Number(expiry || Date.now()) - Date.now()) / 1000))).catch(() => {});
      }
    }
    await connection.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", { keys: [lockKey], arguments: [token] });
  }
}

export async function ragStatus() {
  const indexed = await rows<{ id: string; indexedAt: string }>("MATCH (d:Document {status:'applied'}) WHERE d.ragStatus='indexed' RETURN d.id AS id,d.ragIndexedAt AS indexedAt");
  return { configured: ragConfigured(), indexed, provider: "Gemini", sdk: "1.4.0" };
}

export async function indexDocument(id: unknown) {
  if (typeof id !== "string" || !/^DOC-[a-f0-9]{64}$/.test(id)) throw new ApiError(400, "Choose a reviewed document to index.");
  const docs = await rows<{ body: string; sourceId: string; ragStatus: string }>("MATCH (d:Document {id:$id,status:'applied'}) RETURN d.body AS body,d.sourceId AS sourceId,d.ragStatus AS ragStatus", { id });
  const doc = docs[0];
  if (!doc) throw new ApiError(409, "Apply a reviewed notice before indexing its evidence.");
  if (doc.ragStatus === "indexed") return { indexed: true, alreadyIndexed: true };
  await worker({ operation: "index", document: doc });
  await write("MATCH (d:Document {id:$id,status:'applied'}) SET d.ragStatus='indexed',d.ragIndexedAt=$now RETURN d.id AS id", { id, now: new Date().toISOString() });
  return { indexed: true };
}

export async function searchKnowledge(question: unknown): Promise<{ items: Evidence[]; sdk: string }> {
  if (typeof question !== "string" || question.trim().length < 3 || question.length > 500) throw new ApiError(400, "Enter a document search of 3–500 characters.");
  const docs = await rows<{ sourceId: string; body: string; title: string; status: string }>("MATCH (d:Document {status:'applied',ragStatus:'indexed'})-[:HAS_SOURCE]->(:SourceRecord) OPTIONAL MATCH (decision:SourceRecord)-[:EXTRACTED_FROM]->(d) RETURN d.sourceId AS sourceId,d.body AS body,d.title AS title,decision.status AS status");
  if (!docs.length) return { items: [], sdk: "1.4.0" };
  const result = await worker({ operation: "search", question: question.trim() });
  if (!Array.isArray(result.items)) throw new ApiError(502, "Document search returned invalid evidence.");
  const items: Evidence[] = [];
  for (const item of result.items.slice(0, 6)) {
    const doc = docs.find((d) => d.sourceId === item.sourceId);
    // Cross-check exact original text; extracted claims cannot manufacture source provenance.
    if (!doc || typeof item.text !== "string" || !doc.body.includes(item.text) || typeof item.chunkId !== "string") continue;
    items.push({ sourceId: doc.sourceId, chunkId: item.chunkId, text: item.text, entities: Array.isArray(item.entities) ? item.entities.filter((x: unknown): x is string => typeof x === "string").slice(0, 12) : [], title: doc.title, historical: doc.status !== "current" });
  }
  return { items, sdk: "1.4.0" };
}
