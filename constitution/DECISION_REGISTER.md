# Interim Constitutional Decision Register

**Governed, version-controlled source of Product Owner decisions.** Created per ST-LOCK
(2026-07-24) so decision recording does not wait for the Phase 2 Decision Register interface.
The Phase 2 Register **must ingest these records unchanged**. Machine-readable mirror:
[`decisions.json`](decisions.json). App ingestion: `app/src/seed/decisions.ts`.

- **Product Owner / final authority:** Sonja
- **Status of these records:** real governed rulings (not demonstration)
- **Source directive:** ST-LOCK — Agent Naming, SCS Governance Corrections, and Interim Decision Capture

> Where a ruling's full rationale or consequences were not specified in the governing directive,
> the record says so rather than inventing detail.

| ID | Title | Status | Date |
|----|-------|--------|------|
| DEC-0001 | ShockBoard supersession | Approved | 2026-07-24 |
| DEC-0002 | SCS naming and scope | Approved | 2026-07-24 |
| DEC-0003 | ProductOS under constitutional review | Approved | 2026-07-24 |
| DEC-0004 | SCS Home versus Executive Snapshot | Approved | 2026-07-24 |
| DEC-0005 | Coupled SAPDOS–Kidlytics workstreams | Approved | 2026-07-24 |
| DEC-0006 | Methodology Maturity | Approved | 2026-07-24 |
| DEC-0007 | #SOS and #SCS authority boundaries | Approved | 2026-07-24 |
| DEC-0008 | #CKL and #CIA naming and authority boundaries | Approved | 2026-07-24 |

---

## Agent & Authority Register (governing)

`#` prefixes an agent or governed operating role. Names without `#` identify products,
platforms, methodologies, documents, or artifacts. **No agent may approve its own proposals.**

| Name | Kind | Role | Authority boundary |
|------|------|------|--------------------|
| **Sonja** | Product Owner | Final approval authority | Approves. |
| **#SOS** | Agent/role | Constitutional guardian, reconciliation, divergence detection, governance advisory | Protects and advises Product Owner authority; does **not** exercise it. |
| **#SCS** | Agent | SCS architecture, design, implementation, testing, repository delivery (model: Claude/Anthropic) | Designs and builds SCS but **is not SCS** and holds **no constitutional authority**. |
| **#CKL** | Agent | ChatGPT Kidlytics — advisory support, product architecture, spec drafting, challenge, review, reconciliation (model: ChatGPT/OpenAI) | Advises and reconciles Kidlytics work; does **not** replace Product Owner approval. |
| **#CIA** | Agent | Claude Kidlytics Invitation AI Agent — invitation review, site/app evaluation, reviewer simulation, feedback synthesis (model: Claude/Anthropic) | Evaluates and synthesizes the invitation experience; may **not** change architecture, canonical language, or product decisions. |

---

## Records

### DEC-0001 — ShockBoard supersession
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** ShockBoard is superseded.
- **Rationale:** Recorded as an existing Product Owner ruling. Superseding artifact and full rationale **pending Product Owner confirmation**.
- **Affected:** ShockBoard · **Superseded assumptions:** Any prior reliance on ShockBoard as an active surface.
- **Implementation consequences:** References to ShockBoard are treated as superseded pending confirmation of the replacement.
- **Related:** DEC-0003

### DEC-0002 — SCS naming and scope
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** SCS is the ShockTheory Constitutional System product — the governed index, awareness, and artifact-navigation system for ShockTheory OS. It displays authority; it does not manufacture it.
- **Rationale:** Establishes the product identity/boundary so SCS is not confused with an agent or a competing source of truth.
- **Affected:** SCS · **Related:** DEC-0007

### DEC-0003 — ProductOS under constitutional review
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** ProductOS is placed under constitutional review.
- **Rationale:** Recorded as an existing ruling. Scope and outcome **pending Product Owner confirmation**.
- **Implementation consequences:** ProductOS carries a Constitutional Review governance state until the review concludes.
- **Related:** DEC-0001

### DEC-0004 — SCS Home versus Executive Snapshot
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** SCS Home is the interactive constitutional command center. Executive Snapshot is the concise, generated operational briefing produced from SCS state.
- **Rationale:** Resolves an architectural conflation before further screens are built.
- **Depends on:** DEC-0002 · **Related:** DEC-0002

### DEC-0005 — Coupled SAPDOS–Kidlytics workstreams
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** SAPDOS and Kidlytics workstreams are coupled.
- **Rationale:** Recorded as an existing ruling. Coupling mechanics **pending Product Owner confirmation**.
- **Implementation consequences:** Methodology maturity of SAPDOS artifacts is validated through Kidlytics first.
- **Related:** DEC-0006

### DEC-0006 — Methodology Maturity
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** Methodology Maturity is an independent field for reusable SAPDOS artifacts: Draft · Validated in Kidlytics · Validated in Additional Products · Reusable Standard · Constitutional Standard. It is never merged with authority, governance status, work state, product maturity, or publication gate.
- **Depends on:** DEC-0005 · **Related:** DEC-0005

### DEC-0007 — #SOS and #SCS authority boundaries
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** No agent may approve its own proposals. #SOS protects and advises Product Owner authority but does not exercise it. #SCS designs and builds SCS but is not SCS and holds no constitutional authority.
- **Depends on:** DEC-0002 · **Related:** DEC-0002, DEC-0008

### DEC-0008 — #CKL and #CIA naming and authority boundaries
- **Status:** Approved · **Date:** 2026-07-24 · **Product Owner:** Sonja
- **Decision:** #CKL (ChatGPT Kidlytics) provides advisory support, product architecture, specification drafting, product challenge, review, and cross-artifact reconciliation for Kidlytics but does not replace Product Owner approval. #CIA (Claude Kidlytics Invitation AI Agent) evaluates and synthesizes the Kidlytics invitation experience but may not change architecture, canonical language, or product decisions.
- **Depends on:** DEC-0007 · **Related:** DEC-0007
