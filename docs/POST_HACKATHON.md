# Company brain extension — 19 October 2026

This work began after Graph Hacks closed. It is an extension of OpsRelay, not a claim about the submitted build. The original submission record remains in `submission.md`.

## Implemented workflow

1. Import a permitted `.txt` or `.md` supplier notice (30–8,000 characters), limited to Kestrel/M14 and 1–8 valid ISO dates. Original text is retained as evidence. Date extraction is deterministic, not AI document understanding.
2. Review a candidate date. Applying it atomically checks the supply revision and pending document status, records the reviewer, and runs the existing allocation and proposal lifecycle. A stale notice cannot change the plan.
3. Run a Gemini investigation. The model selects read-only, parameterized graph tools: `get_supply`, `get_commitments`, `search_sources`, and `get_decisions`. It cannot supply Cypher, mutate facts, or send messages.
4. Save a human lesson linked to a real source. Later investigations can retrieve these notes. Historical lessons remain unverified human context.
5. Prepare an order response using deterministic allocation. Review and approve it before downloading. Stale drafts cannot be approved or downloaded as current responses; they can still be rejected.

Documents, lessons, investigations, citations, tool traces, drafts and reviews are stored in the session-selected FalkorDB graph. Public demo memory remains temporary and separate from the operator graph.

## Agent contract

- Server-only Gemini key; no key in client bundles or the repository. No local Ollama and no paid fallback.
- Verified default: `gemini-3.5-flash-lite`. Google lists free input/output for this model in its [pricing reference](https://ai.google.dev/gemini-api/docs/pricing). Leave billing disabled. Quota availability is not guaranteed.
- Maximum four model turns, eight tool calls, four calls per turn, 48 KB cumulative tool results, 25 seconds per model request, and a 65-second shared model deadline. No network retries. One invalid conclusion may be corrected inside the same four-turn/eight-call budget; a second invalid conclusion fails closed.
- Mandatory commitments tool before saving a conclusion. The model receives short per-run evidence handles (E1, E2, …). Final handles must have been observed in tool results; the server resolves them to full original record IDs. Duplicate calls, malformed arguments, unknown tools and invented citations fail closed.
- Canonical quantities and coverage come from tested allocation code. Citation existence checks do not prove every sentence is correct; the output remains AI analysis for human review.
- Instructions embedded in uploaded text are untrusted data. The agent has no write or messaging tool even if it follows an injected instruction.
- Four investigation requests per workspace per minute and 30 per operator graph namespace per hour across sessions. Provider quota may be lower. Workspace document/lesson/draft/run creation has count limits; simultaneous requests can modestly exceed those advisory count caps.
- Saved investigations carry the supply revision; historical results are labelled when supply changes. A supply revision change during the model run prevents saving the result.

## Resource checklist

| Hackathon resource or focus | Use in OpsRelay |
| --- | --- |
| Real FalkorDB | Primary operational database, not decorative graph rendering. |
| Cypher | Parameterized dependency traversal, current evidence, CAS updates, provenance and review mutations. |
| Company Brain | Supplier → component → product → commitment → customer → owner, plus documents and decisions. |
| Persistent memory | Source-linked human lessons and investigation history in the same isolated graph. |
| Agent coordination | Shared graph context and human handoff through reviewed drafts; no claim of a multi-agent runtime. |
| FalkorDB Cloud | Existing TLS connection support. This extension uses a free local persistent database; public Render remains ephemeral. |
| GraphRAG SDK | Integrated on this branch on 19 October: reviewed-notice ingestion, cloud extraction/embeddings and source-verified retrieval in an isolated companion graph. [Setup and evidence](GRAPHRAG.md). |
| Discord / guides | Learning and support resources, not dependencies or required product features. |

## Verification and repair loop

Observe → classify → make a small repair → rerun the affected checks → run the complete suite. Maximum three repairs for the same failure before recording the blocker. Never remove assertions, hide errors, or relabel an unverified feature to make a check pass.

Commands: `npm test`, `npm run lint`, `npm run build`, `npx playwright test`. Explicit optional cloud check: start the production app on port 3102 and run `npm run test:cloud`. The latter consumes real provider quota; ordinary CI does not.

The cloud check imports an adversarial pending notice, performs a real browser investigation, checks tool provenance and unchanged supply state, verifies saved memory after reload, and captures local evidence. It does not establish general prompt-injection immunity or semantic factual accuracy.

## Persistent local database

`compose.yaml` binds database port **6380** on loopback and mounts a named volume at the image's actual data directory, `/var/lib/falkordb/data`. AOF uses `everysec`; RDB uses `60 1`. This can lose roughly a second of recent writes after a crash and is not high availability.

```sh
docker compose -p opsrelay-durable up -d
```

If the Compose plugin is unavailable:

```sh
docker run -d --name opsrelay-durable \
  -p 127.0.0.1:6380:6379 \
  -v opsrelay-company-data:/var/lib/falkordb/data \
  -e 'REDIS_ARGS=--appendonly yes --appendfsync everysec --save 60 1' \
  --restart unless-stopped \
  falkordb/falkordb@sha256:b0bdcac2cbaff989e77cb0610439b7a9289e86de033ccbbd4368b66fb680ae7a
```

Set private `FALKORDB_URL=falkor://127.0.0.1:6380`, seed only if empty, then start the app. Never run both commands against the same port. Compose and the fallback use distinct volume naming; deliberately choose one.

For backup, restrict the destination directory, run `docker exec opsrelay-durable redis-cli SAVE`, and copy `/var/lib/falkordb/data/dump.rdb` to private storage. Backups include company data and potentially sessions; never commit them. Store copies separately from the host for disaster recovery.

For an RDB restore exercise, create a **new** container and volume with `--appendonly no`, copy the snapshot into its data directory before starting, and query the restored graph. Starting with AOF enabled and an empty AOF history can ignore an imported standalone RDB. After verifying restored data, enable AOF using `CONFIG SET appendonly yes`, wait for the initial rewrite to finish, and use AOF-enabled startup configuration thereafter. Do not overwrite an existing database or volume during a restore exercise.

Reference: [FalkorDB persistence guide](https://docs.falkordb.com/operations/durability/persistence).

## Remaining boundaries

No enterprise SSO/RBAC, real ERP/email connector, arbitrary PDF/OCR ingestion, production load test, high availability or external security assessment. Public free Render data still resets on redeploy/restart. The original 60-second video shows the submitted deterministic workflow, not this extension.

## 19 October: cloud SDK and palette extension

The development branch now uses GraphRAG SDK 1.4.0 with cloud Gemini extraction/embeddings for applied-notice indexing and evidence search. Actual ingestion and retrieval passed against local FalkorDB, including exact provenance and unchanged allocation. [Setup, limitations and Cloud status](GRAPHRAG.md). The website uses teal, mint and ivory, retaining amber risk labels. The free FalkorDB Cloud instance is healthy; secure app connectivity is blocked by its supplied plaintext connection; no public deployment is claimed for this extension.
