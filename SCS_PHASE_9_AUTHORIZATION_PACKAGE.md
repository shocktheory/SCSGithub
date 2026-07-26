# SCS Phase 9 Authorization Package — Constitutional Operational Awareness (Notifications · Workflows · Attention · Queues · Escalation)

**Status:** Proposed (planning) — submitted to the **Phase 9 Authorization Package Review** gate.
**Authority:** Product Owner Authorization Directive — *Authorize Preparation of the SCS Phase 9 Authorization Package (Planning Only)* (2026-07-25).
**Derives from (accepted, authoritative):** SCS Production Baseline v1.0 · Completion Program Rev 2 · Phase 6, 7 & 8 Implementations · the five permanent doctrines (Authentication & Authority · Constitutional Derivation · Governed Command · Constitutional Evidence · Constitutional Observability Principles).
**Baseline of record:** SCS Production Baseline v1.0 (accepted; commit `a1b3a29`) — **not altered**.
**Prepared by:** #SCS (implementation; no constitutional authority — authorization and acceptance are Product Owner acts).

> **Planning and authorization preparation only.** This package authorizes **no** implementation. It creates **no** implementation-governed records, writes **no** code, performs **no** deployment, introduces **no** confidential data, makes **no** hosting decision, and begins **no** launch activity. Its sole purpose is to let the Product Owner decide whether Phase 9 should begin.

> **No new doctrine document.** Per the Phase 8 disposition — "the five-document constitutional doctrine set is complete; no additional doctrine documents should be added absent a genuinely new constitutional concept" — Phase 9 introduces **no** new constitutional concept. Operational awareness is a *derived, observable* capability that sits entirely inside the existing doctrines (especially the **Constitutional Observability Principles**: awareness observes and informs; it never becomes authority and never mutates constitutional state). This package therefore proposes no sixth companion. *(Update: at Product Owner acceptance of this package (2026-07-26), a separate **operational architecture standard** — [OPERATIONAL_READINESS_PRINCIPLES.md](OPERATIONAL_READINESS_PRINCIPLES.md) — was produced as a Required Addition. It is explicitly classified as an implementation architecture guide, NOT constitutional doctrine, and is subordinate to the five doctrines.)*

> **Constitutional constraints (reinforced throughout):** notifications/workflows/queues/reminders/escalations never create authority · operational awareness is derived and observable · workflow state is distinct from constitutional state · constitutional approval remains separate from operational workflow · planning does not authorize implementation · no phase self-approves · no phase automatically authorizes the next.

---

## 0. How to read this package

Phases 6–8 gave SCS a complete constitutional core: *who may act · how state is produced and changed · how it is observed and evidenced.* Phase 9 adds the **operational awareness** that lets the platform surface *what needs attention, who must act, when, and why* — and route governed work through reminders, queues, and escalation — **without ever letting any of that machinery approve, accept, activate, or elevate.** This package specifies that entire architecture before any code is authorized. Every section maps to a success question in §16. The single load-bearing invariant: **operational awareness informs action; it never is the action.**

---

## 1. Executive Overview — why operational awareness is a *constitutional* capability, not a notification system

A notification system pushes messages. **Constitutional operational awareness** is different in kind: it is the platform's *derived* understanding of its own governed work — what is assigned, pending, blocked, awaiting review or approval, overdue, escalated — surfaced so the right actor acts at the right time, and recorded so every operational event is attributable and reconstructable. Crucially, it is **read-only with respect to constitutional state**: a reminder cannot approve; a queue cannot accept; an escalation cannot activate.

Phases 6–8 make this both necessary and safe:

- **Necessary** — now that authority, derivation, and observability exist, the platform must help humans and agents *act* on governed work without inference: which deliverables await the Product Owner, which assignments are blocked, which reviews are overdue.
- **Safe** — because Phase 7 derivation is deterministic and Phase 8 observability is append-only and read-only, operational awareness can be built as *another derived, observable layer* that reads authoritative records and the governed-command/audit history, and never writes constitutional state.

The defining Phase 9 idea: **operational workflow is separate from constitutional authority.** Work can be routed, reminded, and escalated all day; a governed record changes state only through a Product-Owner-exercised governed command. This package holds that line throughout.

---

## 2. Mission

Establish **Constitutional Operational Awareness**: SCS must know, and be able to answer without inference — *what requires attention · who must act · when action is required · why it is required · how work progresses through governed workflows* — while operational awareness never weakens constitutional governance.

---

## 3. Scope Boundary (planning only)

**In scope (to be *defined*, not built):** the ten capability areas A–J in §4 — notification architecture, operational workflow architecture, attention model, assignment awareness, review queue architecture, escalation model, notification channels, workflow state model, operational dashboard, and notification history.

