# Verification record — 16 October 2026

## Redesigned release: local evidence

| Check | Observed result |
| --- | --- |
| Fresh Next.js production build and TypeScript | Passed |
| ESLint | Passed |
| Allocation tests | 2 passed |
| Final Playwright run without snapshot updates | 18 passed in 41.3 seconds |
| Viewports | 1280×720 desktop, 768×1024 tablet, 375×812 mobile |
| Visual comparisons | Six macOS baseline/disruption comparisons passed |
| Axe scans | No serious or critical violations in the tested source dialog and recovered operator dashboard |
| Workflow runtime/console errors | None during the tested operator workflow |
| Combined Docker image | Built successfully |
| 512 MB Docker smoke check | Public demo → delay [2,3,0] → Demo reviewer approval → recovery passed |
| Production dependency audit | 0 reported vulnerabilities |
| Full development audit | Five high entries in the ESLint glob dependency chain remain |
| Demo recording | Updated H.264, 1280×720, 31.00 seconds, 807,922 bytes |

## Functional coverage

Password-free demo entry; separate visitor graphs and protected operator graph; incorrect password; network failure and retry; mobile/tablet navigation; source dialog Escape and focus restoration; page overflow; expired session; expired demo graph cleanup; preservation of the operator graph during cleanup; 40-demo capacity bound; multi-hop evidence; missing owner; superseded planning source; valid/invalid dates; repeated delays; partial recovery; current-proposal replacement; approvals and rejections retained; repeated-review rejection; anonymous API denial; origin/body boundaries; concurrent updates; server-assigned reviewer; logout revocation and rate limiting.

Test graph resets target only `opsrelay_e2e`. Temporary demo graphs are collected by test cleanup. Synthetic seed assertions check 25 nodes and requirements [4,3,1]. Tests do not reset the live operator graph.

## Repair evidence

See [the bounded repair record](REPAIR_LOOP.md). The first inspection exposed low-contrast coverage numbers and a locator matching Next.js's hidden announcer. Correction and confirmation runs followed. Event timestamps are hidden only during visual comparisons; runtime timestamps remain visible. All final macOS baseline comparisons passed without updating snapshots.

The fresh visual reviewer requested removal of an entry eyebrow and scored that correction resolved after the same three entry views were recaptured. The documentation helper could not finish; actual code tokens and component patterns were documented and parsed locally in DESIGN.md and .impeccable/design.json.

## Release state

The previous operator-only release at https://opsrelay.onrender.com was deployed and verified. The redesigned release must be verified there after its new commit deploys. CI and public checks for the redesigned commit are recorded below after completion.

## Practical limits

The user authorized free Render in My Workspace. Real FalkorDB runs on container loopback. Free-host sleep/restart loses in-container graphs and sessions. Demo sessions expire after one hour and graph cleanup is lazy on the next creation. The platform's custom HTTP health-check path is not configured; independently fetch `/api/health` before announcing readiness.

No load test, backup restore exercise, high availability, independent penetration test, SSO or real ERP integration has been completed. Analysis is labelled deterministic and no customer message is sent. This is a secured synthetic-data pilot, not an industry certification.

The active checkout is `/Users/kartik/Developer/OpsRelay`, moved outside the iCloud-synced Documents area after dependency files were offloaded and builds stalled. The earlier checkout is retained.
