# SCS Phase 5 — Backend Foundation & Persistence Implementation Package

**In response to:** Product Owner Production Implementation Authorization Directive — *Phase 5 — Backend Foundation & Persistence Authorization* (2026-07-25).
**Submitted to gate:** **SCS Backend Foundation & Persistence Review** (deliverable **ST-DLV-2026-006**).
**Scope:** narrow — backend foundation, governed persistence, MySQL schema/migrations, `RemoteAdapter`, parity. Dev/test with synthetic/demonstration/non-confidential data only.

> **Environment note (honest validation boundary):** PHP and MySQL are **not available** in the authoring environment. The **client `RemoteAdapter` and parity harness are fully implemented and verified** in the TypeScript/vitest suite. The **Slim 4 PHP backend, MySQL schema, migrations, and import tool are implemented as real, reviewable code** whose *runtime* execution (start server, run migrations, prove DB constraints) is an explicit **host-verification item** — not a faked pass. Nothing was silently marked validated.

---

## 1. Phase 5 Implementation Summary

The accepted `StorageAdapter` seam let the client reach a governed remote persistence layer **without changing product behavior or constitutional meaning**. The centerpiece proof is a parity suite: an identical operation trace produces identical observable results through a reference (LocalAdapter-equivalent) adapter and the new `RemoteAdapter` driving the governed API. Optimistic concurrency, idempotency, guarded reset, and validated import are all exercised. The server side (Slim 4 + MySQL) is written to the same contract the parity harness encodes.

## 2. Backend Foundation Technical Record

- **Slim 4** app (`server/public/index.php`): body-parsing + routing + JSON error handler; refuses to run when `SCS_ENV=production`. Routes: `/api/health`, `/api/derived/{view}` (seam), collection reads, `/api/commands/{command}`, dev delete, `/api/admin/{import,export,reset}`.
- **`src/`**: `Config` (env-only secrets), `Database` (PDO, transactions, `ATTR_EMULATE_PREPARES=false`), `Repository` (per-collection persistence + version metadata), `Commands` (governed `upsert` + idempotency + 409), `Importer` (validated import), `Http` (JSON, collection allow-list, structured errors).
- Health-check + dev/test config + `composer serve`/`composer migrate` scripts. Local dev instructions in `server/README.md`.

## 3. MySQL Schema & Migration Package

- `server/migrations/0001_init.sql` — **23 governed tables** (one per collection). Each row: `id` PK, full record as `data JSON`, plus server-owned `authority_status`, `is_demonstration`, `version`, `created_at`, `updated_at`, `archived`. Indexed/foreign columns are **STORED generated columns** extracted from `data`, so the generic repository writes only `data` while the DB enforces integrity. `schema_migrations` tracks applied versions.
- `server/migrations/migrate.php` — deterministic runner: `apply` · `status` · dev-only `reset` (refuses in production). Ordered, repeatable, safe for fresh environments.

## 4. Relational Integrity Implementation Matrix

| Link | DB enforcement | Notes |
| --- | --- | --- |
| standing_directives.agent → ai_collaborators | **hard FK** | |
| standing_directives.governing_decision → decisions | **hard FK** (nullable) | |
| assignment_directives.agent → ai_collaborators | **hard FK** | |
| assignment_directives.standing_directive → standing_directives | **hard FK** (nullable) | |
| assignment_directives.deliverable → deliverables | **hard FK** (nullable) | |
| assignment_directives.review_gate → gates | **hard FK** (nullable) | |
| assignment_directives.product_owner_decision | **soft** (indexed) | canonical ST-DEC ids may be Product-Owner-pending |
| deliverables.review_gate → gates | **hard FK** (nullable) | |
| deliverables.assignment_directive | **soft** (indexed) | breaks the ADR↔DLV cycle |
| team_memberships.team → teams | **hard FK** | |
| team_memberships.agent | **soft** (indexed) | Product Owner (po-sonja) is not an ai_collaborator |
| operational_history.related_object | **soft** (indexed) | append-only evidence must survive supersession |

