import { execFileSync, spawn } from "node:child_process";
import { mkdir, rename } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { loadEnvFile } from "node:process";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
if (!process.env.OPSRELAY_OPERATOR_PASSWORD) throw new Error("Configure the private operator password before recording.");

const env = { ...process.env, FALKORDB_GRAPH: "opsrelay_demo", OPSRELAY_ALLOW_RESET: "1" };
execFileSync(process.execPath, ["scripts/seed.mjs", "--reset"], { env, stdio: "inherit" });
const server = spawn("npm", ["run", "start", "--", "-p", "3102"], { env, stdio: "ignore" });
let browser;

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch("http://127.0.0.1:3102/api/health")).ok) break;
    } catch { /* server starting */ }
    if (attempt === 59) throw new Error("Demo server did not start.");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await mkdir("demo", { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: "demo", size: { width: 1280, height: 720 } }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const pause = () => page.waitForTimeout(3000);
  await page.goto("http://127.0.0.1:3102");
  await page.getByRole("button", { name: "Operator sign in", exact: true }).click();
  await page.getByLabel("Operator password").fill(process.env.OPSRELAY_OPERATOR_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByText("All commitments covered").waitFor();
  await pause();
  await page.getByRole("button", { name: /Old supply planning note/i }).click();
  await pause();
  await page.getByRole("button", { name: "Close source record" }).click();
  await page.getByRole("button", { name: "Record supplier delay" }).click();
  await page.getByText("DISRUPTION ACTIVE").waitFor();
  await pause();
  await page.getByRole("button", { name: /SO-1042 Vale Foods/i }).click();
  await page.locator("#evidence").scrollIntoViewIfNeeded();
  await pause();
  await page.getByRole("button", { name: "SRC-BOM-B" }).first().click();
  await pause();
  await page.getByRole("button", { name: "Close source record" }).click();
  await page.getByRole("button", { name: "Ask OpsRelay" }).click();
  await page.getByText("DETERMINISTIC GRAPH ANALYSIS").waitFor();
  await page.locator(".ask").scrollIntoViewIfNeeded();
  await pause();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await page.getByText("approved by Operations lead").waitFor();
  await page.locator("#actions").scrollIntoViewIfNeeded();
  await pause();
  await page.reload();
  await page.getByText("approved by Operations lead").waitFor();
  await page.getByRole("button", { name: "Record recovery" }).click();
  await page.getByLabel("Source note").fill("Kestrel confirmed the original shipment date has been restored.");
  await page.locator(".update form button.primary").click();
  await page.getByText("ON SCHEDULE").waitFor();
  await page.locator(".network").scrollIntoViewIfNeeded();
  await pause();
  await page.locator(".timeline").scrollIntoViewIfNeeded();
  await pause();
  const video = page.video();
  await context.close();
  if (!video) throw new Error("Playwright did not record a video.");
  await rename(await video.path(), "demo/opsrelay-demo.webm");
  console.log("Recorded demo/opsrelay-demo.webm");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
