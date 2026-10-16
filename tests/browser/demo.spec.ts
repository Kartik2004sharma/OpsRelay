import { execFileSync } from "node:child_process";
import { FalkorDB } from "falkordb";
import { expect, test } from "@playwright/test";

const databaseUrl = process.env.FALKORDB_TEST_URL || "falkor://127.0.0.1:6379";
test.beforeEach(() => {
  execFileSync(process.execPath, ["scripts/seed.mjs", "--reset"], { env: { ...process.env, FALKORDB_URL: databaseUrl, FALKORDB_GRAPH: "opsrelay_e2e", OPSRELAY_ALLOW_RESET: "1" } });
});
test.afterEach(async () => {
  const db = await FalkorDB.connect({ url: databaseUrl });
  try {
    for (const name of await db.list()) if (/^opsrelay_e2e_demo_[a-f0-9]{24}$/.test(name)) await db.selectGraph(name).delete();
    const connection = await db.connection;
    await connection.del("opsrelay:opsrelay_e2e:demos");
  } finally { await db.close(); }
});

test("demo opens without a password and two visitors have isolated graph workflows", async ({ page, browser, request }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore live demo", exact: true }).click();
  await expect(page.getByText("Your private demo")).toBeVisible();
  await expect(page.getByText("All commitments covered")).toBeVisible();
  await page.screenshot({ path: `.impeccable/review/${testInfo.project.name}.png`, fullPage: true });
  const second = await browser.newContext();
  try {
    const other = await second.request.post("http://127.0.0.1:3101/api/session", { data: { kind: "demo" } });
    expect(other.status()).toBe(200);
    await page.getByRole("button", { name: "Record supplier delay", exact: true }).click();
    await expect(page.getByText("DISRUPTION ACTIVE")).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `.impeccable/review/${testInfo.project.name}-disruption.png`, fullPage: true });
    const untouched = await (await second.request.get("http://127.0.0.1:3101/api/ops")).json();
    expect(untouched.impactedCount).toBe(0);
    expect(untouched.events).toHaveLength(0);
    const first = await (await page.request.get("/api/ops")).json();
    expect(first.impacts.map((order: { shortage: number }) => order.shortage)).toEqual([2, 3, 0]);
    await request.post("/api/session", { data: { password: "test-only-opsrelay-password-2026" } });
    const operator = await (await request.get("/api/ops")).json();
    expect(operator.impactedCount).toBe(0);
    expect(operator.events).toHaveLength(0);
    await page.getByRole("button", { name: "Approve", exact: true }).first().click();
    await expect(page.getByText("approved by Demo reviewer")).toBeVisible();
    await page.reload();
    await expect(page.getByText("approved by Demo reviewer")).toBeVisible();
    await page.getByRole("button", { name: "Record recovery", exact: true }).click();
    await page.locator(".update form button.primary").click();
    await expect(page.getByText("ON SCHEDULE")).toBeVisible();
    await page.getByRole("button", { name: "End demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Explore live demo", exact: true })).toBeVisible();
    expect((await page.request.get("/api/ops")).status()).toBe(401);
  } finally { await second.close(); }
});

test("entry errors, retry, navigation, keyboard source dialog, and expired session recover", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Explore live demo", exact: true })).toBeVisible();
  await page.screenshot({ path: `.impeccable/review/${testInfo.project.name}-entry.png`, fullPage: true });
  await page.getByRole("button", { name: "Operator sign in", exact: true }).click();
  await page.getByLabel("Operator password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toContainText("password is incorrect");
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page.route("**/api/session", (route) => route.abort());
  await page.getByRole("button", { name: "Explore live demo", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore live demo", exact: true })).toBeEnabled();
  await page.unroute("**/api/session");
  await page.getByRole("button", { name: "Explore live demo", exact: true }).click();
  await expect(page.getByText("Your private demo")).toBeVisible();
  for (const label of ["Commitments", "Evidence & sources", "Review queue", "Activity", "Overview"]) {
    const link = page.getByRole("navigation", { name: "Workspace sections" }).getByRole("link", { name: label, exact: true });
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "location");
  }
  await page.getByRole("button", { name: /Old supply planning note/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Old supply planning note/ })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.route("**/api/ops", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Graph unavailable during verification. Please retry." }) }));
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toContainText("Please retry");
  await expect(page.locator(".notice")).not.toContainText("Workspace refreshed");
  await page.unroute("**/api/ops");
  await page.getByRole("button", { name: "Refresh workspace", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toHaveCount(0);
  await page.route("**/api/ops", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Session expired" }) }));
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("button", { name: "Explore live demo", exact: true })).toBeVisible();
});

test("expired demo cleanup preserves the operator graph and capacity is bounded", async ({ request }) => {
  const db = await FalkorDB.connect({ url: databaseUrl });
  try {
    const expired = "opsrelay_e2e_demo_ffffffffffffffffffffffff";
    await db.selectGraph(expired).query("CREATE (:Disposable {id:'expiry-check'})");
    const connection = await db.connection;
    const registry = "opsrelay:opsrelay_e2e:demos";
    await connection.zAdd(registry, [{ score: 0, value: expired }, { score: 0, value: "opsrelay_e2e" }]);
    expect((await request.post("/api/session", { data: { kind: "demo" } })).status()).toBe(200);
    expect(await db.list()).not.toContain(expired);
    const baseline = await db.selectGraph("opsrelay_e2e").roQuery<{ count: number }>("MATCH (n) RETURN count(n) AS count");
    expect(baseline.data?.[0].count).toBe(25);
    await connection.zAdd(registry, Array.from({ length: 40 }, (_, index) => ({ score: Date.now() + 3600000, value: `opsrelay_e2e_demo_${index.toString(16).padStart(24, "0")}` })));
    expect((await request.post("/api/session", { data: { kind: "demo" } })).status()).toBe(429);
  } finally { await db.close(); }
});
