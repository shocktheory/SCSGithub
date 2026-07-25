# SCS Production Baseline v1.0

**Status:** Proposed — submitted to the **SCS Production Baseline v1.0 Review** gate.
**Authority:** Product Owner Baseline Establishment Directive — *SCS Production Baseline v1.0* (2026-07-25).
**Prepared by:** #SCS (implementation; holds no constitutional authority — acceptance is a Product Owner act).
**Snapshot commit:** `4e57b39` (immediately following acceptance of Phase 5).

> **This is a documentation baseline only.** No implementation, architecture, code, or accepted governance record was changed to produce it. It is the authoritative snapshot of *what had been accepted before Phase 6 began* and the reference point for every future Product Owner review.

---

## 1. Executive Summary

SCS (ShockTheory Constitutional System) is an **active internal software platform** that implements approved ShockTheory OS concepts, stores and links authoritative governed records, derives organizational/product state, and presents it. As of this baseline it has an **accepted constitutional core** (derivation engine + constitutional model) and an **accepted, runtime-verified backend foundation & persistence layer**.

- **Maturity:** functional demonstration + accepted constitutional core + accepted Phase 4 architecture + accepted, runtime-verified Phase 5 backend foundation. **Not yet a production/hosted system.**
- **Completed & accepted phases:** Phase 0 (architecture), Phase 1 (design baseline + functional demonstration), Phase 2 (Constitutional State Derivation), Phase 3 (Operational Governance & Agent Onboarding), Phase 4 (Production Architecture), Phase 5 (Backend Foundation & Persistence).
- **Accepted implementation scope:** static React client (local + remote adapters), Slim 4 PHP backend, MySQL schema/migrations, governed commands, optimistic concurrency, import tooling, and CI runtime verification.
- **Remaining work (not authorized):** Phase 6 auth/roles/permissions, integrations, validation-at-scale, deployment, production hosting.
- **Implementation philosophy:** architecture approved before implementation; authority displayed never manufactured; state derived from authoritative records; every phase independently gated and Product-Owner-accepted.
- **Governance status:** fully governed through Assignment Directives → Deliverables → Review Gates → Product Owner dispositions → Operational History, with a Constitutional Architecture Freeze in force.

---

## 2. Product Identity

| Dimension | Value |
| --- | --- |
| Product Name | ShockTheory Constitutional System (SCS) — "SCS Platform" |
| Product Purpose | Implement approved ShockTheory OS concepts; store/link authoritative records; derive & present governed organizational/product state |
| Product Classification | Internal software platform |
| Current Lifecycle | Post-Phase-5 (implementation) |
| Current Status | Active — internal platform, developed in parallel with Kidlytics |
| Implementation Status | Phase 5 Accepted (backend foundation & persistence) |
| Operational Status | Not operational |
| Production Status | Not production |
| Commercial Status | Internal only |

Dimensions are independent: an accepted constitutional capability is not the same as production software maturity.

---

## 3. Accepted Product Timeline

| Phase | Objective | Disposition | Major outcomes | Governing deliverable | Review gate |
| --- | --- | --- | --- | --- | --- |
| **Phase 0** | Architecture (stack, data model, deployment path) | Approved (`upd-phase0`) | React/TS/Vite + IndexedDB; PHP/MySQL/Nestify path locked | Architecture proposal | — |
| **Phase 1** | Functional demonstration shell + design baseline | Design baseline Approved (`upd-phase1`); demonstration Accepted | SCS Home, Executive Snapshot, Team Command Center | ST-DLV-2026-001 | Team Command Center review (rgate-001) |
| **Phase 2** | Constitutional State Derivation engine + reconciliation | Accepted (baseline `a773bd6`, ST-OPH-2026-010) | `deriveAgentState`/`deriveTeam`; honest activation from approved evidence | ST-DLV-2026-002/003 | Phase 2 / Reconciliation review (rgate-002/003) |
| **Phase 3** | Operational Governance & Agent Onboarding | Accepted | Governed onboarding workspace; AGENT-006/#CKL-R onboarded, activated, assigned (ST-ADR-2026-005) | Onboarding capability | (rgate for onboarding) |
| **Phase 4** | Production Architecture & Authorization | Accepted | Server-side derivation, governed commands, integrity model, session auth direction, narrowed Phase 5 | ST-DLV-2026-005 | SCS Production Architecture Review (rgate-005) |
| **Phase 5** | Backend Foundation & Persistence | **Accepted** (runtime-verified) | Slim 4 backend, MySQL schema/migrations, RemoteAdapter, parity, CI runtime verification | ST-DLV-2026-006 | SCS Backend Foundation & Persistence Review (rgate-006) |

