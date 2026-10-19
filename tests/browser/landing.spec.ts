import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public website explains the product, previews allocation, and launches the real workspace", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A supplier slips.");
  await expect(page.locator("header")).toHaveCSS("position", "sticky");
  const preview = page.locator("#product");
  await expect(preview.getByRole("status")).toContainText("5 motors short across 2 orders");
  await preview.getByRole("button", { name: "Original plan", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("All 3 customer commitments covered");
  await preview.getByRole("button", { name: "Supplier delay", exact: true }).click();
  await preview.getByRole("button", { name: "Preview SO-1042, 3 motors short", exact: true }).click();
  await expect(preview).toContainText("Sam Rivera");
  await expect(preview).toContainText("0 of 3 motors covered");
  await preview.getByRole("button", { name: "Recovery", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("All 3 customer commitments covered");
  await page.getByRole("button", { name: "Remember what the team learned.", exact: true }).click();
  await expect(page.getByText("Available in the next session", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Turn context into a reviewed response.", exact: true }).click();
  await expect(page.getByText("Review → approve → download", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Keep the source with the story.", exact: true }).click();
  await page.getByText("Can I try it without creating an account?", { exact: true }).click();
  await expect(page.getByText(/No email or password is needed/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === "mobile") {
    await page.getByLabel("Open navigation", { exact: true }).click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "FAQ", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).not.toBeVisible();
  }
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || "")).flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target}: ${node.failureSummary}`))).toEqual([]);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: `.impeccable/review/landing-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Explore live demo", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByText("Your private demo", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Supply overview", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Record supplier delay", exact: true }).click();
  await expect(page.getByText("DISRUPTION ACTIVE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "End demo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Explore live demo", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("demo entry recovers from an error and public routes work", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/session", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "The demo is waking up. Please try again." }) }));
  await page.getByRole("button", { name: "Explore live demo", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Please try again");
  await expect(page.getByRole("button", { name: "Explore live demo", exact: true })).toBeEnabled();
  await page.unroute("**/api/session");
  await page.goto("/trust");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Clarity includes");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found.", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to OpsRelay", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A supplier slips.");
});
