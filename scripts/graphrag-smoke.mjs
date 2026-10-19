// Explicit cloud-quota smoke test. Uses only a fresh disposable demo workspace.
import assert from 'node:assert/strict';
const base = process.env.OPSRELAY_TEST_BASE || 'http://127.0.0.1:3102';
let cookie = '';
async function call(route, body) {
  const response = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(85_000) });
  cookie = response.headers.get('set-cookie')?.split(';')[0] || cookie;
  const data = await response.json();
  assert.equal(response.status, 200, `Unexpected HTTP ${response.status}: ${data.error || 'unknown error'}`);
  return data;
}
await call('/api/session', { kind: 'demo' });
const body = 'Kestrel Components confirms M14 motors will arrive on 2026-10-25. The supplier changed the date after a transport disruption. Operations should review affected customer commitments with their recorded response owners.';
await call('/api/brain', { kind: 'import_notice', title: 'Cloud SDK verified notice', body });
const imported = await call('/api/brain'); const doc = imported.documents[0];
await call('/api/brain', { kind: 'review_notice', id: doc.id, decision: 'apply', arrivalDate: '2026-10-25' });
const before = await call('/api/ops');
const indexed = await call('/api/brain', { kind: 'index_document', id: doc.id });
assert.equal(indexed.indexed, true);
const result = await call('/api/brain', { kind: 'search_knowledge', question: 'When will Kestrel M14 motors arrive?' });
assert.ok(result.items.length > 0); assert.equal(result.items[0].sourceId, doc.sourceId); assert.ok(body.includes(result.items[0].text));
const memory = await call('/api/brain'); assert.ok(memory.graphRag.indexed.some(x => x.id === doc.id));
const after = await call('/api/ops'); assert.equal(after.revision, before.revision); assert.deepEqual(after.impacts, before.impacts);
console.log(JSON.stringify({ status: 'PASS', sdk: result.sdk, verifiedPassages: result.items.length, allocationUnchanged: true, indexedSources: memory.graphRag.indexed.length }));
// Explicit sign-out leaves expiry-based cleanup to the demo registry.
await call('/api/session', { kind: 'logout' });
