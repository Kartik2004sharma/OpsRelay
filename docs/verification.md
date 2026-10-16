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

No hosted FalkorDB connection or live application deployment has been verified. Railway rejected new project creation because its trial had expired. The user chose to wait for FalkorDB Cloud setup; no Render service or paid hosting plan was created. The updated secured Docker image passed readiness, anonymous denial, sign-in, delay shortages [2,3,0], server-assigned reviewer, and recovery under a 512 MB limit on local Mac/ARM64. Remote AMD64 hosting remains unchecked until deployment completes.

Answers currently use labelled deterministic graph analysis. No LLM API integration, real ERP data, external customer messaging, or hackathon submission has been performed.