**Explicitly excluded from Phase 9 entirely** (later phases): hosting · deployment · confidential data · production monitoring · production operations · public access · launch · external notification integrations · external workflow systems · any Phase 10 capability.

**Initial-implementation channel constraint:** only **in-platform** operational awareness is considered for initial implementation. Email/push/SMS remain **planning considerations** unless separately authorized.

**Not permitted by this assignment:** any implementation; any implementation-governed record; any change to the accepted Production Baseline v1.0; any constitutional-architecture change on #SCS authority; any canonical-identifier origination.

---

## 4. Capability Breakdown (Domain → Capability → Requirements → Verification Evidence)

Phase 9 concentrates in the **Operations** domain (Notifications & Work Awareness; and completes more of Administration), and lifts **Governance** (operational routing of governed work) and **Quality**. Evidence columns define what Phase 9 *implementation* would later have to produce; **nothing is executed here.**

### 4.A Operations — Constitutional Notification Architecture *(primary Phase 9 capability)*

| # | Requirement | Verification evidence (to be produced at implementation) |
|---|---|---|
| N1 | Notification object model: type, subject, actor(s) to notify, related governed record, reason, timestamp | schema + populated events |
| N2 | Notification types: assignment, review request, PO action, approval, rejection, return-for-correction, completion, synchronization-required, governance event, readiness change | type coverage tests |
| N3 | Notifications are **derived** from authoritative records + governed-command/audit events (never an independent source of truth) | derivation trace; server-sourced |
| N4 | **Notifications never create constitutional authority** | a notification cannot set authorityStatus / trigger a transition (negative test) |
| N5 | In-platform delivery for initial implementation; external channels are configuration-only stubs | channel abstraction test |

### 4.B Operations — Operational Workflow Architecture

| # | Requirement | Verification evidence |
|---|---|---|
| W1 | Governed workflow routing: assignment, review, approval, escalation, reminders, blocked/waiting, dependency awareness, completion | routing tests over governed records |
| W2 | **Every workflow preserves constitutional authority** — routing proposes/surfaces; it never approves | routing cannot elevate (negative test) |
| W3 | Workflow actions map to governed commands where they change state (propose/…); routing itself changes nothing | workflow→command mapping |

### 4.C Operations — Attention Model

| # | Requirement | Verification evidence |
|---|---|---|
| AT1 | Attention states: attention-required, informational, reminder, warning, blocker, expired, escalated | enumerated + derived |
| AT2 | Attention states are **derived** and **never alter constitutional state** | read-only derivation test |

### 4.D Operations — Assignment Awareness

| # | Requirement | Verification evidence |
|---|---|---|
| AS1 | Identify assigned / pending / overdue / blocked / delegated / completed work from governed records | derived classification tests |
| AS2 | Assignment awareness is observable and traceable (links to the records + audit it derives from) | traceability |

### 4.E Governance/Operations — Review Queue Architecture

| # | Requirement | Verification evidence |
|---|---|---|
| Q1 | Review queues for: Product Owner, governance, architecture, implementation, verification, documentation, evidence | derived queues from gates/deliverables/records |
| Q2 | **Queues remain operational tools; they never become authority** | queue action cannot approve (negative test) |

### 4.F Operations — Escalation Model

| # | Requirement | Verification evidence |
|---|---|---|
| E1 | Escalation triggers, escalation authority, reminder timing, blocked-work handling, dependency escalation, timeout handling | escalation rule tests |
| E2 | **Escalation never bypasses constitutional approval** | escalation cannot approve/activate (negative test) |

### 4.G Operations — Notification Channels

| # | Requirement | Verification evidence |
|---|---|---|
| C1 | Channel abstraction: in-platform (initial), email/push/SMS (future, planning-only) | channel interface; only in-platform active |
| C2 | External channels require separate Product Owner authorization | scope gate documented |

### 4.H Operations — Workflow State Model

| # | Requirement | Verification evidence |
|---|---|---|
| S1 | Workflow states: waiting, ready, assigned, in-progress, awaiting-review, awaiting-approval, blocked, completed, accepted, archived | enumerated |
| S2 | **Workflow state is distinct from constitutional state** — the two are cross-referenced, never conflated | separation test (workflow state change never implies authority change) |

### 4.I Operations — Operational Dashboard

| # | Requirement | Verification evidence |
|---|---|---|
| D1 | Surfaces: assignments, pending reviews, blocked work, upcoming approvals, escalations, readiness, operational workload | derived read-only views |
| D2 | **Separate from the Phase 8 Governance Dashboard** (operations vs governance visibility) | distinct surface; both read-only |

### 4.J Operations/Trust — Notification History

