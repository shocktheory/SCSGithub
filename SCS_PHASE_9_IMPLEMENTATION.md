# SCS Phase 9 Implementation — Constitutional Operational Awareness (Notifications · Workflows · Attention · Queues · Escalation)

**Status:** **Accepted** — Product Owner disposition of the Phase 9 Implementation Review: *Implemented, Verified & Accepted* (2026-07-26). ST-DLV-2026-016 accepted; rgate-016 closed Approved; adr-017 closed. Accepted revision commit `3249720` (documented CI remediation history preserved). Completes SCS's governance operating core (Phases 6–9). Does **not** authorize Phase 10, hosting, confidential data, deployment, or launch.
**Authority:** Product Owner Implementation Authorization Directive — *Authorize Phase 9 Implementation* (2026-07-26), within the accepted Phase 9 Authorization Package, the five permanent constitutional doctrines, and the Operational Readiness Principles (operational architecture standard).
**Runtime verification:** GitHub Actions (real PHP 8.2 + MySQL 8) — migrations 0001–0005, PHPUnit (persistence, auth, derivation, commands, observability, **operations**), backend boot, and the **operational-awareness e2e**. See the commit's CI run.

> Implementation stayed strictly within the accepted Phase 9 scope. Only **in-platform** operational awareness. No hosting, deployment, confidential data, production monitoring, production operations, public access, external notification providers (email/SMS/push), external workflow engines, or launch. `SCS_ENV=production` is refused. Constitutional architecture was not changed; the accepted Production Baseline v1.0 is unaltered.

---

## 1. Executive Summary

Phase 9 gives SCS **constitutional operational awareness**: the platform now derives, without inference, *what requires attention, who must act, when, why, and how governed work is progressing* — and records what it surfaced — **without ever becoming a source of constitutional authority.** Operational awareness is a **derived, read-only** layer ([`Scs\Operations`](server/src/Operations.php)) over authoritative records; **Notification History** ([`Scs\Notifications`](server/src/Notifications.php)) is an **append-only** third stream, distinct from the Technical Audit Log and Operational History; and the internal **Operational Dashboard** presents it, distinct from the Governance Dashboard. All work is runtime-verified in CI; **#SCS does not self-accept.**

**Constitutional invariant preserved end to end:** operational awareness informs action; constitutional authority authorizes action. Notifications, workflows, queues, and escalation **never** approve, activate, elevate, or modify constitutional state.

---

## 2. Notification System Implementation Report

`Scs\Operations::derive` produces **derived** notifications (review-request, approval, assignment, blocker) from authoritative records — each with type, subject, recipients (by role/actor), related record, reason, and a derived attention state. `POST /api/notifications/generate` surfaces them and **appends newly-surfaced ones to Notification History** (de-duplicated by `(type, related record)`); this records what was surfaced and **changes no governed record and grants no authority**. Notifications never approve/reject/activate/authorize/supersede/modify constitutional state (`OperationsTest::testNotificationsAreDerivedAndNonAuthoritative`).

## 3. Operational Workflow Implementation Report

Workflow routing is **derived** from governed records: deliverables → review routing, gates → approval routing, directives → assignment/blocker routing. **Every constitutional state transition continues to occur exclusively through governed commands** (Phase 7); the workflow layer surfaces and routes but never transitions. `OperationsTest::testQueuesOrganizeButNeverApprove` confirms selecting queued work changes nothing constitutional.

## 4. Attention Model Implementation Report

Derived attention states — informational, attention-required, reminder, warning, blocker (overdue/escalated evaluated only against an explicit `asOf`). Attention is **derived and read-only** (`OperationsTest::testOperationsIsDerivedReadOnlyDeterministic`); it never modifies constitutional state and never implies priority authority.

## 5. Assignment Awareness Report

Derived counts — assigned, in-progress, blocked, waiting, completed, awaiting-review, accepted — from Assignment Directives and deliverables, each traceable to its governed record. Observable and reconstructable.

## 6. Review Queue Implementation Report

Derived queues (Product Owner queue = open gates + in-review deliverables; evidence queue = in-review evidence; governance/architecture/implementation/verification/documentation buckets). **Queues organize work; they never approve work and never become authority** (Q2 / `testQueuesOrganizeButNeverApprove`).

