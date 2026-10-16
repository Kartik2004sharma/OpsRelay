import { execFileSync } from "node:child_process";
import { FalkorDB } from "falkordb";
import { expect, test } from "@playwright/test";

const databaseUrl = process.env.FALKORDB_TEST_URL || "falkor://127.0.0.1:6379";
const password = "test-only-opsrelay-password-2026";

async function clearTestSessions() {
  const db = await FalkorDB.connect({ url: databaseUrl });
  try {
    const connection = await db.connection;
    const keys = await connection.keys("opsrelay:opsrelay_e2e:*");
    if (keys.length) await connection.del(keys);
  } finally { await db.close(); }
}

test.beforeEach(async () => {
  await clearTestSessions();
  execFileSync(process.execPath, ["scripts/seed.mjs", "--reset"], { env: { ...process.env, FALKORDB_URL: databaseUrl, FALKORDB_GRAPH: "opsrelay_e2e", OPSRELAY_ALLOW_RESET: "1" } });
});
test.afterEach(clearTestSessions);

test("access, request boundaries, concurrent writes, audit actor, and session revocation", async ({ request }) => {
  expect((await request.get("/api/ops")).status()).toBe(401);
  expect((await request.post("/api/ops", { data: { kind: "delay" } })).status()).toBe(401);
  expect((await request.post("/api/session", { data: { password: "wrong" } })).status()).toBe(401);
  expect((await request.post("/api/session", { data: { password }, headers: { origin: "https://other.example" } })).status()).toBe(403);
  expect((await request.post("/api/session", { data: { password }, headers: { origin: "invalid" } })).status()).toBe(403);
  expect((await request.post("/api/session", { data: { password: "x".repeat(5000) } })).status()).toBe(413);
  expect((await request.post("/api/session", { data: { password } })).status()).toBe(200);
  const cookie = (await request.storageState()).cookies.find((item) => item.name === "opsrelay_session")!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Strict");
  const read = await request.get("/api/ops");
  expect(read.headers()["cache-control"]).toBe("no-store");
  expect(read.headers()["x-content-type-options"]).toBe("nosniff");
  const updates = await Promise.all([1, 2].map(() => request.post("/api/ops", { data: { kind: "delay", arrivalDate: "2026-11-05", note: "Concurrent supplier delay verification." } })));
  expect(updates.filter((response) => response.status() === 200)).toHaveLength(1);
  expect(updates.every((response) => [200, 400, 409].includes(response.status()))).toBe(true);
  const state = await (await request.get("/api/ops")).json();
  expect(state.events).toHaveLength(1);
  expect(state.actions).toHaveLength(2);
  expect(state.revision).toBe(1);
  const reviewed = await request.post("/api/ops", { data: { kind: "review", id: state.actions[0].id, decision: "approved", reviewer: "Forged reviewer" } });
  const result = await reviewed.json();
  expect(result.actions.find((action: { status: string }) => action.status === "approved").reviewer).toBe("Operations lead");
  expect((await request.post("/api/session", { data: { kind: "logout" } })).status()).toBe(200);
  expect((await request.get("/api/ops", { headers: { cookie: `opsrelay_session=${cookie.value}` } })).status()).toBe(401);
  let throttled = false;
  for (let attempt = 0; attempt < 31; attempt++) {
    const response = await request.post("/api/session", { data: { password: "wrong" } });
    if (response.status() === 429) { throttled = true; break; }
    expect(response.status()).toBe(401);
  }
  expect(throttled).toBe(true);
});
