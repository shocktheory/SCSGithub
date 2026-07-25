# SCS Phase 6 Authorization Package (Planning Only)

**Status:** Proposed — submitted to the **Phase 6 Authorization Package Review** gate (planning review).
**Authority:** Product Owner Authorization Directive — *Authorize Preparation of the SCS Phase 6 Authorization Package (Planning Only)* (2026-07-25), under the accepted **SCS Platform Completion Program Rev 2** and **SCS Production Baseline v1.0**.
**Prepared by:** #SCS (implementation; no constitutional authority — acceptance is a Product Owner act).

> **This is planning and authorization preparation only.** No code, no authentication/authorization implementation, no database changes, no Phase 6 implementation-governed records, no deployment, no confidential data, no production/operational/public access, no launch. The accepted Baseline v1.0 is unaltered; the Completion Program remains the governing roadmap.

> **Constitutional constraints (reinforced throughout):** planning does not authorize implementation · implementation does not imply acceptance · technical readiness does not authorize production · Product Owner authority is unchanged · no implementation records may be created · no deployment may begin · no confidential data may be introduced.

---

## 1. Phase 6 Executive Overview (Deliverable 1)

**Why Phase 6 exists.** SCS today has no identity boundary: the client is public and local, and the accepted backend refuses production. To become a governance platform that can safely hold real records, SCS must know **who** is acting, enforce **what** each actor may do, and **attribute** every governed change. Phase 6 delivers three Completion domains: **Identity** (Authentication & Identity Lifecycle), **Authority** (Roles & Permissions), and the attribution portion of **Trust** (authenticated audit attribution).

**Why it precedes every remaining implementation phase.** Every later capability depends on an identity/authority boundary: Trust/Technical Audit (Phase 8) needs authenticated attribution; Administration (Phase 8) needs roles; Hosting/Operations (Phase 10) hosts real records only behind auth; and **no confidential data may exist before the auth boundary is accepted.** Phase 6 is the gate that turns the accepted foundation into a governable system.

**What architectural capabilities it completes.** Identity: Authentication & Identity Lifecycle. Authority: Roles & Permissions (record- and action-level; approval-boundary enforcement). Trust: authenticated attribution + approval integrity (the audit *log* itself is Phase 8; Phase 6 supplies the authenticated actor context it will record).

**Prerequisite for confidential data & production readiness.** Confidential data and production access are **gated behind** an accepted Phase 6 auth boundary plus a separate Security readiness authorization (Completion Program §Security). Phase 6 does not itself authorize either.

---

## 2. Phase 6 Capability Breakdown (Deliverable 2)

*Using the approved hierarchy: Domain → Capability → Requirements → Verification Evidence. Requirements are defined, not implemented.*

### Identity → Authentication & Identity Lifecycle
| Requirement | Verification evidence (planned) |
| --- | --- |
| Email + password authentication (Argon2id hashing) | unit (hash/verify) + integration (login) |
| Secure server-managed sessions (HttpOnly/Secure/SameSite=Strict cookie; server-side store) | integration (session issue/read) |
| Login / logout (server-side session revoke on logout) | integration |
| Session rotation on login & privilege change | integration |
| Idle + absolute session expiry | integration (clock-advanced) |
| Session revocation (single + all-sessions) | integration |
| Account recovery (emailed single-use, time-boxed token) | integration |
| MFA (TOTP) — mandatory for Product Owner | integration (MFA challenge) |
| Failed-login lockout + per-IP/per-account rate limiting | integration (abuse) |
| Actor identity resolved on every request (actor context) | integration + audit attribution |
| Auth event evidence (login/logout/lockout/recovery) surfaced to the Trust/audit seam | audit test |

### Authority → Roles & Permissions
| Requirement | Verification evidence (planned) |
| --- | --- |
| Role model (Product Owner, Administrator, Agent/system, Read-only user; Demonstration isolated) | unit (role resolution) |
| Permission model (record-level + action-level) | unit |
| Authorization middleware enforcing permissions on every command | integration |
| Approval-boundary enforcement: only an authenticated Product Owner may approve/accept/activate | **negative-permission** tests |
| Least privilege defaults; denied-action handling (403 with structured error) | negative tests |
| Agent authority: scoped API keys may create/advance **proposed** records only | negative tests |
| Administrator authority: ops/repair only — may not alter constitutional authority | negative tests |
| Administrative role management (grant/revoke, audited) | integration |

