# Security and deployment boundaries

OpsRelay is a secured synthetic-data pilot with a protected operator workspace and separate public demo workspaces. It is not a multi-company production service.

## Implemented

- All graph read/write routes require a server-issued session; the public health route returns only readiness.
- Cryptographically random opaque session cookies are HttpOnly, SameSite Strict, and Secure on HTTPS. Operator sessions expire after eight hours and demo sessions after one hour, are revoked on logout, and become invalid when the operator password changes. Redis stores keyed token digests, not raw tokens.
- Server-side identity and graph assignment supply the recorded reviewer and permitted workspace. A client cannot choose another reviewer.
- JSON bodies are limited to 4 KiB. Cross-site origins are rejected. Dates and operations are validated and Cypher uses parameters.
- Redis enforces 30 login attempts per 15-minute bucket and 120 authenticated requests per session per minute. Login throttling is global for this single-operator pilot, so abuse can temporarily block legitimate login.
- Supply updates use a revision guard in one Cypher write. A new update supersedes previous open proposals and creates tasks for the current shortages, including partial recovery. Competing updates return a conflict rather than leaving partial event/task writes. Reads detect a supply revision change during analysis.
- API responses disable caching. Security headers disable framing and MIME sniffing. CSP permits inline scripts/styles required by this build; a strict nonce policy is not implemented.
- Remote production database connections require TLS. The combined Docker deployment connects only over container loopback and exposes only the app HTTP port.
- Normal startup preserves nonempty graphs. Destructive reset requires an explicit flag and environment variable. Browser tests reset only a disposable graph.

## Free hosting

The combined Docker route runs real FalkorDB, but its local database is ephemeral. An idle shutdown, restart, or redeploy can erase updates and sessions. It reseeds synthetic baseline data on restart. Do not put private or irreplaceable business information in it.

Set a unique operator password of at least 20 characters in the hosting environment. Give reviewers access privately. Never put the password in source, a public README, or a demo video. `/api/health` should return HTTP 200 before announcing a live deployment.

For durable operation, use a TLS-enabled FalkorDB service with persistence, monitored backups and a verified restore procedure. Free hosting does not establish those guarantees.

## Remaining production work

SSO, per-user roles, tenant isolation, retention controls, managed secret rotation, durable audit storage, monitoring/alerts, backup restore exercises, load testing, and an independent security review remain outside this pilot. Global login throttling and one shared identity are unsuitable for a larger organization.

The current development dependency audit reports five high-severity entries through ESLint's glob dependency chain. Production dependencies report none in the recorded audit; that result is time-sensitive. A forced major framework downgrade is not an acceptable repair.

## Public demo boundary

`POST /api/session` with `kind: demo` creates a random graph seeded with the same fictional company. The opaque session stores the graph assignment on the server. Request bodies cannot choose a graph, actor, or tenant. AsyncLocalStorage scopes each request's database operations to that assignment. Operator graph access still requires the private password.

Demo creation is globally limited to 12 per minute and 40 registered workspaces. Demo sessions expire after one hour; expired demo graphs are collected on the next creation. This lazy cleanup is appropriate only for the small, ephemeral hackathon host. Inactive graphs may remain in memory until another creation or process restart. Do not place private information in a public demo. Free-host restart can remove any session and graph.
