# Cloud SDK and colour verification — 19 October 2026

## Executed evidence

- Isolated Python 3.13 environment imports GraphRAG SDK **1.4.0** without Torch/GLiNER.
- Six Python unit tests passed: remote TLS requirement, certificate/hostname verification, percent-decoded credentials, loopback allowance, cloud-only imports, provider budget and invalid graph scope.
- Twelve existing Node unit tests passed: allocation, notice validation, agent bounds and citation integrity.
- Real Gemini extraction + embeddings against local durable FalkorDB: **7 entities, 13 relationships**, 17 provider calls for one small synthetic notice. SDK semantic retrieval returned its original passage and seven linked entities in two provider calls.
- Authenticated end-to-end API smoke passed: fresh isolated demo → import → human review/apply → SDK index → semantic search → exact original source → unchanged supply revision/allocation. One verified passage and one indexed source. No operator data was changed.
- Demo knowledge and ontology graph TTLs were read from real Redis: both matched the remaining demo lifetime. Direct SDK smoke graphs were also set to expire in an hour.
- Production dependency audit: zero reported vulnerabilities.
- Production Next.js build and lint passed after repairing one interpreter-tracing issue and a TypeScript environment type error. Interpreter/private environment tracing is explicitly disabled; Docker copies worker/runtime separately.
- First 33-case browser run: **30 passed, 3 failed only on intentionally changed visual baselines**. Inspected desktop/mobile public and workspace captures. Updated six intended baseline/disruption screenshots, and all three flow cases passed. Final expanded clean regression: **36/36 passed in 46.5 seconds**, across desktop, tablet and mobile.
- Added three further browser UI cases for successful search, result announcements and opening the real original-source dialog; the six-case GraphRAG suite passed in 8.8 seconds after fixing a test-only session-readiness race. Repeated full-suite runs also exposed shared disposable SDK quota state; the test setup now clears only that test namespace’s SDK budget and explicitly verifies the fourth workspace request is rate limited. HTTP fixtures in those UI cases are explicitly separate from the real SDK/API smoke.
- Public landing accessibility checks passed at desktop/tablet/mobile sizes during the first run. No serious/critical Axe findings.
- Independent visual reviewer approved colour roles and layout. Sampled contrast: white/teal 6.98:1; public muted/paper 5.69:1; mint/dark teal 8.23:1; amber warning 5.45:1; search muted/mint 5.03:1; focus/white 3.30:1. Its result-count screen-reader announcement fix was applied.

## Container repair record

The first Linux image built but its SDK import check found missing `libffi.so.8`. The runtime now installs `libffi8` and explicitly retains `libgomp1`. One rebuild hit the local Docker disk limit; only temporary image/cache artifacts created during this task were removed. Existing images, containers and database volumes were preserved. Corrected Linux ARM64 image `7167ee57faaa` passed all six Python tests and the real end-to-end Gemini/SDK API smoke with a **512 MiB / 0.5 CPU** container limit. Health returned HTTP 200 / ready; one original passage was verified and allocation stayed unchanged. The cgroup recorded **161,550,336 bytes (154.1 MiB)** peak memory for this run. This is a smoke measurement, not a load-capacity claim.

## Explicit limits

This verifies **local** SDK functionality using a real cloud model. It does not establish FalkorDB Cloud connectivity or a new public release. The Cloud account is signed in; the free subscription is selected and the user created a free instance in AWS ap-south-1. The portal confirms Running / Healthy, but its generated connection explicitly has `tls=false`. The initial DNS probe returned ENOTFOUND. No database credentials were transmitted to that endpoint, and no secure Cloud read/write verification is claimed. No paid service was activated.

The Cloud free-plan TLS/persistence limitations still need resolution against the actual instance. Remote plaintext connections remain blocked. Existing Render and local databases remain the active routes.

The cloud-only Python dependency installation deliberately omits the upstream package’s declared but unused GLiNER dependency. See [setup and limitations](GRAPHRAG.md). No Ollama or local model was used.