---

## 4. Accepted Architecture Baseline (through Phase 4)

- **Philosophy:** architecture approved before implementation; the substrate changes, the constitutional model does not (Architecture Freeze, ST-DEC-2026-016).
- **Server-side derivation:** canonical derivation executes server-side; the browser computes only for verification/offline; a client snapshot is never authoritative (pass-through alternative removed).
- **`StorageAdapter` seam:** the single client persistence interface the UI/derivation depend on.
- **`RemoteAdapter`:** implements the seam over the governed API with automatic optimistic concurrency; **`LocalAdapter`** (IndexedDB) remains the offline/demo path; an **adapter selector** chooses by `VITE_SCS_API_BASE`.
- **Persistence architecture:** MySQL, one table per governed collection; JSON `data` body + server-owned metadata; generated FK columns per the integrity matrix.
- **Governed commands:** authority transitions occur only through commands (propose/submit/activate/accept/…); `authorityStatus`/acceptance/activation cannot change via raw document replacement.
- **Authority separation:** Product Owner is the sole approval authority; agents propose; admin does ops, not constitutional authority.
- **Derivation boundary:** server canonical; client advisory; version-stamped, reproducible from records.
- **Review architecture:** every deliverable passes a Review Gate requiring Product Owner disposition.
- **Implementation boundaries:** no production auth/data/deploy without separate authorization.

---

## 5. Accepted Implementation Baseline (following Phase 5)

**Implemented (accepted):**
- **Frontend** — React 18 + TypeScript + Vite static build (HashRouter); pages: SCS Home, Executive Snapshot, Team Command Center, Agent Onboarding, Constitutional Register, Standing Directives, Assignment Directives, Deliverables, Review Gates, Operational History, Products, Publications, Artifact Registry, Settings.
- **Client persistence** — `StorageAdapter` seam; `LocalAdapter` (Dexie/IndexedDB); `RemoteAdapter` (fetch, optimistic concurrency, idempotency, structured errors); adapter selector; in-memory API contract mirror (test double).
- **Backend (Slim 4 PHP)** — `Config`, `Database` (PDO), `Repository`, `Commands` (governed upsert + idempotency + 409), `Importer` (validated import), `Http`; routes for reads, commands, admin import/export/guarded-reset, derivation seam, health.
- **MySQL** — 23-table schema, generated FK columns, versioning/timestamps/archival; deterministic migration runner.
- **Import tooling** — dry-run validation, schema-version check, duplicate detection, integrity report, counts + hash, transactional apply/rollback.
- **Testing & CI** — frontend vitest suite; PHPUnit backend tests; env-gated e2e (real RemoteAdapter ↔ real backend); GitHub Actions runtime verification (PHP 8.2 + MySQL 8).
- **Build system** — Vite static build; no Node.js runtime in production.
- **Runtime verification** — executed and green in CI.

**Planned (not implemented / not authorized):** authentication/authorization, notifications (email/Web Push), scheduled workers, full PHP derivation port, production deployment, hosting migration, confidential-data handling.

---

## 6. Database Baseline

- **Schema philosophy:** one table per governed collection; typed record as JSON `data` + server-owned metadata; generated columns for indexed/foreign fields so the generic repository writes only `data`.
- **Table inventory:** 23 tables — osSystems, products, publications, publicationPhases, gates, decisions, canonicalStatements, canonicalConcepts, aiCollaborators, assignments, benchmarks, risks, updates, artifacts, reviewItems, nextActions, relationships, standingDirectives, assignmentDirectives, deliverables, operationalHistory, teams, teamMemberships (+ `schema_migrations`).
- **Relationships:** hard FKs across the constitutional trace (Agent→SD→ADR→Deliverable→Gate; Team↔Membership); intentional soft references for pending-canonical-id links and append-only Operational History.
- **Versioning:** `version` + `created_at`/`updated_at` per row.
- **Optimistic concurrency:** `expectedVersion` checks; stale writes → 409.
- **Migration strategy:** ordered, tracked, repeatable, dev-only reset.
- **Archival:** `archived` flag; governed history never hard-deleted in production.
- **Import strategy:** validated, transactional, PO-confirmed for production (not exercised in Phase 5).