### Trust → Authenticated Attribution & Approval Integrity (attribution portion; log = Phase 8)
| Requirement | Verification evidence (planned) |
| --- | --- |
| Every governed mutation carries an authenticated actor identity | audit test |
| Approval integrity: `authorityStatus`/acceptance/activation change only via an authenticated Product Owner command | negative tests |
| Request/correlation identifiers on every mutation (attribution seam) | integration |
| Auth + authorization events recorded to the audit seam (full Technical Audit Log is Phase 8) | audit test |

---

## 3. Functional Scope Matrix (Deliverable 3)

| Capability | Objective | Architectural rationale | Dependencies | Exclusions | Phase | Verification | Product Owner acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication & Identity Lifecycle | Know who is acting; manage identity securely | No governance without identity | Phase 5 backend | external IdP; SSO; social login | 6 | unit+integration+MFA+session | login/logout/MFA/recovery/rotation/expiry all pass; no confidential data used |
| Roles & Permissions | Enforce what each actor may do | Approval boundary must be server-enforced | Authentication | delegation to non-PO approvers | 6 | authz + **negative-permission** | every role's allowed/denied set proven; approval boundary un-bypassable |
| Authenticated Attribution | Attribute every governed change | Trust requires accountability | Authentication | full Technical Audit Log | 6 (seam) / 8 (log) | audit tests | every mutation attributed to an authenticated actor |

No additional scope is introduced. External identity, notifications, hosting, confidential data, and deployment are **out of Phase 6**.

---

## 4. Security Architecture Review (Deliverable 4 — architecture only)

- **Authentication:** email + password (Argon2id); **secure server-managed sessions** — opaque session id in an **HttpOnly, Secure, SameSite=Strict** cookie, server-side session store (DB or Redis). Rationale: no browser token storage (XSS token theft avoided); instant server-side revocation; simple rotation. **Not JWT** unless a documented future requirement justifies it.
- **Authorization:** middleware resolves actor + role, then checks record/action permissions before any command executes; approval-boundary checks are server-side and cannot be satisfied by client input.
- **Sessions:** rotate id on login and privilege change; idle + absolute expiry; explicit logout revokes server-side; per-session and all-session revocation; device/session visibility.
- **CSRF:** synchronizer (or double-submit) token on all state-changing commands; SameSite=Strict as defense-in-depth.
- **MFA:** TOTP; **mandatory for the Product Owner**; challenge on login and on sensitive approval actions where required.
- **Password recovery:** emailed single-use, time-boxed token; recovery events audited; documented out-of-band **emergency recovery** for the sole Product Owner.
- **Session rotation / revocation / timeout:** as above.
- **Actor identity:** resolved on every request into an actor context consumed by authorization and attribution.
- **Secrets handling:** env-only (app secret, session/MFA keys, DB creds); never committed; parameterized DB access already in place.
- **Boundary enforcement:** all authority transitions are server-owned governed commands; the client's `RemoteAdapter` maps to commands and can never set authority fields by raw replacement.

---

## 5. Trust Architecture Review (Deliverable 5)

Phase 6 supports the **Trust** domain — **distinct from Security** (Security keeps attackers out and protects data; Trust proves *who did what, that approvals were genuine, and that the record is transparent and accountable*):
- **Attribution:** every governed mutation is stamped with an authenticated actor identity + request/correlation id.
- **Approval integrity:** `authorityStatus`/acceptance/activation can change **only** through an authenticated Product Owner command with fresh MFA where required — never by an agent, admin, or client.
- **Authenticated actors:** agents act through scoped keys producing **proposed** records attributed to the agent; humans authenticate; admins are ops-only.
- **Audit attribution:** auth and authorization events feed the audit seam; the full **Technical Audit Log** (separate from Operational History) is Phase 8, but Phase 6 provides the authenticated context it will record.
- **Accountability & transparency:** command outcomes are reviewable; who approved what is recoverable from attribution.

**Trust ≠ Security:** a system can be secure (encrypted, patched) yet untrustworthy (unattributable approvals), or well-attributed yet insecure. Phase 6 advances both, but they are tracked as separate completion domains.

---

## 6. Identity Model (Deliverable 6)

