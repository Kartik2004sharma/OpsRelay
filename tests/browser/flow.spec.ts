import { execFileSync } from "node:child_process";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(() => {
  execFileSync(process.execPath, ["scripts/seed.mjs", "--reset"], {
    env: { ...process.env, FALKORDB_URL: process.env.FALKORDB_TEST_URL || "falkor://127.0.0.1:6379", FALKORDB_GRAPH: "opsrelay_e2e", OPSRELAY_ALLOW_RESET: "1" },
  });
});

test("supplier delay to reviewed action and recovery stays graph-backed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("401 (Unauthorized)")) errors.push(message.text()); });

  await page.goto("/");
  await page.getByRole("button", { name: "Operator sign in", exact: true }).click();
  await page.getByLabel("Operator password").fill("test-only-opsrelay-password-2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Supply overview" })).toBeVisible();
  await expect(page.getByText("All commitments covered")).toBeVisible();
  await expect(page.getByRole("button", { name: /SO-1041 Hightower Distribution/i })).toBeVisible();
  await page.getByRole("button", { name: /Old supply planning note/i }).click();
  await expect(page.getByRole("dialog")).toContainText("superseded");
  await expect(page.getByRole("dialog")).toContainText("18 October");
  const sourceScan = await new AxeBuilder({ page }).analyze();
  expect(sourceScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || "")).flatMap((violation) => violation.nodes.map((node) => `${node.target}: ${node.failureSummary}`))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /SO-1043 Cedar Logistics/i }).click();
  await expect(page.getByText(/Ownership gap: no responsible person/)).toBeVisible();
  await page.getByRole("button", { name: /SO-1041 Hightower Distribution/i }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // shortcut: visual baselines are macOS-only; Linux CI checks behavior and accessibility.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  if (process.platform === "darwin") await expect(page).toHaveScreenshot("baseline.png", { fullPage: true });
  const unsupported = await page.request.post("/api/ops", { data: { kind: "ask", question: "What should we eat for lunch?" } });
  expect((await unsupported.json()).answer).toContain("I can trace supplier delays");
  const invalidDate = await page.request.post("/api/ops", { data: { kind: "delay", arrivalDate: "2026-02-30", note: "Invalid date must not change the graph." } });
  expect(invalidDate.status()).toBe(400);

  await page.getByRole("button", { name: "Record supplier delay" }).click();
  await expect(page.getByText("DISRUPTION ACTIVE")).toBeVisible();
  await expect(page.getByRole("button", { name: /SO-1041 Hightower Distribution/i })).toContainText("2 short");
  await expect(page.getByRole("button", { name: /SO-1042 Vale Foods/i })).toContainText("3 short");
  await expect(page.getByRole("button", { name: /SO-1043 Cedar Logistics/i })).toContainText("Covered");
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.getByRole("dialog")).toContainText("Supplier delay notice");
  await expect(page.getByRole("dialog")).toContainText("current");
  await page.getByRole("button", { name: "Close source record" }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  if (process.platform === "darwin") await expect(page).toHaveScreenshot("disruption.png", { fullPage: true });

  await page.getByRole("button", { name: /SO-1042 Vale Foods/i }).click();
  await expect(page.getByRole("heading", { name: "Why SO-1042 is at risk" })).toBeVisible();
  await expect(page.locator("#evidence")).toContainText("Kestrel Components");
  await expect(page.locator("#evidence")).toContainText("Vale Foods");
  await page.getByRole("button", { name: "SRC-BOM-B" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Each Boreal Sorter requires one M14 motor.");
  await page.getByRole("button", { name: "Close source record" }).click();

  await page.getByRole("button", { name: "Ask OpsRelay" }).click();
  await expect(page.getByText("DETERMINISTIC GRAPH ANALYSIS")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("SO-1041");
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByText("approved by Operations lead")).toBeVisible();
  await page.reload();
  await expect(page.getByText("approved by Operations lead")).toBeVisible();

  await page.getByRole("button", { name: "Record recovery" }).click();
  await page.getByLabel("Source note").fill("Kestrel confirmed the original shipment date has been restored.");
  await page.locator(".update form button.primary").click();
  await expect(page.getByText("ON SCHEDULE")).toBeVisible();
  await expect(page.getByRole("button", { name: /SO-1041 Hightower Distribution/i })).toContainText("Covered");
  await expect(page.getByText("Recovery confirmed")).toBeVisible();
  await expect(page.getByText("Closed after supply update")).toBeVisible();
  await expect(page.getByText("0 open review tasks", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.getByRole("dialog")).toContainText("Recovery confirmation");
  await page.getByRole("button", { name: "Close source record" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || "")).flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(", ")}: ${node.any.map((check) => check.message).join("; ")}`))).toEqual([]);
  expect(errors).toEqual([]);
});
