# SCS Production Architecture & Authorization Package (Phase 4)

**Status:** Proposed — submitted for the **SCS Production Architecture Review** gate.
**Author (implementation):** #SCS (holds no constitutional authority; acceptance is a Product Owner act).
**Governing directive:** Product Owner "Product Continuation and Architecture Directive — Establish the SCS Product Completion Path and Authorize Phase 4 Production Architecture" (2026-07-25).
**Accepted baseline:** commit `a773bd6`. **Prepared at HEAD:** `c545bae`.

> **This is architecture and planning only.** No PHP backend, MySQL migration, authentication, integration, email, Web Push, hosted-data transfer, or deployment has been implemented or started. Every production phase (5–9) requires acceptance of this architecture **and** a separate Product Owner production-implementation authorization.

> **Respects the Constitutional Architecture Freeze (ST-DEC-2026-016).** Phase 4 changes the *substrate* (how the existing model is persisted, served, secured, and deployed). It introduces **no new constitutional entities, layers, schemas, or concepts.** The 23 governed collections and the derivation engine are carried forward unchanged.

---

## 0. Two dimensions, stated once (ST-DEC guardrail)

Per the directive's Section 3, SCS is described on **two independent axes** — never conflated:

| Dimension | Current state |
| --- | --- |
| **Constitutional operating capability** | **Accepted, Verified, and Operational** (derivation engine + constitutional model, `a773bd6`). |
| **SCS software product maturity** | **Functional demonstration with an accepted constitutional core; production architecture and implementation incomplete.** |

"Operational infrastructure" is **not** a substitute for software-production status; the absence of a production backend does **not** diminish the accepted constitutional capability.

---

## Deliverable 1 — SCS Production Architecture Specification

### 1.1 Application architecture

**Current:** React 18.3 + TypeScript 5.6 + Vite 5.4 static SPA, HashRouter, TanStack Query 5, Tailwind 3.4, Dexie 4/IndexedDB. All data and logic live in the browser. No server.

**Target:** the same static client, plus a thin PHP `/api` that owns persistence, authentication, and integrations. **No Node.js runtime in production** — the client is pre-built to static assets and served from the PHP web root.

```
Browser (static React client, built to app/dist)
   │  fetch()  (was: direct Dexie calls)
   ▼
PHP /api  ──►  MySQL (authoritative records)
   ├─ auth/session
   ├─ derivation cache (optional; canonical derivation stays deterministic)
   ├─ workers (cron): digests, push retries, link-health
   └─ integrations: email (SMTP/API), Web Push (VAPID)
```

**Front-end / back-end boundary.** The **`StorageAdapter` interface is the seam.** Today `LocalAdapter` (Dexie) implements it; production adds a `RemoteAdapter` implementing the *same* interface against `/api`. The React app, TanStack Query hooks, and the **derivation engine are unchanged** — they depend on the adapter interface, not on storage. This is the single most important architectural fact: the client already has a clean persistence abstraction, so the production migration is an adapter swap plus a server, not a rewrite.

```ts
// Already exists — the production seam:
interface StorageAdapter {
  list<T>(c: CollectionName): Promise<T[]>;
  get<T>(c: CollectionName, id: string): Promise<T | undefined>;
  put<T>(c: CollectionName, record: T): Promise<T>;
  remove(c: CollectionName, id: string): Promise<void>;
  exportWorkspace(): Promise<WorkspaceBackup>;
  importWorkspace(b: WorkspaceBackup): Promise<void>;
  resetWorkspace(token: string): Promise<void>;
}
```

> **Rev 2 (Approved with Conditions, 2026-07-25):** the corrections required by the Product Owner Architecture Review Ruling are specified in **[PHASE_4_CORRECTIONS_REV2.md](PHASE_4_CORRECTIONS_REV2.md)** and supersede any conflicting text below. In particular: canonical derivation is **server-side** (the "pass-through of the client's derived snapshot" alternative is **removed**); the production API exposes **governed commands**, not unrestricted document replacement; and Phase 5 is narrowed to backend/persistence/migration/parity only.

