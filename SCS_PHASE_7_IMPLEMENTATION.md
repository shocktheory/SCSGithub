# SCS Phase 7 Implementation — Server-Side Constitutional Derivation & Canonical State Authority

**Status:** **Accepted** — Product Owner disposition of the Phase 7 Implementation Review: *Implemented, Verified & Accepted* (2026-07-25). ST-DLV-2026-012 accepted; rgate-012 closed Approved; adr-013 closed. Required Addition produced: GOVERNED_COMMAND_PRINCIPLES.md (completing the constitutional trilogy). Does **not** authorize Phase 8, confidential data, hosting, deployment, or launch.
**Authority:** Product Owner Implementation Authorization Directive — *Authorize Phase 7 Implementation* (2026-07-25), within the accepted Phase 7 Authorization Package, Authentication & Authority Principles, and Constitutional Derivation Principles.
**Runtime verification:** GitHub Actions (real PHP 8.2 + MySQL 8) — migrations 0001–0003, PHPUnit (persistence + auth + derivation + commands), backend boot, and the client/server derivation **parity** e2e. See the commit's CI run.

> Implementation stayed strictly within the accepted Phase 7 scope. No notifications, hosting, deployment, confidential data, Technical Audit Log (Phase 8), monitoring, production, public access, launch, or external integrations. `SCS_ENV=production` is refused. Constitutional architecture was not changed; the accepted Production Baseline v1.0 is unaltered.

---

## 1. Executive Summary

Phase 7 makes the **server the sole constitutional authority for derived platform state**. The constitutional derivation that previously ran on the client (`deriveAgentState`, `deriveTeam`) is now a **canonical server engine** (`Scs\Derivation`), deterministic and versioned, with its output pinned to the (now presentation-only) client engine by end-to-end **parity** tests. The governed command vocabulary is complete (`propose · approve · accept · activate · reject · supersede · archive · restore · retire`) on a **server-validated state machine**, preserving the Product-Owner-only approval boundary from Phase 6. Derivation is deterministic, reproducible, explainable, versioned (independent `derivation_version` / `schema_version`), and replayable, with a persistence store for replay and drift detection. All work is runtime-verified in CI; **#SCS does not self-accept.**

**Constitutional principle preserved end to end:** the server derives · the client presents · the Product Owner approves.

---

## 2. Constitutional Derivation Implementation Report

**Engine:** `server/src/Derivation.php` (`Scs\Derivation`).

- **Inputs (authoritative records only):** agents, standing directives, decisions, assignment directives, operational history, teams, team memberships, deliverables, gates. No client-supplied state is ever a derivation input.
- **Outputs:** per-agent constitutional state (`deriveAgentState`) and the whole-team roll-up (`deriveTeam`), each carrying an explainable `trace` (source records + logic) and stamped with `derivation_version` + `schema_version`.
- **Determinism (Principle: deterministic):** the engine is a pure function of `(inputs, derivation version)`. No wall-clock, randomness, locale, or environment influences output. `DerivationTest::testDerivationIsDeterministic` asserts identical inputs → identical output.
- **Reproducibility / replay (Principle: reproducible):** `inputHash()` = SHA-256 over recursively key-sorted canonical JSON + derivation version; stable for identical inputs and sensitive to any change. `GET /api/derived/team` and `POST /api/derived/agent-state` persist their output (`derivations` table); `POST /api/replay` recomputes and reports `reproduced` (drift detection).
- **Explainability (Principle: explainable):** every derived agent state includes `trace.sourceRecords` and `trace.logic`.
- **Ownership:** derivation is computed and served only by the server; there is no endpoint by which a client authors a derived output.
- **Fidelity:** the PHP engine is a faithful port of `app/src/lib/derivation.ts` + `team.ts`, verified byte-for-byte against the client by `app/tests/derivation.e2e.test.ts`.

## 3. Canonical State Authority Report

- **Authoritative state** (server-owned, authority-bearing) vs **derived state** (server-computed) vs **presentation state** (client-only) is enforced structurally: authority fields change only through governed commands + Product Owner approval; derived state is computed only by the server; presentation stays on the client (see Migration Ledger).
- **Prohibited client authority:** clients cannot set `authorityStatus` to an elevated value via `propose`/`upsert` (403 — approval boundary), and cannot author derived state (no such endpoint).
- **Immutable vs mutable:** accepted/closed history is preserved; `supersede`/`archive`/`retire` never hard-delete governed history — they mark lifecycle state and (for archive/retire) set the archived flag.

## 4. Governed Command Implementation Report