| # | Requirement | Verification evidence |
|---|---|---|
| H1 | Notification events retained to support traceability + reconstruction; attributable | history store + query |
| H2 | **Distinct from Technical Audit Log and Operational History** (a third, operational stream), cross-referenced not duplicated | classification test |

---

## 5. Notification Architecture (specification)

**5.1 Position.** Notifications are a **derived, observable** layer over authoritative records + the Phase 8 audit/observability history. They read; they never write constitutional state. A notification is produced when derivation detects a state that warrants attention (a deliverable enters review → notify the Product Owner; an assignment becomes blocked → notify the actor).

**5.2 Model.** `id`, `type`, `subject`, `recipients` (by role/actor), `related_record` (collection/id), `reason` (derived), `attention` (§6.C), `created_at`, `channel` (in-platform initially), `read/acknowledged` (operational, not constitutional). Notifications reference the governed record and the audit event that occasioned them (traceability).

**5.3 Never authority (N4).** No notification, acknowledgement, or dismissal changes `authorityStatus`, acceptance, activation, or any governed transition. Acting on a notification means issuing a governed command (Phase 7) — the command, not the notification, changes state.

**5.4 Channels (G).** A channel abstraction supports in-platform now; email/push/SMS are planning-only stubs behind the same interface, activated only by separate Product Owner authorization.

## 6. Operational Workflow, Attention & Assignment Awareness

- **Workflow routing (B)** surfaces governed work to the right actor (assignment, review, approval, escalation, reminder) and, where an action changes state, routes it through a **governed command** — routing itself is inert with respect to authority (W2).
- **Attention model (C)** derives attention-required / informational / reminder / warning / blocker / expired / escalated from record + audit state. Derived, read-only (AT2).
- **Assignment awareness (D)** classifies assigned/pending/overdue/blocked/delegated/completed from Assignment Directives, deliverables, gates, and audit history — observable and traceable (AS2).

## 7. Review Queue & Escalation Architecture

- **Review queues (E)** are derived lists (PO / governance / architecture / implementation / verification / documentation / evidence) built from open gates, in-review deliverables, and pending decisions. A queue is a *view*; selecting an item never approves it (Q2).
- **Escalation (F)** applies governed triggers (reminder timing, blocked/dependency/timeout handling). Escalation raises visibility and attention; it **never** bypasses the Product-Owner approval boundary (E2). Escalation authority is itself bounded and attributable.

## 8. Workflow State Model (distinct from constitutional state)

Workflow state (waiting · ready · assigned · in-progress · awaiting-review · awaiting-approval · blocked · completed · accepted · archived) tracks *operational progress*. It is **cross-referenced with, but never conflated with, constitutional state** (authorityStatus / acceptance / activation / lifecycle from Phases 6–8). A workflow moving to "awaiting-approval" does not approve; only a Product-Owner `approve` command changes constitutional state (S2). This mirrors the Phase 8 Audit-vs-Operational-History discipline: two related layers, permanently distinct.

## 9. Operational Dashboard (experience specification)

An internal **operations workspace** — assignments, pending reviews, blocked work, upcoming approvals, escalations, readiness, operational workload — all **derived, read-only** views. It is **separate from the Phase 8 Governance Dashboard**: the Governance Dashboard answers "is governance healthy?"; the Operational Dashboard answers "what operational work needs attention and by whom?" Neither mutates state; neither is production monitoring.

## 10. Notification History Architecture

Notification events are retained to support traceability and reconstruction, each attributable to the derivation/record that produced it. Notification History is a **third operational stream, distinct from** the Technical Audit Log (technical execution) and Operational History (governance milestones) — cross-referenced, never duplicated (H2). It records *what was surfaced to whom and when*, not *what authority was exercised* (that stays in Audit/Operational History).

## 11. Threat & Risk Assessment

- **Missed / duplicate notifications** — derived-from-state (idempotent by record+event key) avoids duplicates; a missed surface never corrupts state (awareness is advisory).
- **Notification loops** — derivation is a pure function of state; no notification triggers a state change, so no feedback loop can form.
- **Workflow deadlocks / drift** — workflow state is derived and cross-referenced to constitutional state; a stuck workflow never blocks a governed command, and reconciliation re-derives from authoritative records.
- **Escalation failure** — escalation raises attention only; failure degrades to "not surfaced," never to an unauthorized action.
- **Notification fatigue / operational ambiguity** — attention model prioritization + the operational dashboard concentrate signal; every item traces to its governed source.
- **Authority leakage** — the load-bearing invariant: notifications/workflows/queues/escalations never approve; every state change is a governed command (negative tests N4/W2/Q2/E2/AT2).
- **Identifier-origination pressure** — refused; identifiers remain Product-Owner-pending.

## 12. Verification Strategy (defined; **not executed**)

