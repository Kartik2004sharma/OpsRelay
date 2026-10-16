import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test.beforeEach(() => {
  execFileSync(process.execPath, ["scripts/seed.mjs", "--reset"], { env: { ...process.env, FALKORDB_URL: process.env.FALKORDB_TEST_URL || "falkor://127.0.0.1:6379", FALKORDB_GRAPH: "opsrelay_e2e", OPSRELAY_ALLOW_RESET: "1" } });
});
test("repeat delays and partial recovery replace stale proposals without erasing decisions", async ({ request }) => {
  expect((await request.post("/api/session", { data: { password: "test-only-opsrelay-password-2026" } })).status()).toBe(200);
  const update = async (kind: string, arrivalDate: string) => {
    const response = await request.post("/api/ops", { data: { kind, arrivalDate, note: "Verified source for lifecycle regression check." } });
    expect(response.status()).toBe(200);
    return response.json();
  };
  await update("delay", "2026-11-05");
  let state = await update("delay", "2026-11-10");
  expect(state.actions.filter((a: { status: string }) => a.status === "proposed")).toHaveLength(2);
  expect(state.actions.filter((a: { status: string }) => a.status === "superseded")).toHaveLength(2);
  state = await update("recovery", "2026-10-26");
  expect(state.impactedCount).toBe(1);
  const pending = state.actions.filter((a: { status: string }) => a.status === "proposed");
  expect(pending).toHaveLength(1);
  expect(pending[0].orderId).toBe("SO-1041");
  const review = { kind: "review", id: pending[0].id, decision: "rejected" };
  expect((await request.post("/api/ops", { data: review })).status()).toBe(200);
  expect((await request.post("/api/ops", { data: review })).status()).toBe(400);
  state = await update("recovery", "2026-10-20");
  expect(state.impactedCount).toBe(0);
  expect(state.actions.filter((a: { status: string }) => a.status === "proposed")).toHaveLength(0);
  expect(state.actions.filter((a: { status: string }) => a.status === "rejected")).toHaveLength(1);
  expect(state.events).toHaveLength(4);
  expect(state.sources.filter((s: { kind: string; status: string }) => ["delay", "recovery", "purchase order"].includes(s.kind) && s.status === "current")).toHaveLength(1);
});
