# Authentication & Authority Principles (Constitutional Architecture)

**Status:** Permanent constitutional architecture document (Product Owner-required, 2026-07-25).
**Authority:** Product Owner Disposition — *SCS Phase 6 Authorization Package: Approved with Product Owner Decisions* (2026-07-25).
**Scope:** These principles are durable platform doctrine. They govern every present and future SCS implementation phase and survive individual phases, baselines, and revisions. They may be changed only through an approved Product Owner supersession.

> This is architecture doctrine, not implementation. It authorizes no code, deployment, confidential data, or launch. It records the constitutional principles that all authentication, authorization, attribution, and approval work must preserve.

---

## The Five Foundational Distinctions

1. **Authentication identifies actors.** It answers *who is acting* — nothing more. Being authenticated grants no permission and no authority.
2. **Authorization grants permissions.** It answers *what an authenticated actor may do*. Permission is not authority: a permitted action is still bounded by the approval rules below.
3. **Attribution establishes accountability.** Every governed change carries the authenticated actor and a request/correlation identifier, so *who did what* is always recoverable.
4. **Approval establishes authority.** A record becomes authoritative (`authorityStatus` approved, accepted, activated) **only** through an approval — the exercise of constitutional authority.
5. **Authority is singular and human.** Constitutional approval authority belongs to the **authenticated Product Owner** alone.

---

## The Authority Origin Rules (non-negotiable)

- **Authority never originates from AI.** No agent — regardless of role, capability, or model — may approve, accept, activate, or elevate authority. Agents propose; they never decide.
- **Authority never originates from clients.** No browser, client-computed state, or client-submitted document may set `authorityStatus`, acceptance, or activation. The client proposes and displays; it never governs.
- **Authority never originates from administrators, APIs, automation, or workflows.** Operational, technical, or automated actors may run the system but may not exercise constitutional authority.
- **Authority always originates from authenticated Product Owner commands.** Every authoritative transition traces to an authenticated Product Owner action (with MFA where required), recorded in Operational History. This is **non-delegable**.

---

## The Governed Flow (permanent shape)

```
Actor authenticates            (Identity — who)
      ↓
Authorization is checked        (Authority — may they do this at all?)
      ↓
Actor proposes                  (agents/clients/humans → PROPOSED records, attributed)
      ↓
Product Owner approves          (authenticated, MFA where required → AUTHORITY)
      ↓
Attribution + Operational History   (accountability — permanent evidence)
```

- **Clients propose. The server validates. The Product Owner approves.** This boundary is enforced server-side and may never be weakened.
- Server-side derivation is canonical; client-derived state is advisory and never authoritative.

---

## Trust and Security Are Permanently Separate

- **Security** is technical protection — keeping attackers out and protecting data (authentication mechanics, sessions, encryption, secrets, input validation, dependency safety).
- **Trust** is governance assurance — attribution, approval integrity, transparency, auditability, Operational History, and accountability.
- A system can be secure yet untrustworthy, or trustworthy in design yet insecure. Both must reach completion; neither substitutes for the other. This distinction is permanent platform doctrine.

---

## Mandatory Regression Guarantees

The following must **always** be rejected, and are permanent regression tests for every phase that touches authority:

- an **agent** attempting to approve/accept/activate → denied;
- an **administrator** attempting to change `authorityStatus`/acceptance/activation → denied;
- an **unauthenticated** actor invoking an approval → denied;
- a **client** attempting to set authority via raw document replacement → denied;
- a **replayed** command (same idempotency key) → applied once;
- a **stale** write (wrong expected version) → rejected.

Emergency technical intervention is **audited but never constitutional authority** unless the Product Owner subsequently records it as such.

---

## Durability

These principles are **constitutional**: they precede implementation, outlive phases, and constrain all future work. Any proposed change to them is a Product Owner constitutional matter, recorded through the governed supersession process — never an informal or implementation-level change.
