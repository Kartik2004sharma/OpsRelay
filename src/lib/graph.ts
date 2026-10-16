import { FalkorDB } from "falkordb";

let clientPromise: ReturnType<typeof FalkorDB.connect> | undefined;

export async function graph() {
  const socket = { connectTimeout: 5000, reconnectStrategy: false as const };
  clientPromise ??= FalkorDB.connect({
    url: process.env.FALKORDB_URL || "falkor://127.0.0.1:6379",
    socket,
  }).then((client) => {
    client.on("error", () => { clientPromise = undefined; });
    return client;
  }).catch((error) => {
    clientPromise = undefined;
    throw error;
  });
  const client = await clientPromise;
  return client.selectGraph(process.env.FALKORDB_GRAPH || "opsrelay");
}

export async function rows<T extends Record<string, unknown>>(cypher: string, params = {}) {
  const result = await (await graph()).roQuery<T>(cypher, { params });
  return result.data || [];
}

export async function write<T extends Record<string, unknown>>(cypher: string, params = {}) {
  const result = await (await graph()).query<T>(cypher, { params });
  return result.data || [];
}