| Identity | Authenticates directly? | Auth method | Authority | Ownership | Lifecycle / state transitions |
| --- | --- | --- | --- | --- | --- |
| **Product Owner** (Sonja) | Yes | password + **mandatory TOTP MFA** | **Sole approval authority** | ShockTheory | provisioned → active → (recovery) → active; emergency recovery documented |
| **Administrator** | Yes | password + MFA | Ops/repair only — **no constitutional authority** | ShockTheory | invited → active → suspended → revoked (all audited) |
| **Authenticated human user** (future, e.g., read-only) | Yes | password + MFA | Read/limited per role | ShockTheory | invited → active → suspended → revoked |
| **AI agent identity** (#SOS/#SCS/#CKL/#CKP/#CIA/#CKL-R) | **No** interactive login | **scoped API key** | **Propose only** (proposed records, attributed) | governed agent register | key issued → active → rotated → revoked |
| **Service account** (workers) | Machine credential | scoped key/secret | System actions only (no approvals) | ShockTheory | provisioned → active → rotated → revoked |
| **Future external identities** | Deferred | external IdP (not Phase 6) | per future policy | external | **out of Phase 6** — reconsider only if external interfaces are exposed |
| **Demonstration actor** | n/a | n/a | none — demo data isolated | n/a | never authoritative |

**Agent identity is not a human login.** Agent work enters SCS only as **proposed** records via scoped keys; acceptance/activation always require a Product Owner command.

---

## 7. Role & Permission Matrix (Deliverable 7)

| Role | Permissions | Prohibited actions | Approval authority | Delegated authority | Inherited permissions | Escalation |
| --- | --- | --- | --- | --- | --- | --- |
| **Product Owner** | read all · propose · **approve/accept/activate** · admin · guarded reset | — | **Yes — sole** | none (non-delegable) | — | n/a (top authority) |
| **Administrator** | read all · user/role admin · env/config · import(dry-run→confirmed) · export · archival | set `authorityStatus`/acceptance/activation; alter constitutional content | **No** | none | — | emergency technical intervention is **audited**, not constitutional authority |
| **Agent (scoped key)** | read scoped · **propose** (proposed records only) | approve/accept/activate; edit others' records; direct other agents; expand own authority | **No** | none | — | none |
| **Service account** | system actions (workers) | approvals; constitutional content | **No** | none | — | none |
| **Read-only user** (future) | read permitted records | any write; any approval | **No** | none | — | none |
| **Demonstration** | demo data only (isolated) | anything authoritative | **No** | none | — | none |

**Least privilege** is the default; every denied action returns a structured **403**. The approval boundary is enforced server-side and is un-bypassable by any non-Product-Owner actor.

---

## 8. Authorization Boundary Review (Deliverable 8)

- **The server MUST enforce:** actor authentication; role/permission checks on every command; that `authorityStatus`, acceptance, activation, Product Owner decisions, and Operational-History writes occur **only** via authenticated Product Owner commands (approvals) or the appropriate governed command; optimistic-concurrency; idempotency; CSRF.
- **The client may NEVER enforce (or assert) authority:** the client renders and proposes; it cannot set authority fields, approve, accept, or activate; a client-submitted authority change is rejected server-side.
- **Prohibited authority mutations:** any attempt to change authority via raw document replacement (`PUT`/JSON) → rejected; any non-Product-Owner actor invoking an approval command → **403**; unauthenticated request to a governed command → **401**.
- **Approval workflow:** agent/human **proposes** → record is `proposed`, attributed → authenticated **Product Owner** (MFA-fresh) issues an approve/accept/activate command → server validates role + boundary → applies → writes attribution to the audit seam + Operational History.
- **Rejected scenarios (must be tested):** agent tries to approve → 403; admin tries to set `authorityStatus=approved` → 403; stale/forged CSRF → 403; unauthenticated approval → 401; stale-version write → 409; replayed command (same idempotency key) → single apply.

---

## 9. Threat & Risk Assessment (Deliverable 9)

| Threat / risk | Likelihood | Impact | Mitigation | Residual |
| --- | --- | --- | --- | --- |
| Privilege escalation (non-PO approves) | Med | High | server-side approval boundary; negative-permission tests | Low |
| Session hijack / token theft (XSS) | Med | High | HttpOnly server sessions (no browser token); CSP | Low–Med |
| CSRF | Med | Med | synchronizer token + SameSite=Strict | Low |
| Agent API-key compromise | Med | Med | keys scoped to **proposed** only; rotation; revocation | Low |
| Insider / admin overreach | Low | High | admin has no constitutional authority; all admin actions audited | Low |
| **AI misuse** (agent attempts approval/authority) | Med | High | agents cannot approve/activate; scoped keys; boundary tests | Low |
| Brute-force / credential stuffing | High | Med | lockout + rate limiting; MFA for PO | Low |
| Audit tampering | Low | High | append-only audit; restricted access; retention | Low |
| Recovery abuse | Low | High | single-use time-boxed tokens; audited; emergency recovery documented | Low |
| Governance risk (silent authority change) | Low | High | authority only via authenticated PO command; attribution | Low |
| Operational risk (misconfig before hosting) | — | — | out of Phase 6 (Phase 10) | n/a |

---

## 10. Verification Strategy (Deliverable 10 — defined, not executed)

Unit (hashing, session, role resolution, permission checks) · integration (login/logout, MFA, recovery, rotation/expiry/revocation, authorization middleware) · **authorization tests** (each role's allowed/denied set) · **negative-permission tests** (agent cannot approve; admin cannot set authority; unauthenticated blocked; client cannot mutate authority) · session tests · MFA tests · CSRF tests · audit-attribution tests (every mutation attributed) · **CI execution** (extend the runtime-verification workflow with PHP 8.2 + MySQL 8 to run the above end-to-end). **Not executed in this planning package;** executed evidence is produced only during authorized Phase 6 implementation.

---

## 11. Traceability Matrix (Deliverable 11)

```
Capability → Requirement → Verification → Evidence → Acceptance
Authentication & Identity Lifecycle → sessions/MFA/recovery/rotation/expiry → integration+MFA → CI run (future) → PO accepts on green + review
Roles & Permissions → role/permission/authz-middleware/approval-boundary → authz + negative-permission → CI run (future) → PO accepts when boundary un-bypassable
Authenticated Attribution → actor-on-mutation/approval-integrity/request-ids → audit tests → CI run (future) → PO accepts when every mutation attributed
```

---

## 12. Updated Product Owner Decision Queue (Deliverable 12)

Required **before Phase 6 implementation could be authorized:** Phase 6 authorization itself · **identity-provider** choice (built-in vs external IdP — recommend built-in for Phase 6) · **MFA method** (recommend TOTP) + who is required (recommend Product Owner mandatory) · **role set** approval (Product Owner, Admin, Agent, Service, Read-only) · whether **non-Product-Owner human users** exist at Phase 6 (recommend not yet) · **session store** (DB vs Redis) · **password policy** · **account-provisioning** process/owner · **recovery + emergency-recovery** owner/process · **canonical identifier standard** (still Product-Owner-pending) · confirmation that **no confidential data** enters in Phase 6.

---

## 13. Phase 6 Readiness Assessment (Deliverable 13)

| Question | Answer |
| --- | --- |
| Architecturally defined? | **Yes** — Identity, Authority, and attribution capabilities fully specified. |
| Internally consistent? | **Yes** — consistent with Phase 4 architecture (server sessions, governed commands, actor separation) and the Completion Program domains. |
| Traceable? | **Yes** — capability → requirement → verification → evidence → acceptance. |
| Governable? | **Yes** — server-enforced approval boundary; Product Owner sole approval authority; agents propose-only. |
| Sufficiently documented? | **Yes** — this package. |
| Ready for Product Owner authorization? | **Yes — ready for the Product Owner to *decide*.** |

**Statement:** Phase 6 is architecturally defined, internally consistent, traceable, governable, and sufficiently documented to support a Product Owner authorization decision. This package **does not recommend beginning implementation** on its own authority; implementation requires a **separate Product Owner Phase 6 Authorization Directive** and resolution of the decision queue (§12). No implementation, records, deployment, or confidential data are proposed here.

---

## Explicit exclusions & confirmation

This package does **not** authorize implementation, repository modification, authentication rollout, authorization-middleware creation, database changes, production configuration, deployment, confidential-data readiness, hosting, integrations, operational access, public access, or launch. **No Phase 6 implementation-governed records were created** (no implementation assignment/deliverable/review-gate); only planning records for this authorization preparation exist. The accepted Production Baseline v1.0 is unaltered; no canonical identifiers were assigned.

Submitted to the **Phase 6 Authorization Package Review** gate for Product Owner disposition.
