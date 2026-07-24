# Changelog

All notable changes to SCS are recorded here. Format loosely follows Keep a Changelog.
Dates are absolute.

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
