# Extension verification — 19 October 2026

## Local results

| Check | Exact observed result |
| --- | --- |
| Production Next.js build / TypeScript | Passed |
| ESLint | Passed |
| Unit tests | 12 passed: allocation, calendar validation, citation handles, loop/byte/tool budgets, bounded conclusion correction |
| Final full Playwright run | 24 passed in 33.5 seconds; desktop, tablet and mobile |
| Existing visual/accessibility checks | Passed in the full run after inspecting and updating the six intentionally extended dashboard baselines |
| Production dependency audit | 0 vulnerabilities reported |
| Real Gemini baseline investigation | HTTP 200 in 5,093 ms, valid source references and persisted investigation |
| Real cloud/browser adversarial-notice check | Passed in 5,009 ms using `gemini-3.5-flash-lite`; searched the pending notice, read commitments, returned 10 observed citations, saved memory after reload, left supply revision/date unchanged |
| API key publication scan | No current key in the Git publication file set; private `.env.local` mode 0600 |
| Durable local database | AOF `yes`, save `60 1`, actual directory `/var/lib/falkordb/data` on a named volume |
| Restart exercise | Existing operator graph retained all 25 nodes after restarting the new persistent container; a dedicated durability marker also survived |
| Independent RDB restore | Fresh isolated container on port 6381 loaded a snapshot with the same 25-node operator graph and durability marker |

Evidence screenshots and the cloud result are local in `.impeccable/review/`. Private backups are under `.private-backups/`; both are excluded from Git and Docker builds. The original database on port 6379 was preserved; the app's private local configuration now points to port 6380. The restore-check container is stopped after verification.

## Repair record

1. First lint run included generated video vendor assets and found an effect subscription issue. Excluded generated output from lint/Git and used an abortable fetch subscription; lint passed.
2. The first full browser run passed 21/24; three visual comparisons correctly detected the new workspace. Inspected the desktop and mobile full-page views, refreshed six expected images, then reran without snapshot updates. All 24 passed. Existing assertions remain.
3. Gemini 2.5 model call returned 404 despite being listed. Gemini 3.8 basic/tool probes worked, but the full investigation timed out. Switched explicitly to the verified free-tier Flash-Lite model; no paid fallback or local model was introduced.
4. The optional cloud browser script initially raced session creation, then used an overly exact label locator. Waited for the demo state and used the textbox's accessible name. These were harness corrections, not application authorization bypasses.
5. A real pending-notice investigation produced unsupported citations. The app returned 502 rather than persisting an unsupported answer. One bounded conclusion correction alone did not resolve it. Introduced server-resolved short evidence handles to avoid reproducing long content hashes; retained strict observed-citation checks and unit-tested unknown handle rejection. The cloud/browser adversarial case then passed in 5,009 ms.
6. Found the old local container mounted `/data` while Redis wrote `/var/lib/falkordb/data`. Saved a private backup and migrated the operator graph into a separate correctly mounted instance. AOF startup ignored an initial standalone RDB import; restored the graph using binary-safe Redis DUMP/RESTORE without replacing the original. Verified node counts before and after restart and then tested a fresh RDB restore with AOF initially disabled.

## Interpretation

These are local and real-provider checks, not claims of enterprise certification, exhaustive prompt-injection resistance, arbitrary document extraction, or general factual correctness. The cloud smoke runs against a real free API and is opt-in, separate from CI. The original hackathon video and submission predate this extension.

Publication/deployment state must be checked separately. These results alone do not establish that the public Render service runs the extension or has its Gemini key configured. Free Render remains ephemeral; verified local persistence does not make public hosting durable.