**API architecture.** REST over `/api`. Reads are resource-per-collection (`GET /api/{collection}`, `GET /api/{collection}/{id}`) plus `GET /api/derived/*` served **only from server-computed, versioned derived state** (a disposable, reproducible cache of the canonical server derivation — never a browser-submitted snapshot). **Writes are governed commands, not unrestricted `PUT`/`DELETE`** (see Corrections Rev 2, Deliverable 3): `POST /api/commands/{command}`. Admin: dry-run-validated `POST /api/admin/import`, guarded `POST /api/admin/reset`. The generic `StorageAdapter` `put`/`remove` remain an **internal client abstraction only** — the client's `RemoteAdapter` maps them to governed commands; the server never exposes raw document replacement for governing records.

**Service / domain structure (server).** `Http` (routing, auth + CSRF middleware, JSON) → `Commands` (governed transitions with actor/prior-state/target-state checks) → `Domain` (the 23 collections as repositories) → **`Derivation` (the canonical server-side engine — a PHP port of the TypeScript engine, parity-tested against golden fixtures)** → `Integrations` (email, push) → `Persistence` (MySQL via PDO, optimistic locking). The TypeScript derivation remains for **client-side verification and offline/demo mode only**; the **server derivation is canonical**. Domain rules (Zod validators, derivation) are the source of truth; the server validates and derives on write.

**Environment model.** `local` (dev, SQLite or MySQL) → `staging` (Nestify, seeded demo) → `production` (Nestify, real records). Config via environment variables; no secrets in the repo.

### 1.2 Framework recommendation — Decision **D3** (Slim vs Laravel)

| Criterion | **Slim 4** | Laravel 11 |
| --- | --- | --- |
| Footprint / hosting fit (managed PHP) | Minimal, ideal for a thin JSON API | Heavier; needs more host control (queues, scheduler, storage) |
| Learning/maintenance for a small surface | Low — routing + PDO + middleware | Higher — full framework conventions |
| Batteries (auth, ORM, mail, queue, scheduler) | Add per-need (PHP-DI, Eloquent optional, Symfony Mailer) | Included (Sanctum, Eloquent, Mail, Queue, Scheduler) |
| Fit to our shape (23 CRUD resources + auth + cron + mail/push) | Strong | Strong but more than needed |
| Risk on Nestify managed PHP | Low | Medium (scheduler/queue may need workarounds) |

**Recommendation: Slim 4** (PHP 8.2+) with PHP-DI, `firebase/php-jwt` or PHP native sessions, PDO for MySQL, Symfony Mailer, `web-push-php` for VAPID, and a plain cron entrypoint for workers. **Rationale:** our API is a small, well-bounded set of CRUD resources plus auth and a few workers; Slim keeps the deployment small and predictable on managed hosting, avoids framework overhead, and matches the "no Node.js, thin API" deployment shape already documented in `server/README.md`. Laravel remains a viable fallback if richer tooling (queues, Nova-style admin) becomes desirable later. **Product Owner ruling required.**

---

## Deliverable 2 — SCS Current-to-Production Transition Plan

1. **Approve this architecture** (this gate) → **separate production-implementation authorization** (D-production-auth).
2. Stand up **Slim skeleton** + MySQL schema (migrations) in `staging` — no real data.
3. Implement **`RemoteAdapter`** in the client behind the existing interface; feature-flag `local` vs `remote`.
4. **Parity test**: run the full derivation/test suite against `RemoteAdapter` + seeded staging; must match `LocalAdapter` exactly.
5. Add **auth** (below) before any confidential data is hosted.
6. **Migrate** demo/seed first; real records only after auth + backups verified.
7. Integrations (email/push/workers), validation, then **deployment** to `shocktheoryos.com`.

The client keeps `LocalAdapter` as an **offline/demo mode**; production uses `RemoteAdapter`. No big-bang cutover — the seam allows incremental, reversible steps.

---

## Deliverable 3 — ProductOS Legacy Terminology Reconciliation (for `dec-0003`)

**Product Owner ruling applied:** ProductOS is **not** a separate fourth active product stream. It is a **legacy working name / predecessor concept** whose relevant approved operating-system functions are now represented by **ShockTheory OS** (the operating-system product) and, where implemented in software, by the **SCS Platform**.

