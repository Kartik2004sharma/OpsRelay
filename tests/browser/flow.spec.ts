import { execFileSync } from "node:child_process";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(() => {
  execFileSync(process.execPath, ["scripts/seed.mjs", "--reset"], {
    env: { ...process.env, FALKORDB_GRAPH: "opsrelay_e2e", OPSRELAY_ALLOW_RESET: "1" },
  });
});

test("supplier delay to reviewed action and recovery stays graph-backed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Know what a delay/i })).toBeVisible();
  await expect(page.getByText("All commitments covered")).toBeVisible();
  await expect(page.getByRole("button", { name: /SO-1041 Hightower Distribution/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page).toHaveScreenshot("baseline.png", { fullPage: true });

  await page.getByRole("button", { name: "Record supplier delay" }).click();
  await expect(page.getByText("DISRUPTION ACTIVE")).toBeVisible();
  await expect(page.getByRole("button", { name: /SO-1041 Hightower Distribution/i })).toContainText("2 short");
  await expect(page.getByRole("button", { name: /SO-1042 Vale Foods/i })).toContainText("3 short");
  await expect(page.getByRole("button", { name: /SO-1043 Cedar Logistics/i })).toContainText("Covered");
  await expect(page).toHaveScreenshot("disruption.png", { fullPage: true });

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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || "")).flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(", ")}: ${node.any.map((check) => check.message).join("; ")}`))).toEqual([]);
  expect(errors).toEqual([]);
});