---

## 7. Testing Baseline (current pass counts — not fabricated)

- **Frontend (vitest, local + CI):** **39 passing** — `derivation.test.ts` (16), `authority.test.ts` (4), `onboarding.test.ts` (12), `remoteAdapter.parity.test.ts` (7). Plus **`remoteAdapter.e2e.test.ts` (5)** — skipped locally, **executed in CI** against the real backend.
- **Backend (PHPUnit, executed in CI against real MySQL):** **8 tests** — migration/table creation, upsert/get/update, optimistic-concurrency 409, idempotency, FK rejection, transaction rollback, import dry-run/apply, schema-mismatch rejection.
- **Migration verification:** executed in CI (schema applies; status).
- **Runtime verification:** executed & green in CI (GitHub Actions run `30168236724`, commit `2ae3a64`) — end-to-end RemoteAdapter ↔ real PHP/MySQL.
- **Build verification:** `tsc` clean; `vite build` succeeds.

Future metrics are not asserted here.

---

## 8. Product Boundaries (intentional, not omissions)

Not yet implemented **by design/authorization**: authentication; authorization/roles; notifications (email/Web Push); deployment; external integrations; production hosting; confidential-data handling; operational (non-Product-Owner) users. Each is a governed future phase, not an accidental gap.

---

## 9. Accepted Governance Model

Objects and their relation:

```
Product Owner Directive
   → Assignment Directive (ST-ADR)  — governs one assignment for an agent
        → Deliverable (ST-DLV)       — the produced artifact
             → Review Gate           — Product Owner disposition point
                  → Product Owner Disposition (Approve / Conditions / Return / Reject / Defer)
   → Decision (ST-DEC)               — the governing ruling / authority
   → Operational History (ST-OPH)    — append-only evidence of what happened
   → Product Record                  — derived product/portfolio status
   → Activity History / Change History — the visible trail
```

The Product Owner is the sole approval authority; #SCS implements; #SOS governs; the derivation engine reports the state approved evidence supports.

---

## 10. Product Records Inventory (current statuses — closed records not reopened)

