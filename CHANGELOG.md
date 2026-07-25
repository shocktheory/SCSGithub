# Changelog

All notable changes to SCS are recorded here. Format loosely follows Keep a Changelog.
Dates are absolute.

## [0.1.0-phase2-accepted] — 2026-07-25

Product Owner Acceptance Ruling — accepts commit `a773bd6` as the Phase 2 reconciliation
baseline and closes the Phase 2 implementation-reconciliation cycle. This entry **records**
the acceptance only; it manufactures no authority.

### Recorded (governed records)
- **Acceptance milestone** `ST-OPH-2026-010` (approved) — Product Owner acceptance of commit
  `a773bd6`; cycle closed; Constitutional State Derivation Engine **Verified and Accepted**.
  Deliberately typed as a *Product Owner acceptance & closure* event, tied to no single agent,
  so it is **not** an activation event and activates no agent.
- **Closure:** deliverables ST-DLV-2026-002 / ST-DLV-2026-003 → **Accepted**; Assignment
  Directives ST-ADR-2026-002 / ST-ADR-2026-003 / reconciliation directive → **Closed — accepted**;
  review gates "Phase 2 review" / "Reconciliation review" → **Approved**.
- **Implementation status:** Phase 2 baseline decisions (ST-DEC-2026-011…016) → **Verified and
  Accepted**.
- **Activity:** an `ST-REVIEW` acceptance entry surfaces on SCS Home.

### Explicitly NOT done (Product Owner stop conditions honored)
- ST-OPH-2026-006…009 remain **Pending / non-authoritative** — not approved or amended.
- **No agent activated** — AGENT-001…004 remain *Pending activation*; #CIA remains the only
  activated agent (Available). Derived agent states are unchanged from `a773bd6`.
- The reconciliation **ST-ADR identifier remains Product-Owner-pending** — not assigned.
- **AGENT-004 / #CKP organizational reconciliation not initiated.**

## [0.1.0-phase1-rev03] — 2026-07-24

SCS Home vs Executive Snapshot reconciliation + constitutional trust (Revision 02/03).

### Architecture
- Split the screen: **SCS Home** (interactive constitutional command center) and a separate
  **Executive Snapshot** (concise generated briefing with View/Refresh/Export/Print).
- Navigation regrouped: Overview · Constitution · Portfolio · Operations · System. Added
  Constitutional Library and Artifact Registry as explicitly **Deferred**; badges now carry
  tooltips ("Planned for Phase 2", "Deferred").
- SCS Home hierarchy: Current Constitutional State → If You Do One Thing Today → What Needs You →
  Risks & Constitutional Awareness → What Changed → Product/Publication summary → Active AI
  Coordination → Recent Constitutional Activity.

### Constitutional trust
- **Demonstration isolation:** "Demo data" → **Demonstration Data**; a Simulated Constitutional
  State banner; demo data never counted as real metrics, cited as provenance, or exported as truth.
- **Approval/activity consistency:** the header no longer asserts approvals that have no governed
  Decision record; states trace to Recent Constitutional Activity.
- **Separate record dimensions:** Authority / Governance (Constitutional Review) / Work state /
  Maturity / Gate are labeled and visually distinct; product & publication authority shows as "Record · …".
- **Metric reconciliation:** counts state overlap explicitly and filter the list.
- **Decision workspace:** every review item opens a workspace (exact decision, why, sources,
  Claude recommendation, #SOS assessment, consequences, impact, Review Decision action).
- **Constitutional Awareness** expanded (what happened / why it matters / what next).
- **AI Coordination:** adds Last Constitutional Sync and Authority Scope; ChatGPT/#SOS wording
  corrected; SCS Home shows active work only, full roster moved to **AI Work**.

### Visual
- Main workspace spans the full screen; card grids fill width; two-column rows share equal height.
- Meaningful product summaries (no "product within the ecosystem").

## [0.1.0-phase1-rev01] — 2026-07-24

Executive Snapshot — Product Owner Review, Revision 01. Maturity step from dashboard toward
constitutional operating environment. No redesign; the approved visual language is preserved.

### Changed
- Renamed "Overview" → **Executive Snapshot** (approved constitutional terminology).
- Page reorganized into executive layers: Current Operating State → Immediate Decisions →
  Risks & Constitutional Awareness → Recommended Next Action → Products → Publications →
  AI Coordination → Recent Constitutional Activity.
- **Current Operating State** is now a hero / Mission Control panel — the visual anchor, read first.
- **Immediate Decisions** surfaces quantities before descriptions (approvals waiting,
  constitutional reviews, unresolved decisions).
- **Recommended Next Action** elevated to the highest-hierarchy card ("If you do one thing today").
- **Products** now communicate maturity, constitutional status, current phase, operational health.
- **Publications** presented as living constitutional artifacts (type, volume, current gate, state).
- **AI Work → AI Coordination** workspace: current assignment, expected deliverable, waiting on,
  status, dependencies, risks per collaborator.

### Added
- **Constitutional Awareness** — a data-driven "compiler" that surfaces constitutional signals
  (e.g. canonical statements missing approved wording, an undated locked change).
- **Recent Constitutional Activity** timeline driven by sync-code updates.
- Reusable ProductCard, PublicationCard, AICoordinationRow, StatTile, MaturityMeter components.

## [0.1.0-phase1] — 2026-07-24

Phase 1 — Functional shell, registries, seed data, local persistence.

### Added
- Application shell with executive navigation (11 sections) and a responsive mobile drawer;
  scroll-to-top on navigation.
- Overview / Executive Snapshot: current operating state, needs-your-review, recommended next
  action, active products, current publications, AI work summary.
- ShockTheory OS registry with preserved relationships (SAPDOS, STACL, STP, #SOS, SCS).
- Products list and per-product Command Pages (identity, publications, assignments, artifacts).
- Publications grouped by family, phase-gated with gate timelines.
- Settings: JSON workspace export, configurable local folder path, guarded reset, source links.
- Design-system components (badges incl. AuthorityBadge, cards, page header, empty states,
  gate timeline, meta grids) styled with the WCAG-validated blue/indigo tokens.
- Labeled seed data (`isSeed`) — only spec-stated content, honest authority states.
- Local IndexedDB persistence (Dexie) behind `StorageAdapter`; seed-on-first-load; portable
  JSON backup format.

### Honored
- Proposed never renders as approved (AuthorityBadge everywhere). Not-yet-built sections show
  honest "arrives in Phase N" pages. No data invented as approved truth.

## [0.1.0-phase0] — 2026-07-24

Phase 0 — Architecture. Documentation and toolchain scaffold only; no feature UI.

### Added
- Product charter, architecture, data model, and decision records (`PRODUCT_CHARTER.md`,
  `ARCHITECTURE.md`, `DATA_MODEL.md`, `DECISIONS.md`).
- Accessibility, security, testing, and contributing guides.
- Executive Snapshot schema (`SCS_EXECUTIVE_SNAPSHOT_SCHEMA.md`).
- Client toolchain scaffold (Vite + React + TypeScript, strict), compiling an inert Phase 0 shell.
- Design-token system (`app/src/design-system/tokens.css`) with WCAG 2.2 AA-validated blue/indigo palette.
- Typed domain model (18 entities) and `StorageAdapter` interface with portable JSON backup format.
- Authority-state model with guarding unit tests.
- PHP/MySQL server scaffold (`server/`) and deployment plan for Nestify / shocktheoryos.com.
- CI workflow (typecheck → test → build).

### Decisions
- ADR-0001 stack & PHP/Node resolution · ADR-0002 host = Nestify, DB = MySQL · ADR-0003 palette contrast lock.