**Factual reconciliation for `dec-0003`** (preserving history — no silent rewrite):
- The original ruling ("ProductOS placed under constitutional review") is **retained** as historical record.
- **Amendment (this directive):** the review resolves to — *ProductOS is a superseded predecessor term; it does not remain under active constitutional review as a competing current product.* Legacy references are marked historical/superseded where the record structure permits.
- **Presentation:** current dashboard/portfolio surfaces use **ShockTheory OS** (operating-system product) and **SCS Platform** (software implementation). No new constitutional meaning is invented.

Implemented in records as: a preserved-history note appended to `dec-0003` (ruling text unchanged), plus a portfolio that names ShockTheory OS and SCS Platform (not ProductOS).

---

## Deliverable 4 — Production Data & Migration Specification

**MySQL schema mirrors the approved model (`DATA_MODEL.md`) 1:1 — 23 tables, one per governed collection:**

`os_systems, products, publications, publication_phases, gates, decisions, canonical_statements, canonical_concepts, ai_collaborators, assignments, benchmarks, risks, updates, artifacts, review_items, next_actions, relationships, standing_directives, assignment_directives, deliverables, operational_history, teams, team_memberships`.

**Column strategy.** Each table has `id VARCHAR PRIMARY KEY`, the entity's typed columns, and a `source_integrity` JSON column carrying the `SourceIntegrity` envelope (`authorityStatus`, `demonstration`, `confidence`, `notes`, source fields) — keeping the constitutional envelope intact without new entities. Foreign-key-style links (e.g., `assignment_directives.deliverable → deliverables.id`) are indexed; referential integrity is enforced in the domain layer (the model uses soft links, not hard cascades, to preserve superseded records).

**`SCHEMA_VERSION` (currently `0.1.0`)** is stamped on every row-set export and drives migrations. A `schema_migrations` table records applied migrations. Breaking entity changes bump `SCHEMA_VERSION` and ship a forward migration.

**Migration from Dexie/IndexedDB.** The client already exports a **`WorkspaceBackup`** (`exportWorkspace()`), a single JSON of all 23 collections with `schemaVersion` + `isSeed`. Migration = `exportWorkspace()` → validate against Zod schemas → `POST /api/import` → server writes rows in a transaction. **Demo/seed data (`isSeed:true`, `demonstration:true`) is imported to staging only and never promoted to production as truth.**

**Backup & recovery.** Nightly MySQL dump (Nestify) + retained JSON `WorkspaceBackup` exports (portable, human-reviewable). **Audit/history preservation:** `operational_history`, superseded records (`authorityStatus:'superseded'`), and `updates` are **never hard-deleted**; the guarded `resetWorkspace` requires an explicit confirmation token and is disabled in production by default. Data-retention: governed records are retained indefinitely (constitutional evidence); only transient caches expire.

---

## Deliverable 5 — Authentication, Roles & Permissions Proposal

**Principle:** no confidential governance or product data is ever public. The current build is fully public/local; production requires an auth boundary **before** any real record is hosted.