**Dispatcher:** `server/src/Commands.php`; **state machine:** `server/src/StateMachine.php`.

| Command | Authority required | Permitted from | Effect |
|---|---|---|---|
| `propose` | propose (agent/PO) | (none)/reported/proposed/rejected | write non-elevated record |
| `approve` | **Product Owner (fresh MFA)** | reported/proposed | `authorityStatus=approved` |
| `accept` | **Product Owner** | approved | acceptance flag |
| `activate` | **Product Owner** | approved/accepted | activation flag |
| `reject` | PO if approved; else proposer | reported/proposed/approved | `lifecycleState=rejected` |
| `supersede` | **Product Owner** | approved/accepted/activated | `lifecycleState=superseded` |
| `archive` | administrator/PO | any inactive/terminal | archived + `lifecycleState=archived` |
| `restore` | administrator/PO | archived | un-archive |
| `retire` | **Product Owner** | archived/superseded/rejected | retired + archived |

Every command **validates authority → validates current state (transition legality) → enforces the approval boundary → checks optimistic concurrency (`expectedVersion`) → applies idempotency → preserves attribution** (actor + request id), and records an auth event for approval commands. No command bypasses server validation. The Phase 6 `approve` API (optional `transition`) is preserved on top of the new machinery (backward compatible).

## 5. Client Migration Report