- **Agents (AGENT-001…006):** #CIA (Available), #CKL-R (Available/assigned) activated; #SOS/#SCS/#CKL/#CKP Pending activation.
- **Standing Directives:** ST-SD-001…006 (Current).
- **Assignment Directives:** ST-ADR-2026-001/002/003 (Closed — accepted); reconciliation directive (Closed — accepted; ST-ADR id Product-Owner-pending); ST-ADR-2026-005 (#CKL-R research, Active); Phase 4 (Closed — accepted; id pending); Phase 5 (Closed — completed & accepted; id pending).
- **Deliverables:** ST-DLV-2026-001…006 (Phase 1/2/3 accepted; ST-DLV-2026-005 accepted; ST-DLV-2026-006 accepted).
- **Review Gates:** rgate-001…006 (Team Command Center, Phase 2, Reconciliation, Competitive Research (open — pending #CKL-R deliverable), Production Architecture (closed), Backend Foundation & Persistence (closed)).
- **Decisions:** ST-DEC-2026-001…016 (approved; 001/003/005 pending detail confirmation) + `dec-cklr-activation`, `dec-cklr-research-assignment`, `dec-scs-phase4`, `dec-scs-phase5` (approved; canonical ST-DEC ids Product-Owner-pending).
- **Teams / Memberships:** TEAM-001, TEAM-002; TM-001…009.
- **Operational History:** ST-OPH-2026-001…012 (006–009 Pending / non-authoritative).
- **Products:** prod-scs (SCS Platform), prod-kidlytics, prod-civicai.

---

## 11. Implementation Traceability

```
Accepted Product Owner Directive → Implemented Component → Verification → Acceptance
Phase 0 architecture      → stack/data-model/deploy path         → docs review        → Approved (upd-phase0)
Phase 1 functional shell  → SCS Home/Snapshot/Team Command Center → demonstration      → Accepted (ST-OPH-2026-001)
Phase 2 derivation engine → deriveAgentState/deriveTeam + tests   → 16 derivation tests→ Accepted (a773bd6 / ST-OPH-2026-010)
Phase 3 onboarding        → onboarding workspace + #CKL-R records  → onboarding tests   → Accepted
Phase 4 architecture      → PHASE_4 docs (+ Rev 2 corrections)     → #SOS/PO review     → Accepted (ST-DLV-2026-005)
Phase 5 backend/persist   → Slim4 + MySQL + RemoteAdapter + import → CI runtime verify  → Accepted (ST-DLV-2026-006)
```

---

## 12. Current Limitations

**Accepted limitations (by authorization):** Phase 6 not authorized; authentication absent; authorization absent; production deployment absent; confidential data unsupported; public availability absent; operational users absent.
**Pending (not a defect):** Nestify hosting capability verification (needs host account access; ruled non-blocking).
**Known issues:** none open — the one runtime defect found (FastRoute route-order shadowing) was fixed and re-verified green.

---

## 13. Technical Debt Register

| Item | Class |
| --- | --- |
| Full PHP port of the derivation engine (Phase 5 delivered the seam only) | Deferred (sequenced) |
| Canonical ST-ADR / ST-DEC identifiers for recent phases are Product-Owner-pending | Product Owner decision |
| Nestify hosting capabilities unverified | Deferred (needs access) |
| Composer lockfile not committed (CI uses `composer update`) | Future enhancement |
| Server-side Technical Audit Log is a seam (Phase 6 fills it out) | Intentional (phased) |
| Notifications/workers scaffolded only | Intentional (phased) |

No implementation speculation beyond the above.

---

## 14. Open Product Owner Decision Queue (not resolved here)

1. Assign canonical **ST-ADR** identifiers (reconciliation directive; Phase 4 adr-006; Phase 5 adr-007; recommended -004/-006/-007).
2. Assign canonical **ST-DEC** identifiers (`dec-cklr-activation`, `dec-cklr-research-assignment`, `dec-scs-phase4`, `dec-scs-phase5`).
3. Confirm details of ST-DEC-2026-001 / 003 / 005 (pending confirmation).
4. **Nestify** hosting capability verification.
5. **Phase 6** authorization (auth/roles/permissions).
6. Whether to complete the **server-side derivation port** before or within Phase 6.
7. Disposition of the reserved **ST-OPH-2026-006…009** and AGENT-001…004 activation history.
8. #CKL-R competitive-research deliverable review (when delivered).

---

## 15. Lessons Learned (Phases 4–5)

- **Governance:** independent per-phase gates + explicit dispositions kept scope honest and reversible.
- **Verification:** *executing* the backend caught a real HTTP-routing defect that unit tests (hitting the repository directly) could not — runtime verification is not optional.
- **Parity:** a stable `StorageAdapter` seam made the local→remote migration an adapter swap, not a rewrite; contract parity was provable.
- **Persistence:** JSON `data` + generated FK columns preserved the model without new entities (freeze intact) while the DB still enforced integrity.
- **Runtime validation:** where the local environment lacks a runtime, CI with the real stack is the honest way to produce executed evidence.
- **Implementation discipline:** authority displayed never manufactured; identifiers not originated; records never silently rewritten.

---

## 16. Recommended Next Roadmap (recommendation only — no work begun)

**Should precede Phase 6:** (a) complete the **PHP derivation port** with golden-fixture parity (removes the last "seam-only" area before auth), and (b) **Nestify capability verification**. **Then Phase 6 — Auth, Roles & Permissions** (separately gated); **no confidential production data before the auth boundary is accepted.** **Can wait:** integrations (Phase 7), validation-at-scale (Phase 8), deployment (Phase 9), canonical-identifier assignment (any time, Product Owner).

---

## 17. Baseline Principles (future implementation must preserve)

1. Architecture approved before implementation.
2. Product Owner is the sole approval authority.
3. All work flows through governed records.
4. Complete traceability (directive → component → verification → acceptance).
5. Implementation neutrality where appropriate (substrate changes, constitutional model does not).
6. No constitutional/architecture change without Product Owner approval (freeze).
7. Authority is displayed, never manufactured; identifiers never self-originated.
8. Each phase independently gated; nothing begins automatically.

---

## 18. Baseline Integrity Statement

**This SCS Production Baseline v1.0 represents the complete accepted state of SCS following Phase 5 and serves as the authoritative comparison point for every future Product Owner review.** It documents the accepted architecture, implementation, database, testing, governance, records, limitations, and open decisions as of snapshot commit `4e57b39`. No implementation beyond the accepted Phase 5 baseline occurred in its preparation, and no accepted governance record was altered.

---

## Review

Submitted to **SCS Production Baseline v1.0 Review** (Product Owner authority). Acceptance of this baseline **does not authorize Phase 6**.