At Phase 9 *implementation* (if authorized), the CI runtime channel would produce: **notification verification** (types, derivation-from-state, never-authority), **workflow verification** (routing, workflow≠constitutional-state), **escalation verification** (triggers, never-bypass-approval), **queue verification** (derived, never-authority), and **operational-awareness verification** (assignment awareness classification, attention model, notification history distinct from Audit/Operational History). Acceptance thresholds defined here; execution belongs to a separately-authorized implementation phase.

## 13. Traceability Matrix

| Capability | Requirements | Verification (defined) | Evidence at impl | Acceptance |
|---|---|---|---|---|
| Notification Architecture | N1–N5 | type + derivation + never-authority | notifications + CI | *(PO)* |
| Operational Workflow | W1–W3 | routing + never-elevate | workflow + CI | *(PO)* |
| Attention Model | AT1–AT2 | derived + read-only | derivation tests | *(PO)* |
| Assignment Awareness | AS1–AS2 | classification + traceability | derived views | *(PO)* |
| Review Queues | Q1–Q2 | derived + never-authority | queue tests | *(PO)* |
| Escalation | E1–E2 | triggers + never-bypass | escalation tests | *(PO)* |
| Notification Channels | C1–C2 | channel abstraction | interface + scope gate | *(PO)* |
| Workflow State Model | S1–S2 | workflow≠constitutional | separation tests | *(PO)* |
| Operational Dashboard | D1–D2 | derived read-only; distinct | UI + CI | *(PO)* |
| Notification History | H1–H2 | distinct + attributable | history store | *(PO)* |

## 14. Updated Product Owner Decision Queue

1. **Authorize Phase 9 implementation?** (this package is the input).
2. **Notification type scope** — which of the ten types are Phase 9 vs later.
3. **Channel scope** — confirm in-platform only for initial implementation; external channels deferred.
4. **Escalation policy** — approve triggers, timing, and bounded escalation authority.
5. **Workflow state set** — confirm the ten workflow states and the workflow≠constitutional-state rule.
6. **Operational Dashboard scope** — surfaces in Phase 9 vs later; confirm separation from the Governance Dashboard.
7. **Notification History retention** — retention policy and its distinctness from Audit/Operational History.
8. **Canonical identifier standard** — still unresolved; identifiers remain Product-Owner-pending.
9. **Sequencing** — confirm production monitoring/operations and hosting remain later phases, distinct from Phase 9 operational *awareness*.

## 15. Phase 9 Readiness Assessment (findings only — no self-recommendation)

- **Architecture completeness:** notification, workflow, attention, assignment awareness, queues, escalation, channels, workflow-state, operational dashboard, and notification history are specified end-to-end (§5–§12).
- **Governance preserved:** notifications/workflows/queues/escalations never create authority; operational awareness is derived and read-only; workflow state stays distinct from constitutional state — each stated as an enforced invariant with a negative test.
- **Operational awareness fully defined:** every success question in §16/§9-of-directive maps to a specified capability.
- **Implementation boundaries clear:** hard exclusions (§3) + stop conditions (§17); in-platform-only initial channel; verification defined but unexecuted (§12).
- **Open dependencies:** the nine decisions in §14 — notably notification-type scope, escalation policy, and notification-history retention — materially shape implementation.

> **#SCS does not recommend that implementation begin.** That determination is reserved to the Product Owner. If any success question is inadequately answered, the package is not ready and #SCS will revise.

## 16. Success questions (each answerable from this package)

What requires attention? (§6/AT) · Who must act? (§6/AS, §5.2 recipients) · Why are they notified? (N1 reason) · How are assignments routed? (§6/W) · How are reviews routed? (§7/Q) · How are escalations handled? (§7/E) · How are workflow states governed? (§8/S) · How is operational awareness kept separate from constitutional authority? (§1, §8, invariants N4/W2/Q2/E2) · How is notification history preserved? (§10/H) · How can every operational event be reconstructed? (§10 + Phase 8 audit references).

## 17. Stop Conditions

#SCS stops and returns to the Product Owner if, during this planning assignment, any of the following becomes necessary: implementation of any Phase 9 capability; confidential data; a hosting decision; a deployment step; a change to the accepted constitutional architecture or Production Baseline v1.0; or any action requiring Product Owner authority (approval/acceptance/activation/identifier origination).

## 18. Confirmation — no unauthorized work

This assignment produced **only** a planning document and the permitted planning-governed records (planning assignment, planning deliverable, planning review gate, planning operational-history entry). It created **no** decision record, **no** implementation record, wrote **no** code, proposed **no** new doctrine document, made **no** hosting/deployment decision, introduced **no** confidential data, altered **no** accepted Baseline, and originated **no** canonical identifier. Submitted to the **Phase 9 Authorization Package Review** gate; #SCS now **stops** and awaits Product Owner disposition.