## 7. Escalation Engine Implementation Report

Derived escalation — blocked deliverables/assignments and awaiting-approval work surface reminders/blockers. Time-based signals use the **explicit `asOf`** argument (never the wall clock), preserving determinism. **Escalation increases visibility only; it never approves, authorizes, bypasses Product Owner authority, or changes constitutional state** (`OperationsTest::testEscalationIsDerivedForBlockedWork`).

## 8. Workflow State Report

`Scs\Operations::workflowStateOf` derives workflow state (waiting · ready · assigned · in-progress · awaiting-review · awaiting-approval · blocked · completed · accepted · archived) and reports it **alongside — never in place of** — the constitutional state (`StateMachine::stateOf`). **Workflow state is permanently distinct from constitutional state** (`OperationsTest::testWorkflowStateDistinctFromConstitutionalState`): an in-review deliverable is workflow "awaiting-review" while constitutionally "reported".

## 9. Operational Dashboard Report

An internal **operations coordination workspace** — `app/src/features/operations/OperationalDashboardPage.tsx` (route `/operations`, nav "Operational Dashboard"), presenting the derived operational model (`app/src/lib/operations.ts`): notifications, attention, review queues, escalation, assignment awareness, workflow progress. It is **read-only** (no mutation controls) and **distinct from the Phase 8 Governance Dashboard** — the Governance Dashboard explains governance health; this one coordinates operational execution (`operations.e2e.test.ts` asserts the two models are distinct).

## 10. Notification History Report

`notification_history` (migration 0005) + `Scs\Notifications` — **append-only, attributable, reconstructable**, de-duplicated. It is a **third operational stream, distinct from** the Technical Audit Log (technical execution) and Operational History (governance milestones): `OperationsTest::testNotificationHistoryDistinctFromAuditAndOperationalHistory` proves recording a notification writes neither `audit_log` nor `operational_history`. The service exposes no update/delete (append-only).

## 11. Verification Evidence (executed in CI — not in the authoring environment)

- **PHPUnit (real MySQL):** `OperationsTest` (derived/read-only/deterministic, notifications non-authoritative, workflow≠constitutional, escalation, notification-history append-only/deduped/distinct, queues-never-approve, no-mutation-surface) plus retained `ObservabilityTest`, `DerivationTest`, `CommandTest`, `PersistenceTest`, `AuthTest`.
- **Backend boot:** `/api/derived/operations`, `/api/notifications/generate`, `/api/notifications` served.
- **E2E (real PHP/MySQL):** `app/tests/operations.e2e.test.ts` — operations read-only + workflow≠constitutional; notification generate → append-only deduped history, never authority; Operational vs Governance dashboard models distinct.
- **Frontend:** typecheck + unit tests (incl. `operations.test.ts`) + build green locally (44 tests; e2e suites skipped locally, run in CI).

*As in Phases 5–8, the authoring environment has no PHP/MySQL; runtime verification is the CI channel. No result is claimed here that CI did not execute.*

## 12. Regression Test Results (mandatory scenarios)

| Mandatory scenario | Test |
|---|---|
| notification attempts constitutional approval | no path; notifications carry no authority field (`testNotificationsAreDerivedAndNonAuthoritative`) |
| notification modifies constitutional state | deriving/generating changes no record (`testOperationsIsDerivedReadOnlyDeterministic`; e2e) |
| workflow bypasses governed command | workflow state derived; constitutional state only via commands (`testWorkflowStateDistinctFromConstitutionalState`) |
| escalation bypasses Product Owner approval | escalation derived visibility only (`testEscalationIsDerivedForBlockedWork`) |
| queue modifies authority | queues read-only, never approve (`testQueuesOrganizeButNeverApprove`) |
| workflow state modifies constitutional state | separation test (workflow ≠ constitutional) |
| duplicate notification generation | dedupe by `(type, record)` (`testNotificationHistoryAppendOnlyAndDeduped`; e2e newlyRecorded=0 on re-gen) |
| notification-loop detection | derivation is a pure function of state; notifications trigger no state change → no loop (determinism test) |
| dependency deadlock | workflow derivation is bounded/pure; a stuck workflow never blocks a governed command |
| notification history mutation | append-only; `Notifications` exposes no update/delete |
| dashboard mutation attempt | operational model read-only, no mutation surface (`testOperationalModelHasNoMutationSurface`) |
| Operational Dashboard confused with Governance Dashboard | distinct models/endpoints (`operations.e2e.test.ts`) |