Soft references are the **listed exceptions with reasons**, not a default. Operational History is append-only (INSERT/SELECT grants only in production).

## 5. Persistence Repository / Service Specification

`Repository` exposes `list/get/currentVersion/upsert/delete/exportWorkspace/resetAll`. It preserves record boundaries, authoritative-vs-derived separation (derivation is never stored as authority), provenance, and history; it prevents silent hard deletion of governed history (delete is dev/test only; production uses archive/supersede). All access is parameterized PDO; no SQL interpolation.

## 6. Governed API Operations Record

Reads: `GET /api/{collection}`, `GET /api/{collection}/{id}` → `{record, version}`. Writes: `POST /api/commands/upsert` with `{collection, record, expectedVersion?, idempotencyKey?}`. **`authorityStatus`, acceptance, and activation cannot change via raw document replacement** — approval/activation commands are Phase 6 (authenticated) and are intentionally absent. Admin: `import` (validated), `export`, guarded `reset`.

## 7. RemoteAdapter Implementation & Contract Report

`app/src/storage/remoteAdapter.ts` implements the accepted `StorageAdapter` over an **injectable transport** (production = `httpTransport(baseUrl)` via fetch; tests = in-memory API). It preserves the client contract, enforces **automatic optimistic concurrency** (caches the version seen on read, sends `expectedVersion` on write, throws `ConflictError` on 409), and surfaces network/validation/conflict/server errors. The client selects it via `app/src/storage/adapter.ts` when `VITE_SCS_API_BASE` is set — **default remains LocalAdapter**, so the demonstration build is unchanged. No broad client rewrite was required.

## 8. Concurrency & Idempotency Validation Report

Verified in `app/tests/remoteAdapter.parity.test.ts`:
- **Optimistic concurrency:** two adapters share one API; a stale writer is rejected with `ConflictError`; the newer authoritative record survives. **No stale overwrite.**
- **Idempotency:** a repeated command with the same key applies once (version stays 1).
- Structured 409 payload `{currentVersion, currentRecord}` lets the client reload/reconcile.

## 9. Development/Test Import Tool & Import Safety Report

`Importer` runs: shape + **schema-version** validation (`0.1.0`), duplicate detection, referential-integrity report, **demonstration-data labeling**, record counts + **SHA-256 content hash**, transactional apply/rollback, and an immutable import report. Dry-run supported. **No record becomes production-authoritative merely because its JSON says `approved`** (full authority-from-evidence validation is Phase 6+). **No confidential/production data may be imported in Phase 5.**

## 10. Server-Side Derivation Foundation Report

The **seam is established**: `GET /api/derived/{view}` returns server-computed, version-stamped output; the server never trusts a client snapshot; the browser-pass-through alternative remains removed. **Sequencing recommendation:** the full faithful PHP port of `deriveAgentState`/`deriveTeam` exceeds Phase 5's bounded persistence scope and cannot be parity-tested here (no PHP). Recommend it as the **first task of Phase 5.5/early Phase 6**, gated by the existing golden-fixtures corpus (the 32-item derivation suite) run against both engines. Phase 5 proves location, version stamping, and reproducibility-from-records.

## 11. Local & Test Environment Setup Guide

Client: `npm ci && npm run build` (default local mode) or set `VITE_SCS_API_BASE` for remote. Server (host with PHP 8.2+/MySQL): `cp .env.example .env` (keep `SCS_ENV=development`), `composer install`, `composer migrate`, `composer serve`. See `server/README.md`.

## 12. Hosting Capability Verification Update

**Nestify is NOT treated as confirmed.** Unverified items (must be checked on the host before any deploy — which Phase 5 does not authorize): PHP 8.2+, Composer on-host, cron, env/secret handling, outbound egress (email/push), TLS, DB connection limits, backup/log access, rollback tooling. Fallbacks: external scheduler, vendored build, provider allowlisting. Laravel remains the fallback framework.

