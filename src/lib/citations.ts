// Short, per-run handles avoid asking a model to reproduce long content hashes.
// Resolution is server-side; an unknown handle is never accepted as a source.
export function citationHandles(ids: string[]) {
  const toHandle = new Map([...new Set(ids)].map((id, index) => [id, `E${index + 1}`]));
  const toId = new Map([...toHandle].map(([id, handle]) => [handle, id]));
  function encode(value: unknown): unknown {
    if (typeof value === "string") return toHandle.get(value) || value;
    if (Array.isArray(value)) return value.map(encode);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, encode(child)]));
    return value;
  }
  function resolve(handle: string) {
    const id = toId.get(handle);
    if (!id) throw new Error("The agent returned an unknown citation handle.");
    return id;
  }
  const decodeText = (text: string) => text.replace(/\bE\d+\b/g, (handle) => toId.get(handle) || handle);
  return { encode, handle: (id: string) => toHandle.get(id) || id, resolve, decodeText };
}
