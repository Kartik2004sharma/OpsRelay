# OpsRelay: Cloud, GraphRAG and colour implementation plan

Date: 2026-10-19. This extends the post-hackathon branch; the submitted release is preserved.

## Goals and boundaries
- Connect a real FalkorDB Cloud instance, only within the existing free-services budget.
- Use the actual pinned GraphRAG SDK for document ingestion, extraction and retrieval, with Gemini cloud generation/embeddings. No Ollama, local inference or paid fallback.
- Preserve deterministic allocation, source provenance, workspace isolation and human approval.
- Refine the existing professional website with deep teal, pale mint, ivory and amber risk states; preserve accessible contrast and mobile layouts.

## Architecture
Next.js authenticates every operation and resolves the workspace server-side. A bounded Python subprocess invokes GraphRAG SDK 1.4.0 using private environment variables and JSON stdin/stdout; it has no public port. Its companion graph is derived from the authenticated operational graph, never supplied by browser input. The SDK owns extracted entities, relationships, chunk vectors and ontology in that companion graph. Operational supply facts remain in the original graph. Only applied, reviewed notices can be indexed. Retrieval results must trace to an original, reviewed SourceRecord and current indexed document; extracted text is untrusted evidence, never authorization.

Use the SDK cloud LLM extractor explicitly, avoiding its default local GLiNER extractor. Install its core runtime dependencies without local ML packages, document this exception and pin the tested dependency set. Bound provider calls, output size, total duration and concurrent jobs. A failed job remains retryable and cannot silently claim indexing success. Global and workspace quotas protect the free API allowance. Demo graph companions receive matching expiry.

## Delivery sequence
1. Inspect Cloud account and free plan. Require verified TLS for any remote database. Never silently upgrade or disable certificate validation. Sign-in and free instance creation are complete; the instance is healthy but its generated connection disables TLS. Cloud listing advertises TLS only on paid plans; verify actual instance options before migration.
2. Add SDK worker, cloud providers, server adapter, authenticated index/search operations, provenance records and clear UI status.
3. Add explicit index action on reviewed documents and a document search view showing original sources. Make SDK retrieval available to the investigation agent without removing deterministic tools.
4. Add remote connection validation and operator-only Cloud readiness check. Preserve local data and backup before any migration. Seed a new empty cloud graph idempotently; verify actual read/write before switching environments. Keep secrets out of files committed to Git.
5. Apply semantic colour tokens across public pages and workspace: teal actions, mint context, amber risk, legible neutral copy. Preserve explicit status labels.
6. Verify TypeScript, lint, unit tests, isolated SDK tests, actual Gemini+FalkorDB ingestion/retrieval, authenticated API isolation, responsive Playwright workflows and accessibility. Inspect changed visual baselines before accepting them. Repair at most three times per failing check, then report unresolved failures.
7. Update README, environment/setup instructions, verification evidence, design ledger and draft PR. State precisely what is local, cloud-connected, pushed or publicly deployed.

## Acceptance checks
- [x] Actual SDK ingest and retrieval succeed against real FalkorDB with cloud providers.
- [x] Search only returns indexed reviewed sources in the authenticated workspace.
- [ ] Malformed requests, timeouts, free quota exhaustion and stale/rejected notices fail safely.
- [x] Companion graphs remain isolated; demo cleanup includes SDK ontology graph.
- [x] Remote TLS is enforced in both Node and Python; no credentials in browser responses/logs.
- [x] A real free Cloud endpoint is connected and read/write verified, or the concrete account/plan blocker is documented. (Instance healthy; supplied endpoint has TLS disabled. No connection switch.)
- [x] Desktop, tablet and phone workflows pass and palette contrast is checked.
- [x] Original allocation and review tests pass.

## Rollback
Keep the original operational graph and local snapshot. Disable GRAPHRAG_ENABLED to remove SDK actions without affecting deterministic workflows. Restore prior private connection settings to return to the original database. Never delete the original database as part of migration. Do not merge or claim a new hosted release until its real dependencies pass readiness checks.

## Current implementation status

SDK ingestion/retrieval and reviewed-source UI are implemented and verified locally with Gemini. All 33 existing/initial browser cases passed; the expanded six-case SDK UI suite also passed. Teal/mint/ivory refinement is approved. A free AWS Mumbai Cloud instance was created by the user; its initial endpoint did not resolve. The portal now confirms Running / Healthy and generates a connection with `tls=false`. Secure connectivity and cloud migration are blocked by the current free instance’s plaintext connection. No paid plan or weaker security was enabled.