- **Authentication (finalized in Rev 2, Deliverable 7):** email + password with Argon2id, **secure server-managed sessions** (HttpOnly, Secure, SameSite=Strict cookies) — **not** interchangeable with JWT; bearer tokens only if a documented requirement justifies them. CSRF protection, session rotation/expiry, TOTP 2FA for the Product Owner, and emailed single-use recovery.
- **Identities:** **Product Owner** (Sonja) — the only human with approval authority; **Agents/System identities** (#SOS, #SCS, #CKL, #CKP, #CIA, #CKL-R) — represented as governed records, not login accounts in v1 (agents act through #SCS-implemented workflows, not interactive logins); **Admin** (operational).
- **Roles → permissions (least privilege):**

| Role | Read | Propose (create `proposed` records) | **Approve / Accept** | Admin/reset |
| --- | --- | --- | --- | --- |
| Product Owner | all | yes | **yes (sole)** | yes |
| Admin (ops) | all | no | no | limited |
| Agent/system (via API key) | scoped | yes (proposed only) | **no** | no |
| Unauthenticated | none | no | no | no |

- **Approval boundary is enforced server-side:** no API key, default value, or client action can set `authorityStatus:'approved'` or accept a deliverable — only an authenticated Product Owner action can. This mirrors the constitutional rule already enforced in the model.
- Session management, password rotation, admin controls, and a per-record confidential flag (`confidentiality`) govern exposure.

---

## Deliverable 6 — Hosting & Deployment Architecture

- **Host:** Nestify (managed PHP), **PHP 8.2+**, **MySQL**, production domain **`https://shocktheoryos.com`** (confirmed as recorded; Product Owner to ratify).
- **Deployment shape:** `server/public/` is the web root; it serves (1) the built static client (`app/dist` synced in) and (2) `/api/*` via PHP. No Node.js in production.
- **Config/secrets:** environment variables (DB creds, mail creds, VAPID keys, app secret) via Nestify env — never in the repo.
- **Monitoring/logging:** structured server logs, error alerting, uptime check on `/api/health`.
- **Backups/rollback:** nightly DB dump + JSON export; tagged releases; rollback = redeploy previous tag + restore snapshot.
- **Deployment workflow:** build client → run migrations (forward-only) → deploy API → smoke test → flip. CI (existing `ci.yml`) extends to build + test gates before deploy.

---

## Deliverable 7 — Integration & Notification Architecture

- **Transactional email** (recovery, review-requested): provider **D5** — recommend an SMTP/API provider with strong deliverability; require **SPF, DKIM, DMARC** on `shocktheoryos.com`.
- **Digest email** (periodic PO summary of pending decisions/reviews) via a cron worker.
- **Web Push** (VAPID) through the client service worker for review/blocker alerts.
- **Scheduled workers** (`server/workers/`, cron): digests, push retries, link-health checks on artifacts.
- **Event processing:** write-time hooks enqueue notifications; **failure/retry** with backoff and a dead-letter log.
- All integrations are **Phase 7** — recommended here, not implemented.

---

## Deliverable 8 — Security & Privacy Architecture

- **Threat boundaries:** public client ↔ authenticated API ↔ private DB. Everything sensitive sits behind auth.
- **Least privilege** (role table above); **encryption** in transit (TLS) and at rest (host-managed) + app-level hashing for credentials; **secrets** in env only; **auditability** via `operational_history` + `updates` + server access logs.
- **Confidential data:** governance and product records are Confidential — never public, never in URLs/query strings, never emailed in full.
- **Privacy implications of hosting organizational records:** hosting real records raises the stakes; therefore auth + backups + audit must land **before** migration of real data (sequenced in Deliverable 2).

---

## Deliverable 9 — Validation & Acceptance Plan

- **Unit** (domain rules, Zod validators), **integration** (API + DB), **e2e** (critical flows: propose → PO approve → derive), **migration tests** (export→import parity), **permission tests** (approval boundary cannot be bypassed), **derivation regression** (the existing 32-test suite runs against `RemoteAdapter` and must match `LocalAdapter` exactly), **accessibility** (keyboard/contrast/labels), **security** (authz, session, injection), **performance** (list/derive latency budgets).
- **Deployment acceptance evidence:** green suite + smoke tests + a Product Owner-reviewable staging walkthrough. **Acceptance remains a Product Owner act** at each gate.

---

## Deliverable 10 — SCS Self-Governance & Automatic Derivation Specification

SCS tracks **its own** development through the same governed structures it uses for everything else — data-driven, not a manual status desk:

- **Product record** `prod-scs` (SCS Platform) carries steward, classification, lifecycle stage.
- **Phase, active work, deliverables, gates, blockers, risks, pending decisions, Operational History** are **derived** from the governed records linked to SCS (this Phase 4 Assignment Directive, its deliverable ST-DLV-2026-005, the SCS Production Architecture Review gate, the decision package, and `operational_history`) — **not hard-coded**.
- **Production readiness** and **deployment status** derive from which phase gates are accepted.
- **The platform may never declare its own work accepted.** Acceptance is a Product Owner act; the platform only *presents* proposed/pending/accepted states honestly (the same authority model already enforced).

**Product-dashboard derivation (how SCS appears as a product):** a product view composes, by `product = prod-scs`: current phase (latest accepted phase gate), active Assignment Directives, deliverables + their gates, blockers/risks, pending Product Owner decisions, implementation maturity, production readiness, deployment status, and Operational History — all read from authoritative records, with demonstration data isolated.

---

## Deliverable 11 — Product Owner Decision Package

Each decision is isolated (not buried in prose):

| ID | Decision | Options | Recommendation | Key risk / implication |
| --- | --- | --- | --- | --- |
| **D3** | Production framework | Slim 4 · Laravel 11 | **Slim 4** | Under-tooling if scope grows (mitigated: Laravel fallback) |
| **D5** | Email provider | SMTP relay · API (e.g. transactional ESP) | ESP with strong deliverability + SPF/DKIM/DMARC | Deliverability/domain reputation |
| **D-auth** | Auth & role model | sessions vs JWT; agents as accounts vs records | Sessions + Argon2id; agents as records, API keys scoped to `proposed` | Approval-boundary integrity |
| **D-host** | Hosting confirmation | Nestify/MySQL/`shocktheoryos.com` | **Confirm as recorded** | Managed-host limits on cron/queue |
| **D-migrate** | Data-migration approach | export/import parity, demo-first | Demo→staging first; real data only post-auth/backup | Data loss / premature exposure |
| **D-prod-auth** | Production implementation authorization scope | full vs phase-by-phase | **Phase-by-phase** (5→9), each gated | Scope creep / premature go-live |
| **D-seq** | Phase sequencing | as proposed (5→9) | Accept sequence | Dependency violations |
| **D-deploy** | Deployment authority | who authorizes go-live | Product Owner authorizes go-live | Unauthorized deploy |

Each requires an explicit Product Owner ruling. **None is decided by #SCS.**

---

## Deliverable 12 — Recommended Phase 5–9 Implementation Sequence

**Revised in Rev 2 (Condition J):** **Phase 5 is narrowed** to *backend foundation, persistence, migrations, and `RemoteAdapter` parity only* — it does **not** authorize authentication rollout, email, Web Push, confidential-data migration, deployment, or go-live. **Phase 6 Auth** is separately gated; **no confidential production data may be hosted before the authentication boundary is accepted.** Sequence: **5 Backend & Persistence (narrow)** → **6 Auth, Roles & Permissions** → **7 Integrations** → **8 Validation** → **9 Deployment**. Each has its own scope, deliverable, gate, Product Owner approval, and exit criteria. **None is authorized now.**

---

## Deliverable 13 — Risks, Assumptions, Dependencies, Unresolved Questions

- **Risk:** hosting real records before auth/backups → privacy exposure. *Mitigation:* sequence auth+backup before real-data migration.
- **Risk:** server-side derivation divergence from client. *Mitigation:* keep derivation deterministic; parity-test `RemoteAdapter`; treat server derivation as cache, not authority.
- **Risk:** managed-host limits on cron/queue. *Mitigation:* Slim + simple cron; validate on Nestify early.
- **Assumptions:** Nestify/MySQL/PHP 8.2/`shocktheoryos.com` confirmed; `StorageAdapter` remains the seam; SCHEMA_VERSION governs migrations.
- **Dependencies:** every production phase depends on this architecture's acceptance + a production-implementation authorization; D3/D5/D-auth block Phase 5–7.
- **Unresolved questions:** agents as login accounts later? single-tenant only (Product Owner) or multi-user? email provider choice (D5); framework (D3).

---

## Deliverable 14 — Updated SCS Product-Status Summary

- **Constitutional capability:** Accepted, Verified, Operational (`a773bd6`).
- **Software product maturity:** Functional demonstration + accepted constitutional core; **Phase 4 production architecture proposed (this document), awaiting the SCS Production Architecture Review**.
- **Production:** not started; not authorized.
- **Portfolio position:** SCS Platform is an **active internal software platform**, developed **in parallel** with Kidlytics (primary commercial) and ShockTheory OS (operating-system product).

---

## Portfolio classification (directive Section 9)

| Product | Classification | Current organizational role |
| --- | --- | --- |
| ShockTheory OS | Internal operating-system product | Defines approved operating methods (steward #SOS) |
| **SCS Platform** | Internal software platform | Implements & automates ShockTheory OS; derives/presents governed state (steward/implementer #SCS) |
| Kidlytics | Commercial product | Primary governed commercial initiative (architect #CKL) |

Statuses on these surfaces are **derived from authoritative records**, not hard-coded.

---

## Review gate

Submitted to **SCS Production Architecture Review** (`requiresOwnerApproval: true`). The Product Owner may **approve / approve with conditions / return for correction / reject**. **Acceptance of this architecture does not authorize production implementation** — that is a separate Product Owner ruling (D-prod-auth).