## 13. Automated Test Results

`npm run typecheck` clean; **`vitest run` → 39 tests pass** across 4 files: `derivation.test.ts` (16, **unchanged**), `authority.test.ts` (4), `onboarding.test.ts` (12), **`remoteAdapter.parity.test.ts` (7, new)**. `vite build` succeeds. PHP/MySQL tests are host-verification items.

## 14. Local-versus-Remote Parity Matrix

| Behavior | Reference (Local-equiv) | RemoteAdapter | Result |
| --- | --- | --- | --- |
| list / get / put / update / remove trace | ✓ | ✓ | **identical** |
| missing record → undefined | ✓ | ✓ | identical |
| export contains 23 collections | ✓ | ✓ | identical |
| export → import round-trip | ✓ | ✓ | identical |
| optimistic-concurrency conflict | n/a (local) | ✓ 409 | remote adds safety; no regression |
| idempotent command | n/a | ✓ | remote adds safety |
| guarded reset | ✓ | ✓ | identical |

## 15. Known Gaps, Deviations & Risks

- **PHP/MySQL not runtime-validated here** — backend execution, migration run, and DB-constraint proof are host-verification items (Gap, not defect).
- **Full server-side derivation port deferred** (sequencing recommendation §10) — Phase 5 delivers the seam, not the port.
- **Hosting unverified** (§12).
- No architecture deviations; no new constitutional entities; no product-behavior change.

## 16. Phase 6 Readiness Recommendation

Backend foundation + persistence are architecturally proven at the contract level. Recommend Phase 6 (separately gated) sequence its first step as: (a) run the backend + migrations on a verified host, (b) complete the PHP derivation port with golden-fixture parity, (c) then the authentication boundary — **before** any confidential data is hosted.

## 17. Product Owner Decision Queue

1. Accept the Phase 5 backend foundation? 2. Accept the MySQL schema? 3. Is `RemoteAdapter` parity sufficient? 4. Complete server-side derivation before Phase 6 or within it? 5. Are hosting capabilities to be verified before Phase 6? 6. Any architecture deviations to accept? (none proposed) 7. Authorize Phase 6 authentication planning/implementation? 8. Advance migration beyond synthetic/demo data? (not yet recommended) 9. Do any Phase 5 gaps block continuation? Identifiers **remain Product-Owner-pending** (ST-ADR-2026-007 / ST-DEC advisory).

## 18. Implementation Traceability Matrix

| Directive requirement | Where |
| --- | --- |
| A. Backend foundation (Slim 4) | `server/public/index.php`, `server/src/*` |
| B. Persistence layer | `server/src/Repository.php` |
| C. MySQL schema | `server/migrations/0001_init.sql` |
| D. Migrations | `server/migrations/migrate.php` |
| E. Governed server operations | `server/src/Commands.php` (upsert; no raw-JSON authority change) |
| F. RemoteAdapter | `app/src/storage/remoteAdapter.ts`, `adapter.ts` |
| G. Optimistic concurrency | RemoteAdapter version cache + `Commands` 409; test `remoteAdapter.parity.test.ts` |
| H. Idempotency & traceability | `X-Request-Id`, idempotency keys; parity test |
| I. Import tooling | `server/src/Importer.php`; `inMemoryApi` import; parity test |
| J. Parity validation | `app/tests/remoteAdapter.parity.test.ts` |
| Server-side derivation boundary | `/api/derived/{view}` seam; §10 |
| Auth boundary (dev-only) | none implemented; `credentials:'include'` seam only |
| Data restrictions | synthetic/demo only; import refuses confidential (policy) |
| Architecture freeze | JSON-`data` persistence; no new entities/schema |

## 19. No Prohibited Downstream Actions Occurred