See **[MIGRATION_LEDGER.md](MIGRATION_LEDGER.md)** (permanent artifact). Summary: the two **constitutional** derivations — agent state (#1) and team roll-up (#2) — are now **server-canonical**, with the client engine retained as presentation only and pinned to server output by parity tests. Onboarding's constitutional core (#3) is server-canonical via #1; its presentation model remains client-side (deferred server view recorded in the ledger). Kidlytics publication helpers and UI tone/format mappers (#4–#6) are **presentation-only and correctly stay client-side**. The ledger stays **open** until the presentation remainder + deferred onboarding view are addressed.

## 6. Derivation Version Report

- **Two independent versions:** `derivation_version` (rules; `Scs\Derivation::DERIVATION_VERSION = 1.0.0`) and `schema_version` (record/output shape; `Repository::SCHEMA_VERSION`). They are never merged.
- **Compatibility:** `assertCompatible()` accepts same-major versions and rejects incompatible ones with a predictable `409` (`VersionException`), covered by `DerivationTest` and the e2e `409` regression.
- **Migration / replay / historical derivation:** the `derivations` store (migration 0003) keys outputs by `(view, input_hash, derivation_version)`, enabling replay and drift detection; history recorded under a prior version is never silently reinterpreted.
- **Deterministic regeneration:** guaranteed by the pure-function engine + canonical hashing; `CommandTest::testReplayReproducesStoredDerivation`.

## 7. State Transition Report

`StateMachine::TRANSITIONS` enumerates permitted source states per command; anything else is a **prohibited transition** that fails predictably with `422` (`TransitionException`) before any write. `stateOf()` computes the composite constitutional state (terminal lifecycle > activated > accepted > authorityStatus). Every transition validates current state, authority, preconditions, version, and concurrency. Approval-gated edges (`approve/accept/activate/supersede/retire`) are Product-Owner-only.

## 8. Verification Evidence (executed in CI — not in the authoring environment)

- **PHPUnit (real MySQL):** `DerivationTest` (determinism, reproducibility, version governance, constitutional correctness, team derivation), `CommandTest` (full vocabulary + regressions + replay/drift), plus the retained `PersistenceTest` and `AuthTest`.
- **Backend boot:** `php -S` front controller; `/api/health`, `/api/derivation/version`, `/api/derived/team`, `/api/derived/agent-state`, `/api/replay` served.
- **E2E parity (real PHP/MySQL):** `app/tests/derivation.e2e.test.ts` asserts server derivation === client engine per fixture; replay `reproduced=true`; version-mismatch `409`; team view server-sourced.
- **Frontend:** typecheck + unit tests + build green locally (39 tests; e2e suites skipped locally, run in CI).

*As in Phases 5–6, the authoring environment has no PHP/MySQL; runtime verification is the CI channel on real PHP 8.2 + MySQL 8. No result is claimed here that CI did not execute.*

## 9. Regression Test Results (mandatory scenarios)

| Mandatory scenario | Test |
|---|---|
| client attempts constitutional derivation | no client-authoring endpoint; team view `source:server` (e2e) |
| client attempts authority mutation | `CommandTest::testClientAuthorityMutationViaWriteRejected` (403) |
| unauthorized command execution | `CommandTest::testUnauthorizedCommandDenied` (401/403) |
| invalid transition | `CommandTest::testInvalidTransitionRejectedPredictably` (422) |
| replay validation | `CommandTest::testReplayReproducesStoredDerivation`; e2e replay |
| stale derivation | drift detection via `derivations` store (`reproduced`) |
| stale version | `CommandTest::testConcurrencyConflict` (409) |
| mismatched derivation version | `DerivationTest::testIncompatibleDerivationVersionThrows`; e2e 409 |
| schema incompatibility | `DerivationTest::testIncompatibleSchemaVersionThrows` |
| duplicate command execution | `CommandTest::testDuplicateCommandDoesNotDoubleApply`; idempotency replay |
| concurrency conflict | `CommandTest::testConcurrencyConflict` (409) |
| derivation drift | replay `reproduced` equality on canonical output |

## 10. Updated Traceability Matrix

| Capability | Requirements | Implementation | Verification | Acceptance |
|---|---|---|---|---|
| Server-side derivation | D1–D9 | `Derivation.php` | DerivationTest + e2e parity | *(PO)* |
| Canonical state authority | A1–A5 | Commands/Authz/Repository | CommandTest (403 boundaries) | *(PO)* |
| Governed command architecture | C1–C5 | `Commands.php` + `StateMachine.php` | CommandTest | *(PO)* |
| Client/server responsibility | M1–M2 | MIGRATION_LEDGER.md | ledger + parity | *(PO)* |
| Derivation version governance | V1–V5 | `Derivation` versions + `derivations` (0003) | DerivationTest + replay | *(PO)* |
| State transition model | T1–T4 | `StateMachine.php` | CommandTest (422) | *(PO)* |
| Parity | P1–P4 | e2e fixtures + replay | derivation.e2e.test.ts | *(PO)* |
| Failure handling | F1–F3 | concurrency/idempotency/recompute | CommandTest | *(PO)* |
| Security review | S1–S2 | §11 | analysis + scope | *(PO)* |

## 11. Risk Assessment

- **Architectural:** incomplete migration would perpetuate client authority — mitigated by the ledger + parity tests + server-source assertions. Hidden nondeterminism — mitigated by the explicit-input rule + determinism tests.
- **Operational (deferred):** recompute cost / cache staleness — the `derivations` store + inputHash keys support caching/invalidation; production operationalization is a later phase (not Phase 7).
- **Governance:** authority elevation off the approval path — closed by the command architecture + approval-gated edges + Phase 6 boundary. Identifier origination — refused; all identifiers remain Product-Owner-pending.
- **Implementation:** behavioral drift from the accepted client derivation — parity tests gate every change. Security strengthened: server-sole authority narrows the authoritative surface to server-controlled, authorization-gated code (S1); no new confidential-data surface (S2 — synthetic dev/test data only).

## 12. Known Limitations

- Onboarding's presentation model is not yet a server view (constitutional core is server-canonical); recorded as deferred in the ledger.
- Derivation caching is persistence-backed but not yet invalidation-optimized for scale (architecture-level only; production operationalization is later).
- No client login/UI changes; the client continues to present. Technical Audit Log remains Phase 8 (attribution seam only).

## 13. Product Owner Decision Queue

1. **Accept Phase 7 implementation?** (this package is the input).
2. Confirm the **deferred onboarding server view** may remain deferred (ledger open) vs. be required now.
3. Confirm the **command authorization mapping** (archive/restore = administrator/PO; reject-of-approved = PO) matches intent.
4. **Derivation caching/operationalization** sequencing (Phase 7 = architecture + store; production caching later).
5. **Canonical identifier standard** — still unresolved; identifiers remain Product-Owner-pending.

## 14. Phase 7 Readiness Assessment (findings only — no self-acceptance)

- **Implementation complete** for the authorized scope: derivation engine, canonical state authority, full governed command vocabulary, state machine, version governance, replay/drift store, and client/server parity.
- **Derivation is deterministic and replay is deterministic** (tests).
- **Client/server parity achieved** for the constitutional derivations (agent state, team); presentation remainder recorded in the ledger.
- **Constitutional authority resides on the server** — the approval boundary is server-enforced and Product-Owner-only.
- **Acceptance criteria** appear satisfied for the migrated capabilities; the ledger documents the remaining presentation/onboarding items.

> **#SCS does not self-accept Phase 7.** It is submitted for Product Owner disposition at the Phase 7 Implementation Review gate. #SCS will begin no Phase 8 planning or implementation, and no further phase work, until separately authorized.
