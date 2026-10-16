# Verification record — 16 October 2026

## Observed results

| Check | Result |
| --- | --- |
| Fresh Next.js production build and TypeScript compilation | Passed |
| ESLint | Passed |
| Allocation tests | 2 passed |
| Playwright production-server workflow and security checks | 6 passed in 16.5 seconds |
| Viewports | 1280×720 desktop, 768×1024 tablet, 375×812 mobile |
| Axe scan | No serious or critical violations in the open source dialog or recovered dashboard |
| Browser runtime and console errors | None during the tested workflow |
| Database unavailable | HTTP 503 with a useful error when connecting to an unused local port |
| Single-container smoke check | Baseline → delay shortages [2,3,0] → approval → recovery passed under a 512 MB container limit |
| Production dependency audit | 0 reported vulnerabilities |

The browser workflow inspects the superseded planning note, closes the native dialog with Escape, checks the missing-owner warning, records a delay, inspects the current source and product evidence, asks a graph question, approves a task, reloads to verify persistence, and records recovery. It checks that open tasks close after recovery. It also checks unsupported-question handling, invalid-date rejection, horizontal overflow, and baseline/disruption screenshots. Live timestamps are hidden only during screenshot comparisons.

The seed asserts 25 baseline nodes and motor requirements of 4, 3, and 1. A normal seed invocation leaves an existing nonempty graph unchanged. Browser resets target only the disposable `opsrelay_e2e` graph.

Security checks verify anonymous denial, invalid login, cross-origin and malformed-origin rejection, oversized-body rejection, cookie flags, cache/security headers, competing supply updates, server-assigned reviewer identity, logout revocation, and login throttling. These run for all three viewport projects.

## Repair notes

- FalkorDB remains external to Next.js bundling to avoid a runtime JSBI failure.
- The recovery test targets the form submit button rather than the mode selector.
- Low-contrast labels and source-dialog metadata were darkened and checked with Axe.
- Random source IDs have readable button labels; the full IDs remain in source details.
- Screenshot-only CSS hides changing timestamps. A fresh production build was used for the final run after an incremental CSS cache retained old colors.
- The single-container entrypoint explicitly starts OpsRelay, avoiding the base image's browser process on the app's HTTP port.

## Remaining limits

The full development dependency audit reports five high-severity entries in the ESLint → fast-glob → micromatch → braces chain. npm's proposed force fix downgrades eslint-config-next across major versions, so it was not applied. Production dependencies report zero vulnerabilities.

The user approved free Render in My Workspace. Service `srv-db8tr7ff3r2c73fdbbg0` deployed application commit `0ac3917d4c9dc98f5887b0b4b31686f039b09dc9` at https://opsrelay.onrender.com. Real FalkorDB runs inside the app container, bound to loopback. No paid service or FalkorDB Cloud instance was provisioned. Railway was not used because its trial had expired. The updated secured Docker image passed readiness, anonymous denial, sign-in, delay shortages [2,3,0], server-assigned reviewer, and recovery under a 512 MB limit on local Mac/ARM64. Render deployed the same application commit on its remote Docker runtime.

Answers currently use labelled deterministic graph analysis. No LLM API integration, real ERP data, external customer messaging, or hackathon submission has been performed.

## Live verification

On 16 October 2026, automated Playwright checks against the public HTTPS deployment confirmed health HTTP 200, anonymous graph access HTTP 401, UI sign-in, Secure/HttpOnly/SameSite Strict cookies, delay shortages [2,3,0], approval surviving reload, recovery to covered commitments, and sign-out revocation. No page runtime errors were observed. The checked graph was left recovered, with its synthetic verification history retained.

GitHub Actions run https://github.com/Kartik2004sharma/OpsRelay/actions/runs/38872696151 passed on Ubuntu with Node 22 and real FalkorDB: allocation tests, lint, production audit, production build, and six browser tests. Linux does not compare the macOS visual baselines.

The public health endpoint was independently fetched and returned `{"status":"ready"}`. Render's custom HTTP health-check path is not configured; platform readiness alone should not be treated as graph readiness. Always check `/api/health` when verifying a release.

Free Render sleeps after idle periods and loses the in-container graph and sessions on restart. No backups, restore exercise, high availability, load test, independent penetration test, SSO, or tenant isolation has been verified. This is a secured hackathon pilot, not an industry certification. See https://render.com/docs/free.

The documentation-only publication commit uses Render's documented `[skip render]` marker to retain the already verified application deployment: https://render.com/docs/deploys#skipping-an-auto-deploy.
