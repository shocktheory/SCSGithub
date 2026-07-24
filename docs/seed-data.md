# Seed Data — Provenance & Labeling

Seed data exists so SCS is demonstrable and testable from day one. **All of it is clearly labeled
demo/reviewable content** (`isSeed: true`) and must never be mistaken for authoritative truth
(Rules #4, #11; §33). The Product Owner corrects seed values; the system does not infer beyond the
specification.

Seed data is authored in **Phase 1**, not Phase 0. This document is the plan and the boundary.

## What will be seeded (only what the spec states)

### ShockTheory OS
- **SAPDOS** — ShockTheory AI Product Development Operating System
- **STACL** — ShockTheory AI Command Language
- **STP** — ShockTheory Publication System
- **#SOS** — Chief of Staff & Constitutional Guardian

### Products
- **Kidlytics**
- **CivicAI**

### Kidlytics publications (with stated statuses)
- **Experience Playbook · Vol. 01 · Cue** — Phase 5 authorized after Phase 4 approval
- **Workflow Playbook · Vol. 01 · Chip'n** — discovery & lifecycle decisions pending
- **Component Playbook · Vol. 01 · Approval** — planned, not yet started

### Canonical language (representative)
- **The Creed** · **The Promise** · **The Approval Boundary**
- Selected active **Enduring** (Class II) statements
- Selected **Narrative** (Class III) statements

### AI collaborators
- #SOS · ChatGPT · Claude · Codex · Lovable (roles per §14)

### Benchmarks (example)
- Kidlytics Experience Playbook · Vol. 01 · Cue — type: Experience Publication — status: active after final approval

## Labeling rules

1. Every seed record carries `authorityStatus` reflecting reality (mostly `reported`/`proposed`,
   not `approved`) and `isSeed` at the workspace level.
2. The UI shows a visible "demo data" affordance wherever seed content appears.
3. No fabricated decisions, dates, versions, or rulings. If the spec does not state it, it is left
   empty and visibly unresolved — never invented to look complete.
4. Exports set `isSeed: true` until the Product Owner replaces seed content with confirmed data.
