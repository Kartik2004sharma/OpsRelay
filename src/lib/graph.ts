import { FalkorDB } from "falkordb";

let clientPromise: ReturnType<typeof FalkorDB.connect> | undefined;

export async function database() {
  const url = process.env.FALKORDB_URL || "falkor://127.0.0.1:6379";
  const address = new URL(url);
  if (process.env.NODE_ENV === "production" && !["localhost", "127.0.0.1", "[::1]"].includes(address.hostname) && !["falkors:", "rediss:"].includes(address.protocol)) {
    throw new Error("Remote FalkorDB connections require TLS.");
  }
  const socket = { connectTimeout: 5000, reconnectStrategy: false as const };
  clientPromise ??= FalkorDB.connect({
    url,
    socket,
  }).then((client) => {
    client.on("error", () => { clientPromise = undefined; });
    return client;
  }).catch((error) => {
    clientPromise = undefined;
    throw error;
  });
  return clientPromise;
}

export async function graph() {
  return (await database()).selectGraph(process.env.FALKORDB_GRAPH || "opsrelay");
}

export async function rows<T extends Record<string, unknown>>(cypher: string, params = {}) {
  const result = await (await graph()).roQuery<T>(cypher, { params });
  return result.data || [];
}

export async function write<T extends Record<string, unknown>>(cypher: string, params = {}) {
  const result = await (await graph()).query<T>(cypher, { params });
  return result.data || [];
}
