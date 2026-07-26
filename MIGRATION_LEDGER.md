# SCS Client → Server Derivation Migration Ledger (Permanent Artifact)

**Status:** Permanent governed artifact (Product Owner decision, Phase 7 acceptance disposition — "the migration ledger should become a permanent artifact; every client-derived capability migrated to the server must be recorded until client constitutional derivation has been fully eliminated").
**Maintained by:** #SCS. **Governing principle:** clients never author constitutional derivation (Constitutional Derivation Principles).

This ledger records every constitutional derivation and its ownership as it moves from the client to the server. It is not closed until **no constitutional state is computed on the client** — only presentation state remains client-side.

## Legend
- **Constitutional?** — does the derivation determine authoritative constitutional state (activation, authority, contradictions, lifecycle)? Only these must move to the server.
- **Status:** `client-only` · `migrating` · `server-canonical (client presentation-only)` · `presentation-only (stays client)` · `eliminated`.

## Ledger

| # | Derivation | Source (client) | Constitutional? | Phase 7 status | Server owner | Parity evidence |
|---|---|---|---|---|---|---|
| 1 | Agent constitutional state (activation, assignment, contradictions, coverage, readiness) | `app/src/lib/derivation.ts` → `deriveAgentState` | **Yes** | **server-canonical** — ported to `Scs\Derivation::deriveAgentState`; client engine retained for **presentation only** and pinned to server output by parity tests | `Scs\Derivation` | `app/tests/derivation.e2e.test.ts` (server output === client output, per fixture); `server/tests/DerivationTest.php` |
| 2 | Whole-team constitutional roll-up (active agents, assignments, onboarding, contradictions) | `app/src/lib/team.ts` → `deriveTeam` | **Yes** | **server-canonical** — ported to `Scs\Derivation::deriveTeam`, served at `GET /api/derived/team` | `Scs\Derivation` | `server/tests/DerivationTest.php::testDeriveTeamActivatesFromApprovedEvidence`; e2e team view |
| 3 | Governed-agent onboarding lifecycle (reuses agent-state derivation) | `app/src/lib/onboarding.ts` → `deriveOnboarding` | **Yes (via #1)** | **migrating** — its constitutional core (`deriveAgentState`) is server-canonical (#1); the onboarding *presentation model* (checklist labels, stage names, provenance rows) remains client presentation. Deferred: exposing a server `onboarding` view. | `Scs\Derivation` (core) | covered transitively by #1 parity |
| 4 | Authority tone / badge mapping | `app/src/lib/derive.ts` → `authorityTone` | No | **presentation-only (stays client)** | — (UI) | n/a |
| 5 | Canonical decision-id formatting | `app/src/lib/derive.ts` → `canonicalDecId` | No (display formatting of an id) | **presentation-only (stays client)** | — (UI) | n/a |
| 6 | Product maturity / executive summary / publication timeline (Kidlytics publications) | `app/src/lib/derive.ts` → `productMaturity`, `productExecutiveSummary`, `publicationTimeline` | No (product presentation, not constitutional authority) | **presentation-only (stays client)** | — (UI) | n/a |

## Deferred (recorded, not yet migrated)
- **#3 onboarding presentation view on the server.** The constitutional core is already server-canonical; the onboarding *workspace model* is presentation. A future increment may expose `GET /api/derived/onboarding` for symmetry. Tracked here until done.

## Closure criterion
This ledger closes only when every **Constitutional? = Yes** row is `server-canonical` or `eliminated` **and** the client contains no code that computes authoritative constitutional state (only presentation). Rows #1 and #2 are server-canonical; #3's constitutional core is server-canonical with a presentation remainder. The ledger therefore remains **open** (presentation remainder + deferred onboarding view).
