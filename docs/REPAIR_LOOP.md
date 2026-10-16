# Bounded repair loop — 16 October 2026

## Reported failure
The user could not sign in or open the dashboard and rejected the old visual design.

## Scope
Entry and authentication; isolated public demo lifecycle; seed reuse; server graph selection; graph-backed updates and current task lifecycle; navigation, responsive composition and source dialog; browser tests, CI, and the deployed release. Operator data and credentials must remain private.

## Defects identified
1. Password-only entry depended on a local secret file, blocking judges and visitors.
2. A fixed suggested date became invalid after a previous delay.
3. Old proposed tasks could remain open after a later update or partial recovery.
4. Mobile navigation hid destinations; selected navigation did not follow clicks.
5. No positive feedback confirmed updates; the huge hero and small labels obscured the operational task.

## Loop contract
Implement the complete repair, then one batched production-server browser inspection across desktop/tablet/mobile. Capture entry, baseline, disruption, error and source states. Check isolation, auth, input boundaries, concurrency, repeat updates, partial recovery, approvals/rejections, source history, session expiry, network failure, refresh and keyboard navigation. Fix the observed defects as one batch and run one confirmation round. A fresh finish review evaluates the screenshots and implementation, with bounded corrections based only on its material findings. No arbitrary passing-percentage claims or unlimited polishing.

## Release gate
Build, TypeScript, lint, unit tests, browser checks, production audit and CI must pass. Compare visual captures intentionally. Deploy the reviewed commit, check public readiness and run the no-password demo workflow on the public HTTPS origin. Record exact results and the free-host restart limit.

## Observed local results

- Initial inspection: 9/15 passed; failures identified low-contrast coverage text and test matching of Next.js's hidden route-announcer alert.
- One correction batch fixed contrast, error scoping, valid viewport-top captures, mobile action access, and rail labels.
- 15/15 passed after correction. A normal snapshot run then found 27 changing pixels in event timestamps; marked timestamps are now hidden only in screenshot comparisons.
- Expanded checks cover expired-demo collection, preservation of the operator graph and the 40-workspace capacity bound.
- Final run without snapshot updates: **18/18 passed in 41.3 seconds**, including all six macOS visual baselines.
- Production build/TypeScript, lint and both allocation tests passed; production dependency audit reported zero vulnerabilities. Five development-chain vulnerabilities remain.
- Fresh visual review requested one correction: removing the entry eyebrow. The reviewer scored it resolved after recapturing desktop, tablet and mobile. That verdict applies to the listed correction; it is not a runtime certification.
- The separate documentation helper was unavailable; the build agent completed and parsed the actual design tokens and six component patterns locally.
- The secured combined app/FalkorDB Docker image built successfully. The same application commit passed Ubuntu CI and public HTTPS workflow/isolation checks at all three viewport sizes; see verification.md.

The active local checkout is `/Users/kartik/Developer/OpsRelay`. The earlier Documents checkout was retained; iCloud had offloaded dependency files there and stalled the build tools. The Developer checkout is outside that synced directory.
