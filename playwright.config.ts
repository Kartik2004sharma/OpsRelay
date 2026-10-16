import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  expect: { toHaveScreenshot: { stylePath: "tests/browser/screenshot.css" } },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-GB",
    timezoneId: "UTC",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: "node scripts/seed.mjs --reset && npm run start -- -p 3101",
    env: { OPSRELAY_ALLOW_RESET: "1", FALKORDB_GRAPH: "opsrelay_e2e", FALKORDB_URL: process.env.FALKORDB_TEST_URL || "falkor://127.0.0.1:6379", OPSRELAY_OPERATOR_PASSWORD: "test-only-opsrelay-password-2026", OPSRELAY_OPERATOR_NAME: "Operations lead" },
    url: "http://127.0.0.1:3101/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
