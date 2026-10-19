# Cloud document intelligence

OpsRelay uses FalkorDB GraphRAG SDK **1.4.0** for reviewed-notice ingestion, entity/relationship extraction, vector storage and retrieval. Gemini performs cloud extraction and 768-dimensional embeddings; no local inference model is installed or used. The operational allocation algorithm remains deterministic.

## Local setup

Use Python 3.13 and a real FalkorDB instance:

```sh
python3.13 -m venv .venv
.venv/bin/pip install -r graphrag/requirements-cloud.lock
.venv/bin/pip install --no-deps graphrag-sdk==1.4.0
```

Set these **private** server environment values:

```dotenv
GRAPHRAG_ENABLED=1
GRAPHRAG_PYTHON=/absolute/path/to/OpsRelay/.venv/bin/python
GEMINI_API_KEY=your-private-key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

The upstream package declares GLiNER as a required dependency despite lazy-loading it only for the default local extractor. This cloud-only installation deliberately omits GLiNER and its Torch stack and explicitly supplies the SDK LLMExtractor instead. Consequently `pip check` reports that omitted dependency. Six runtime tests cover this mode; there is no claim of a standard full upstream installation. All installed runtime dependencies are pinned in the lock file.

Restart the server after environment changes. In Company knowledge, import a synthetic Kestrel M14 notice, apply a reviewed date, then choose **Index reviewed evidence**. Search with a natural-language question and open its original source. Each indexing action explicitly sends the reviewed text to Gemini. Do not use confidential company documents with a free provider account without first checking its data terms.

## Boundaries

- A server-authenticated workspace determines its companion graph and ontology graph. Browser input cannot select a graph or interpreter.
- Pending/rejected notices cannot be indexed. Only passages found verbatim in an indexed, applied notice are returned to the app.
- Extracted entities are suggestions and context, never supply facts or approval authority. Model-generated Cypher is disabled; retrieval uses a fixed traversal back to the original document.
- One global worker at a time, 40 provider calls per job, 20 seconds per HTTP response, 70 seconds in Python and a 75-second process kill limit. Jobs do not retry provider failures or enable paid fallback. Workspace/global rate limits also apply.
- Index markers are written only after SDK finalization succeeds. Repeated successful indexing returns the existing result. Partial SDK writes from an interrupted job may remain in the companion graph but cannot become searchable in the app without a successful index marker.
- Demo companion and ontology keys expire with the demo registry deadline. Operator graphs persist according to the configured database plan.
- SDK stdout is a bounded private JSON protocol. Vendor messages and connection credentials are not returned to the browser or logged.

## FalkorDB Cloud

Set the existing `FALKORDB_URL` to a **verified TLS** Cloud URL (`rediss://...` or `falkors://...`) in the server environment. Both Node and Python support TLS; Python checks certificate and hostname. Container startup skips the embedded database for a remote TLS URL. The seed script preserves existing graphs.

The account is signed in and the free subscription was selected on 19 October 2026. The user created a free instance in AWS ap-south-1. Its audit log records healthy deployment at 17:56 IST, and the instance details show Running / Healthy. The portal’s generated Browser connection explicitly sets `tls=false`. A secure Cloud endpoint has not been connected or verified. The published free-plan comparison currently excludes TLS, continuous persistence and automated backups; verify the actual instance settings. Do not upgrade to a paid plan or weaken TLS to bypass that limitation. Until a secure permitted endpoint is available, the existing local/Render database remains in use.

## Verification

```sh
.venv/bin/python graphrag/test_worker.py
node scripts/graphrag-smoke.mjs
```

The second command consumes Gemini free quota and creates a disposable demo workspace. It verifies actual SDK indexing, semantic retrieval, exact source provenance and unchanged operational allocation. It does not verify FalkorDB Cloud or a public deployment.

Sources: [SDK providers](https://falkordb.github.io/GraphRAG-SDK/providers/), [SDK setup](https://falkordb.github.io/GraphRAG-SDK/getting-started/), [Gemini embeddings](https://ai.google.dev/gemini-api/docs/embeddings), [FalkorDB plans](https://www.falkordb.com/plans/).