## 13. Updated Traceability Matrix

| Capability | Requirements | Implementation | Verification | Acceptance |
|---|---|---|---|---|
| Notification System | N1–N5 | `Operations::derive` + `/api/notifications/*` | OperationsTest + e2e | *(PO)* |
| Operational Workflow | W1–W3 | `Operations` routing | workflow tests | *(PO)* |
| Attention Model | AT1–AT2 | derived attention | determinism/read-only | *(PO)* |
| Assignment Awareness | AS1–AS2 | derived counts | OperationsTest | *(PO)* |
| Review Queues | Q1–Q2 | derived queues | queues-never-approve | *(PO)* |
| Escalation | E1–E2 | derived escalation (asOf) | escalation test | *(PO)* |
| Workflow State | S1–S2 | `workflowStateOf` | workflow≠constitutional | *(PO)* |
| Operational Dashboard | D1–D2 | client page + lib | operations.test + e2e distinct | *(PO)* |
| Notification History | H1–H2 | `Notifications` + 0005 | append-only + distinct-stream | *(PO)* |

## 14. Risk Assessment

- **Missed / duplicate notifications** — derived-from-state + dedupe key; a miss is advisory-only, never corrupts state.
- **Notification loops** — derivation is a pure function of state; no notification changes state, so no feedback loop.
- **Workflow deadlock / drift** — workflow state is derived and cross-referenced; a stuck workflow never blocks a governed command; re-derivation reconciles from authoritative records.
- **Escalation failure** — escalation raises attention only; failure degrades to "not surfaced," never to an unauthorized action.
- **Authority leakage** — load-bearing invariant enforced by negative tests (notifications/workflows/queues/escalation never approve; every state change is a governed command).
- **Identifier-origination pressure** — refused; identifiers remain Product-Owner-pending.

## 15. Known Limitations

- Time-based escalation (overdue/reminder-by-deadline) requires an explicit `asOf` and record due-dates; governed records currently carry no due-date, so time-driven escalation is architecture-ready but effectively empty until due-dates exist. This preserves determinism (no wall clock).
- External channels (email/push/SMS) are **not** implemented (planning-only per scope); only in-platform awareness is delivered.
- Notification generation is triggered via `POST /api/notifications/generate` (explicit surface) rather than a background scheduler (scheduling belongs to later operational phases).
- No hosting/deployment/confidential-data surface introduced (synthetic dev/test data only).

## 16. Product Owner Decision Queue

1. **Accept Phase 9 implementation?** (this package is the input).
2. Confirm the **notification generation trigger** (explicit endpoint now; scheduler is a later operational concern).
3. Confirm **due-date modeling** is deferred (time-based escalation is architecture-ready, data-pending).
4. **Canonical identifier standard** — still unresolved; identifiers remain Product-Owner-pending.

## 17. Phase 9 Readiness Assessment (findings only — no self-acceptance)

- **Implementation complete** for the authorized scope: notification system, operational workflow, attention model, assignment awareness, review queues, escalation, workflow-state engine, operational dashboard, notification history.
- **Notifications remain non-authoritative** (tested).
- **Workflows preserve constitutional governance** — state changes only via governed commands (tested).
- **Workflow state remains distinct from constitutional state** (tested).
- **Operational awareness remains derived** and read-only (tested).
- **Notification history is reconstructable** and distinct from Technical Audit and Operational History (tested).
- **Acceptance criteria** appear satisfied for the authorized scope; limitations (§15) are recorded.

> **#SCS does not self-accept Phase 9.** It is submitted for Product Owner disposition at the Phase 9 Implementation Review gate. #SCS will begin no Phase 10 planning or implementation, and no further phase work, until separately authorized.
