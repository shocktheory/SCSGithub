# Constitutional State Derivation Specification

Operational state in SCS is the **result of approved constitutional records**, not a manually
maintained value (ST-DEC-2026-014/016). Engine: `app/src/lib/derivation.ts`
(`deriveAgentState`). Consumed by the Team Command Center via `app/src/lib/team.ts`.

## Principle

> Where a governing record is absent, SCS reports the absence honestly and never manufactures an
> activated state. The governing records remain the single source of truth; SCS derives, it does not
> duplicate.

## Governing sources

Standing Directive · Assignment Directive · Operational History · Product Owner Decision ·
Team Membership (an attribute on the existing Agent, using the approved "Team" concept).

## Constitutional activation — the exact approved evidence set

An agent is **constitutionally activated** only when ALL of the following are present. If any is
absent, activation is **not** derived; the missing evidence is reported honestly.

1. **Agent Identity**
2. **Current Standing Directive** linked to that Agent (status = `Current`)
3. **Product Owner activation authority** (an approved governing decision / directive)
4. **Operational History activation event**
5. **Active Team Membership** (a Team Membership record, not an agent attribute)

## Derivation rules (agent operational state)

Let **SD** = Standing Directive, **ADR** = the current Assignment Directive, **OPH** = Operational
History, **TM** = Team Membership, **POA** = Product Owner activation authority.

| Derived value | Rule |
|---|---|
| **Activated** | full evidence set present (SD Current + POA approved + OPH activation event + active TM). |
| **Status** | not activated → `Pending Onboarding`; activated + ADR `Active` → `Working`; ADR `Waiting…` → `Waiting on dependency`; ADR `Blocked` → `Blocked`; activated + no ADR → `Available`. |
| **Assignment** | derives ONLY from Assignment Directives — never from currentTask, implementation fields, repository activity, or UI state. No ADR ⇒ `Not Applicable — Awaiting Assignment` (an expected absence, not a deficiency). |
| **Standing Directive status** | `SD ? "{id} {version} — {status}" : "None on record"`. |
| **Current Assignment** | `ASG.task` or `None`. |
| **Synchronization** | not activated → `Not Yet Applicable`; activated + no assignment → `Not Required`; activated + assignment → `Synchronized` / `Synchronization required`. |
| **Current Gate** | not activated → `Constitutional Onboarding`; activated + no assignment → `Awaiting Assignment`; activated + assignment → the assignment's review gate. |
| **Directive Coverage** | not activated → `Not Active`; activated + (assignment ⇒ ADR present) → `Full`; otherwise `Partial`. |
| **Operational Readiness** | not activated → `Onboarding — awaiting activation`; activated + no assignment → `Operational — Awaiting First Assignment`; activated + assignment → `Operational — Assigned`. |
| **Team Membership** | `agent.teamMembership` (e.g. `TEAM-001 — Active`) or `Not recorded`. |
| **Alignment** | not activated → `Not applicable` (never a warning); activated + assignment not synchronized → `Warning`; else `Aligned`. |

## Derived team metrics

- **Active Governed Agents** = activated agents.
- **Active Assignments** = agents with an assignment.
- **Waiting on Product Owner / Deliverables Awaiting Review** = assigned agents awaiting review (overlap disclosed).
- **Alignment Warnings / Stale Synchronizations** = activated agents only (un-activated agents excluded — absence of sync is not a warning).
- **Directives Without Linked Work** = activated agents with no assignment (informational, not a warning).
- **Work Without an Approved Directive** = assigned agents with no Assignment Directive.

## Worked example — AGENT-005 (#CIA)

```
Source records
  ST-SDR-2026-005 v1.0 — Current            (Standing Directive)
  ST-OPH-2026-004 (Constitutional activation) (Operational History)
  ST-DEC-2026-017 — #CIA constitutional activation (Product Owner Decision)
  Team membership: TEAM-001 — Active
        ↓ derivation logic
  SD Current + activation recorded ⇒ Operational; no Assignment Directive ⇒ Available
        ↓ displayed state
  Status = Available · Standing Directive = ST-SDR-2026-005 v1.0 — Current
  Current Assignment = None · Synchronization = Not Required
  Directive Coverage = Full · Current Gate = Awaiting Assignment
  Team Membership = TEAM-001 — Active
```

Remove any one source record (e.g., set SD back to Pending) and the engine derives **Pending
Onboarding** again — demonstrating derivation, not configuration.

## Constraints honored

No new constitutional entities, relationships, governance layers, or Reserved Concepts. Team
Membership is represented as an Agent attribute (existing "Team" concept), not a new object.
Whether Team should become a first-class object is flagged for #SOS / Product Owner review.
