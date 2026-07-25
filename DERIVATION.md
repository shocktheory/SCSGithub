# Constitutional State Derivation Specification

Operational state in SCS is the **result of approved constitutional records**, not a manually
maintained value. Engine: `app/src/lib/derivation.ts` (`deriveAgentState`). Consumed by the Team
Command Center via `app/src/lib/team.ts`. Tests: `app/tests/derivation.test.ts`.

## Principle

> Where a governing record is absent, SCS reports the absence honestly and never manufactures an
> activated state. The governing records remain the single source of truth; SCS derives, it does not
> duplicate.

## Governing sources

| Source | Object |
|---|---|
| Agent Identity | Agent record |
| Standing Directive | `StandingDirective` (canonical `ST-SD-00X v1`) |
| Product Owner activation authority | an **approved** governing decision or Product Owner directive |
| Operational History activation event | `OperationalHistoryEntry` (evidenceType = activation) |
| Team Membership | `TeamMembership` **record** → `Team` (first-class objects) |
| Assignment Directive (when assigned) | `AssignmentDirective` (canonical `ST-ADR-…`) |

Team Membership is a **first-class record**, never an Agent attribute:

```
Agent  →  Team Membership record (status, effective period)  →  Team (TEAM-001, TEAM-002)
```

## Constitutional activation — the exact approved evidence set

An agent is **constitutionally activated** only when ALL of the following are present. If any is
absent, activation is **not** derived; the missing evidence is reported honestly.

1. **Agent Identity**
2. **Current Standing Directive** linked to that Agent (status = `Current`)
3. **Product Owner activation authority** (an approved governing decision / directive)
4. **Operational History activation event**
5. **Active Team Membership** (a Team Membership record)

## Derivation rules (agent operational state)

| Derived value | Rule |
|---|---|
| **Activated** | full evidence set present (SD Current + approved Product Owner authority + Operational History activation event + active Team Membership record). |
| **Status** | not activated → `Pending Onboarding`; activated + Assignment Directive `Active` → `Working`; `Waiting…` → `Waiting on dependency`; `Blocked` → `Blocked`; activated + no Assignment Directive → `Available`. |
| **Assignment** | derives ONLY from Assignment Directives — never from currentTask, implementation fields, repository activity, or UI state. No Assignment Directive ⇒ `Not Applicable — Awaiting Assignment` (an expected absence, not a deficiency). |
| **Standing Directive status** | `SD ? "{ST-SD-00X} {version} — {status}" : "None on record"`. |
| **Synchronization** | not activated → `Not Yet Applicable`; activated + no assignment → `Not Required`; activated + assignment → `Synchronized` / `Synchronization required`. |
| **Current Gate** | not activated → `Constitutional Onboarding`; activated + no assignment → `Awaiting Assignment`; activated + assignment → the Assignment Directive's Review Gate. |
| **Directive Coverage** | not activated → `Not Active`; activated → `Full` (an available agent's chain is complete); Assignment Directive missing a linked Deliverable/Review Gate → `Partial`. |
| **Operational Readiness** | not activated → `Onboarding — awaiting activation`; activated + no assignment → `Operational — Awaiting First Assignment`; activated + assignment → `Operational — Assigned` (`Operational — Blocked` when blocked). |
| **Team Membership** | derived from the active Team Membership record → `"{TEAM-00X} — {status}"`, else `Not recorded`. |
| **Alignment** | not activated → `Not applicable` (never a warning); activated + Blocked assignment → `Warning`; else `Aligned`. |

## Decision Status vs Implementation Status

A Decision's constitutional **status** (Approved) and its **implementation status** (Implemented /
In progress / Reference only) are modeled independently on the `Decision` record.

## Derived team metrics

- **Active Governed Agents** = activated agents.
- **Active Assignments** = agents with an active Assignment Directive.
- **Waiting on Product Owner / Deliverables Awaiting Review** = deliverables in review + their agents (overlap disclosed).
- **Alignment Warnings / Stale Synchronizations** = activated agents only (un-activated agents are never counted as deficient).
- **Available — Awaiting Assignment** = activated agents with no Assignment Directive (informational, not a warning).
- **Pending Onboarding** = agents lacking the full activation evidence set.

## Worked example — AGENT-005 (#CIA)

```
Source records
  ST-SD-005 v1 — Current                        (Standing Directive)
  approved Product Owner activation authority    (approved governing decision/directive)
  ST-OPH-2026-004 — Constitutional Activation     (Operational History)
  active TEAM-001 membership record               (Team Membership → Team)
        ↓ derivation logic
  Full activation evidence set present ⇒ Constitutionally Activated
  No active Assignment Directive ⇒ Available
        ↓ displayed state
  Status = Available · Standing Directive = ST-SD-005 v1 — Current
  Current Assignment = None · Assignment Directive = Not Applicable — Awaiting Assignment
  Synchronization = Not Required · Directive Coverage = Full
  Current Gate = Awaiting Assignment · Team Membership = TEAM-001 — Active
```

Remove any one source record (e.g., set the Standing Directive back to Pending, or remove the
Team Membership record) and the engine derives **Pending Onboarding** again, listing the missing
evidence — demonstrating derivation, not configuration.

## Constraints honored

No new constitutional entities, relationships, governance layers, or Reserved Concepts. **Team and
Team Membership are approved constitutional structures** (TEAM-001, TEAM-002) implemented as
first-class records — this is faithful constitutional implementation, not expansion. No constitutional
identifiers are originated by #SCS; the reconciliation Assignment Directive carries a
Product-Owner-pending identifier.

## Source-to-documentation audit (2026-07-25)

| Area | Documentation | Source implementation | Result |
|---|---|---|---|
| Activation evidence set | 5-part set | `deriveAgentState` requires all 5 | ✅ Pass |
| Standing Directive IDs | `ST-SD-001…005 v1` | `directives.ts` uses `ST-SD-00X v1` | ✅ Pass |
| Product Owner authority | approved source only | governing decision `authorityStatus === 'approved'` | ✅ Pass |
| Operational History | ST-OPH-2026-004 / -005 (independent) | two events preserved | ✅ Pass |
| Team Membership | first-class record | `teamMemberships` collection → `teams` | ✅ Pass |
| Assignment derivation | Assignment Directive only | derives from `assignmentDirectives`, not currentTask | ✅ Pass |
| Decision / Implementation status | separate | `status` + `implementationStatus` | ✅ Pass |
| No-assignment state | `Not Applicable — Awaiting Assignment` | same string in engine | ✅ Pass |
| Retired `ST-DEC-2026-017` | absent | removed from register + docs | ✅ Pass |