Confirmed: **no** authentication rollout, confidential-data hosting, integrations, email, Web Push, OS-CAP-001 implementation, CivicComms activation, Kidlytics change, public deployment, production hosting, DNS change, cutover, or launch. `SCS_ENV=production` is refused by the backend. No canonical identifiers assigned.

---

---

## Host Runtime Verification (correction round — Return for Correction)

**Product Owner disposition:** *Return for Correction — host runtime verification required.* The client seam is verified; the PHP/MySQL backend must be **executed**.

**Authoring-environment finding (proven, not asserted):** this environment has **no PHP, no MySQL, no Docker/podman, no Homebrew, and no network to package registries** (`getcomposer.org` times out; only `github.com`/`api.github.com` are reachable). Therefore the PHP/MySQL runtime **cannot be established or executed here**, and — per the directive — I did **not** swap MySQL, weaken the architecture, or represent any unexecuted step as passed.

**What I did instead — make the required verification turnkey and automated where a runtime exists:**
- **`server/tests/PersistenceTest.php`** (PHPUnit) — runs against **real MySQL**: table creation, upsert/list/get/update, **optimistic-concurrency 409**, **idempotency**, **foreign-key rejection**, **transaction rollback**, **import dry-run/apply**, schema-mismatch rejection.
- **`app/tests/remoteAdapter.e2e.test.ts`** — the **actual** `RemoteAdapter` (not the in-memory API) against the **running PHP/MySQL backend**, gated by `SCS_E2E_BASE`. Skips locally; runs in CI. Covers health, CRUD round-trip, optimistic concurrency, import/export, guarded reset.
- **`.github/workflows/phase5-verify.yml`** — GitHub Actions job with a **MySQL 8 service** + **PHP 8.2**: PHP syntax, `composer`, migrations (+status), PHPUnit, boot backend, frontend typecheck/tests/build, then the **end-to-end RemoteAdapter↔real-backend** test. This executes every acceptance-threshold item on infrastructure that has the runtime.
- **`server/docker-compose.yml`** + **`scripts/verify-phase5.sh`** — one-command local host verification (PHP 8.2 + MySQL 8) for a reviewer with Docker.

**Executed vs. not (honest):**

| Check | Executed here | Where it executes |
| --- | --- | --- |
| Frontend typecheck / unit tests / build | ✅ (39 pass; e2e 5 skipped) | local + CI |
| Client RemoteAdapter parity (in-memory) | ✅ (7 pass) | local + CI |
| PHP syntax (`php -l`) | ❌ no PHP | CI / host |
| composer install, migrations, DB constraints | ❌ no PHP/MySQL | CI / host |
| PHPUnit persistence / concurrency / idempotency / import / rollback | ❌ | CI / host |
| E2E RemoteAdapter ↔ real PHP/MySQL | ❌ (skipped locally) | CI / host |
| Nestify hosting capabilities | ❌ (no access) | host verification |

**Product Owner decision required (genuine blocker):** executed PHP/MySQL runtime results cannot be produced in this sealed environment. Options: (a) let the pushed **CI workflow** run on GitHub and review its results/logs in the Actions tab; (b) run `scripts/verify-phase5.sh` (or `docker compose`) on a host with PHP 8.2 + MySQL 8; (c) provide me a runtime with those tools and network. Any of these yields the required evidence; I will fold the executed results into this same deliverable and resubmit. Per the STOP condition ("the required runtime cannot be established as written"), I am returning this decision rather than fabricating results.

## Readiness statement

**SCS Phase 5 Backend Foundation & Persistence IS ready for Product Owner acceptance at the contract level** — the client-side seam and parity are fully verified, and the backend is complete and reviewable — **subject to host-side runtime verification** (PHP/MySQL execution, migration run, Nestify capabilities), which Phase 5 does not authorize deploying. The Product Owner may Approve, Approve with Conditions (e.g., require host runtime verification), Return for Correction, Reject, or Defer.
