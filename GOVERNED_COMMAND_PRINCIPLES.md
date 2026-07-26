# Governed Command Principles (Constitutional Architecture)

**Status:** Permanent constitutional architecture document (Product Owner-required, 2026-07-25).
**Authority:** Product Owner Disposition — *Phase 7 Implementation: Accepted* (2026-07-25), **Required Addition**.
**Completes the constitutional trilogy:**
1. **Authentication & Authority Principles** — *who may act, and who may approve.*
2. **Constitutional Derivation Principles** — *how constitutional state is produced.*
3. **Governed Command Principles** (this document) — *how constitutional change is executed.*
**Scope:** Durable platform doctrine. These principles govern every present and future SCS phase and survive individual phases, baselines, and revisions. They may be changed only through an approved Product Owner supersession.

> This is architecture doctrine, not implementation. It authorizes no code, no new commands, no deployment, no confidential data, and no launch. It records the principles that every governed command — present or future — must preserve. Phase 8 is **not** authorized and requires a separate Product Owner directive.

---

## Why this document exists

In SCS, constitutional change never happens by editing state directly. It happens through **governed commands** — explicit, authorized, validated expressions of intent that the server executes and records. Phase 7 implemented the command vocabulary (`propose · approve · accept · activate · reject · supersede · archive · restore · retire`) on a server-validated state machine. This document fixes the principles that keep that model trustworthy, so no future command, optimization, or convenience can erode it. Together with the other two documents, it answers the third of the three constitutional questions: *who may act · how is truth produced · how is change executed.*

---

## The Ten Command Principles (non-negotiable)

1. **Commands express intent, not direct mutation.** A command states *what should happen* ("approve this record"); it never carries a raw replacement of constitutional state. The server decides how — and whether — to apply it. Constitutional state is never edited directly (Constitutional Derivation Principles); it changes only as the recorded consequence of an executed command.

2. **Commands never bypass authority.** Every command is authorized against the role/permission matrix before it runs. Approval-gated commands (`approve · accept · activate · supersede · retire`) require an authenticated **Product Owner** with fresh MFA. No client, administrator, AI agent, automation, or API consumer may exercise authority the matrix does not grant (Authentication & Authority Principles).

3. **Commands are validated before execution.** Authorization, current-state legality (the state machine), preconditions, version, and concurrency are all checked **before** any write. A command that fails validation changes nothing.

4. **Commands preserve attribution.** Every executed command records the authenticated actor and a request/correlation identifier. *Who did what, and under what request* is always recoverable — accountability is a property of the command layer, not an afterthought.

5. **Commands are deterministic where applicable.** A command's effect on constitutional state is a function of the command, the target's current state, and the governed rules — not of wall-clock, randomness, locale, or environment. The same command against the same state yields the same transition.

6. **Commands produce traceable outcomes.** Every executed command yields a recorded outcome: the resulting record, its new state, and the transition taken. Nothing about a constitutional change is opaque or unlogged.

7. **Commands never modify constitutional state outside approved transitions.** A command may only move a record along a **permitted** edge of the state machine. Prohibited transitions — skipping an approval gate, mutating a terminal state, any edge not enumerated — are rejected predictably; they never partially apply.

8. **Commands are replay-safe where required.** Idempotent commands, replayed with the same idempotency key, produce the same recorded result rather than a second application. Command execution never corrupts state under retry, duplication, or concurrent conflict (optimistic concurrency governs).

9. **Rejected commands remain attributable.** A denied or invalid command is still an event: its actor, intent, and reason are recoverable. Rejection is a first-class, accountable outcome — not silence.

10. **Command evolution is governed through Product Owner approval.** New commands, changed authority requirements, and new transitions conform to this model rather than introducing parallel command systems, and are adopted only through Product Owner approval — never on implementation authority, never by an agent, never by a client, never silently.

---

## The Command Boundary (permanent shape)

```
   Client / agent: PROPOSES intent ──▶ [ Server: authorize → validate state → check preconditions →
                                          concurrency/idempotency → apply approved transition →
                                          attribute → record outcome ] ──▶ recorded constitutional change
                                                            ▲
                                          Product Owner: exercises approval-gated commands (fresh MFA)
```

- **Intent in, governed change out.** Anyone permitted may submit intent; only the server executes it, and only along approved transitions.
- **Authority is never in the payload.** A command cannot smuggle an authority elevation; authority moves only through approval-gated commands exercised by the Product Owner.
- **Every outcome is recorded.** Applied or rejected, the command is attributable and traceable.

---

## Relationship to the trilogy

- **Authentication & Authority Principles** decide *whether an actor may issue a given command.*
- **Constitutional Derivation Principles** ensure the state a command reads and the state it produces are derived, deterministic, and reproducible.
- **Governed Command Principles** ensure the *transition itself* is intent-expressed, authorized, validated, attributable, and confined to approved edges.

A command reflects authority and produces derived consequences; it never creates authority and never authors derivation. Change flows: **authorized intent → validated transition → recorded constitutional state → deterministic derivation** — never in reverse.

---

## Durability

These principles are permanent. They are not a Phase 7 artifact; Phase 7 is the phase in which the platform grew into them. They bind every future command, capability, migration, and optimization. New commands and command changes must preserve them and are adopted only through an approved Product Owner supersession — never by implementation convenience, never by an agent, never by a client, never silently.
