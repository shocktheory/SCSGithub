# ShockTheory Constitutional System (SCS) — Phase 0 Architecture Proposal

**Product Owner:** Sonja Ross
**Version Target:** v0.1 MVP
**Status:** Phase 0 — Architecture (awaiting Product Owner approval)
**Classification:** Confidential — Internal Use Only
**Prepared:** 2026‑07‑24

> This is the *First Required Response* mandated by §39 of the SCS Specification. It proposes an architecture and stops for review. **No application code will be written until you approve this proposal or a revised version of it.** Nothing here modifies constitutional records or invents approved truth.

---

## 1. Understanding of SCS

SCS is **the executive operating environment for ShockTheory OS** — a single, always‑current, governed view of everything ShockTheory contains. It is *not* a project manager, task app, spreadsheet, chat client, or a second source of constitutional truth. It is a **governed index and command center** that answers, immediately and without hunting through AI conversations:

- **Where are we?** (current operating state, OS version, baseline)
- **What is authoritative?** (locked decisions, benchmarks, canonical language)
- **What changed?** (constitutional change feed / update log)
- **What is waiting on me?** (Needs Your Review — only genuine gates)
- **What should happen next?** (one governed recommended next action)

Three ideas govern every design choice:

1. **One operating system. One current view. No competing sources of truth.** SCS references the constitutional documents; it does not replace or duplicate them. It links to the authoritative artifact rather than copying its content.
2. **Authority is displayed, never manufactured.** A polished UI must never make *proposed* information look *approved*. Reported / verified / proposed / approved / superseded must always be visually and structurally distinct. AI collaborators may recommend; they never approve. The Product Owner's authority is final; #SOS advises and governs but does not approve on the Owner's behalf.
3. **Reduce cognitive load, don't reproduce it.** This is an Executive Workspace, not a dashboard. It reveals what matters rather than showing everything. Calm before urgency; clarity before density; truth before convenience.

The visual identity is deliberately distinct from the ShockTheory corporate brand: **ShockTheory is recognized by green; SCS is experienced through blue** (electric blue, indigo, slate, midnight, glass). Apple‑level polish, restraint, generous spacing, excellent dark mode, WCAG 2.2 AA as a constitutional requirement — not a final patch.

The hierarchy SCS must preserve (never flatten):

```
ShockTheory OS
├── SAPDOS  (ShockTheory AI Product Development Operating System)
├── STACL   (ShockTheory AI Command Language)
├── STP     (ShockTheory Publication System)
├── #SOS    (Chief of Staff & Constitutional Guardian)
├── SCS     (this system)
├── Products ── Kidlytics · CivicAI · Future Products
└── Constitutional Library
    ├── Product Architecture · Playbooks · Canonical Language
    ├── Decisions · Specifications · Benchmarks
```

---

## 2. Proposed Technical Stack

### 2.1 The central architectural tension (and how this resolves it)

The specification contains one genuine conflict that Phase 0 must settle:

- **§31** prefers **TypeScript + React + a mature framework** and a modern component architecture.
- **§21 / §25 / §32** require deployment to **`shocktheoryos.com` on a PHP‑compatible host** and explicitly say **"Do not assume Node.js is available in production."**

**Resolution — a decoupled architecture that satisfies both:**

> **A React + TypeScript single‑page application compiled to *static assets*, served by the PHP host, talking to a thin PHP + database API for everything that must live on a server (private auth, hosted data, web‑push, email, scheduled jobs).**

The front end is built with Node **only on the developer's machine / CI**. Its *output* is plain `index.html` + hashed JS/CSS — no Node runtime is needed in production. This is exactly what a PHP‑compatible shared/managed host can serve. The server‑side responsibilities the spec requires (§24 notifications, §25 hosted DB + auth, §32 private access) are handled by PHP, which the host already runs.

This keeps v0.1 shippable as a **local‑first, browser‑only build** (fast to demo, no server needed) while guaranteeing a **documented, no‑surprises path** to the private hosted product at `shocktheoryos.com`.

### 2.2 Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | §31 preferred; typed domain model is a spec requirement. |
| UI | **React 18** | §31 preferred; mature, huge a11y ecosystem. |
| Build | **Vite** | Fast, outputs static assets deployable to *any* host (incl. PHP). No production Node dependency. |
| Routing | **React Router** (data APIs) | Deep‑linking is required for notifications (§24). |
| UI primitives | **Radix UI** (headless) + custom SCS design system | Accessible dialogs, menus, focus management out of the box → WCAG 2.2 AA (§30). We style them; we don't inherit someone's look. |
| Styling | **Tailwind CSS** + CSS variables (design tokens) | Tokens encode the blue/indigo palette, spacing, radii, motion; enables true dark mode and one coherent component family. |
| State/data | **TanStack Query** over a storage abstraction | Same data hooks work against local persistence now and the PHP API later. |
| Validation | **Zod** | §31 schema validation; one schema validates seed data, imports, and API payloads. |
| Local persistence | **IndexedDB via Dexie**, behind a `StorageAdapter` interface | Durable, not "browser‑only trap"; survives reloads; easy JSON export/import + full backup (§25). |
| Testing | **Vitest** (unit/domain) + **React Testing Library** + **Playwright** (e2e & a11y via axe) | §31 testable business logic; §30 accessibility verification. |
| Icons | **Lucide** (thin, rounded, consistent) | Matches the mandated iconography (§14 of design spec). |
| **Production server (Phase 3+)** | **PHP 8.2+** (Slim or Laravel — *open decision D3*) + **MySQL** on **Nestify** (confirmed host) | Matches host runtime; handles auth, hosted DB, Web Push, transactional email, cron workers. |

**Constraints honored:** no unusual dependencies without justification; no novelty over maintainability; no analytics/trackers; no secrets in the repo; confidential seed data clearly labeled and never exposed publicly.

---

## 3. Proposed Repository Structure

GitHub: `git@github.com:shocktheory/SCSGithub.git`. A single repository with a clear client / server / docs split so the PHP deployment story is explicit from day one.

```
SCS/
├── README.md                       # what SCS is, how to run/build/deploy
├── PRODUCT_CHARTER.md              # identity, purpose, non-negotiables (§36)
├── ARCHITECTURE.md                 # this proposal, evolved into living doc
├── DATA_MODEL.md                   # entities, relationships, authority states
├── DECISIONS.md                    # architecture decision records (ADRs)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── TESTING.md
├── ACCESSIBILITY.md                # WCAG 2.2 AA approach & checklist
├── SECURITY.md                     # auth, secrets, confidentiality posture
├── SCS_EXECUTIVE_SNAPSHOT_SCHEMA.md
├── docs/
│   ├── seed-data.md                # provenance + "this is demo data" labeling
│   └── phase-0-architecture.md     # frozen copy of the approved Phase 0
│
├── app/                            # React + TypeScript client (Vite)
│   ├── src/
│   │   ├── domain/                 # entities, Zod schemas, authority logic — NO UI
│   │   │   ├── entities/           # OSSystem, Product, Publication, ...
│   │   │   ├── schemas/            # Zod validators (import/export/seed)
│   │   │   ├── authority.ts        # reported→verified→proposed→approved→superseded
│   │   │   └── nextAction.ts       # recommended-next-action logic
│   │   ├── storage/                # StorageAdapter interface + adapters
│   │   │   ├── StorageAdapter.ts
│   │   │   ├── localAdapter.ts     # Dexie/IndexedDB (v0.1)
│   │   │   └── httpAdapter.ts      # PHP API (Phase 3+)
│   │   ├── design-system/          # tokens + primitive components
│   │   │   ├── tokens.css          # color, spacing, radius, motion variables
│   │   │   └── components/         # Button, Card, StatusBadge, AuthorityBadge...
│   │   ├── features/               # one folder per nav section (§7)
│   │   │   ├── overview/  os/  products/  publications/  decisions/
│   │   │   ├── canonical/  ai-work/  benchmarks/  risks/  update-log/
│   │   │   ├── cheatsheet/  settings/  notifications/
│   │   ├── seed/                   # labeled seed data (§33)
│   │   ├── app/                    # shell, routing, providers
│   │   └── lib/                    # search, filtering, export/import, a11y utils
│   ├── tests/                      # unit + e2e
│   └── (vite/ts/tailwind configs)
│
├── server/                         # PHP API — scaffolded in Phase 0, built later
│   ├── public/                     # web root (serves built app/ + /api)
│   ├── src/                        # controllers, auth, notifications, email
│   ├── migrations/                 # DB schema (mirrors DATA_MODEL.md)
│   └── workers/                    # cron: digest jobs, push retries, link health
│
└── .github/workflows/              # CI: typecheck, test, build, a11y, deploy artifact
```

Rule enforced by structure: **UI, domain, and storage are cleanly separated** (§31). Domain logic never imports React; storage is swappable behind one interface.

---

## 4. Domain Model

The 18 entities from §24, with primary fields and relationships. Every entity carries **source integrity fields** (§23): `sourceType, sourceTitle, sourceLocation, sourceVersion, dateObserved, dateRecorded, authorityStatus, confidence, notes` — so *reported* is never silently promoted to *approved*.

**Shared authority states (constitutional invariant):** `Reported → Verified → Proposed → Approved → Superseded`. Rendered distinctly everywhere; a proposed record can never *look* approved.

| Entity | Key fields | Key relationships |
|---|---|---|
| **OSSystem** | name, acronym, purpose, authority, version, status, owner, effectiveDate, governingDoc, lastReview, nextReview, changeHistory | → dependencies (OSSystem), relatedProducts, Artifacts |
| **Product** | name, ecosystem, purpose, lifecycleStage, status, owner, currentBenchmark | → Publications, Decisions, Artifacts, Assignments, Risks, NextAction |
| **Publication** | family (Experience/Workflow/Component), volume, title, purpose, status, version, currentPhase, currentGate, confidentiality, supersededVersion | → Product, PublicationPhase[], Gate, Decisions, CanonicalStatements, Artifacts, owner(AICollaborator) |
| **PublicationPhase** | name, order, gateCriteria, status | → Publication, Gate |
| **Gate** | name, requiresOwnerApproval, status, decisionRef | → Publication/Phase, ReviewItem |
| **Decision** | decisionId, title, area, decisionClass, question, status, ruling, rationale, approvingAuthority, date, downstreamImpact, reviewTrigger | → affectedArtifacts, supersededDecision, Product/OSSystem |
| **CanonicalStatement** | id, statement, classification (I/II/III), stableName, primaryVoice, secondaryVoice, firstAppearance, scope, paraphrasingRule, status, provenance, reclassificationHistory | → approvingDecision, relatedConcept, Publications |
| **CanonicalConcept** | name, canonicalDefinition, scope, originatingProduct, authority, status | → relatedStatements, relatedDesignDevices, Publications |
| **AICollaborator** | name, role, assignedProduct, currentPhase, currentTask, latestOutput, waitingState, lastSynced, sourceRef, openQuestions, expectedNextAction, conflictsDetected | → Assignment[], Product, Artifact |
| **Assignment** | collaborator, product, artifact, phase, task, waitingState, expectedOutput | → AICollaborator, Product, Artifact |
| **Benchmark** | name, artifact, type, product, version, dateEstablished, establishingDecision, governs, doesNotGovern, replacementBenchmark, status | → Artifact, Decision, Product |
| **Risk** | type, severity, affectedArea, evidence, whyItMatters, recommendedCorrection, owner, status | → related ST‑DIVERGENCE Update, affected entities |
| **Update** | code (ST‑SYNC/LOCK/BENCHMARK/REVIEW/DIVERGENCE/OS), date, summary, source, scope, affectedSystems, downstreamEffects, decisionsCreated, documentsUpdated, followUp, syncStatus | → Decisions, Artifacts, any affected entity |
| **SourceReference** | sourceType, title, location, version, dateObserved, dateRecorded, authorityStatus, confidence | → any entity (polymorphic) |
| **Artifact** | name, type, area, authorityStatus, version, owner, sourceType/title/location, storageProvider, folderPath, openLink, repoURL, localPath, productionURL, lastVerified, linkHealth, accessNotes, confidentiality | → Publication, Decision, Benchmark, Assignment |
| **ReviewItem** | title, kind (approval gate / decision / conflict / elevation …), priority, entityRef, deepLink, status | → any entity; feeds "Needs Your Review" |
| **NextAction** | recommendation, why, affectedScope, requiresOwnerApproval | → Product/OSSystem/Publication |
| **Relationship** | fromEntity, toEntity, type | generic typed edges for the Relationship Viewer |

*(The Notification event model from §24 is a further entity added in Phase 3 with the exact fields the spec lists — ID, eventType, priority, privacy‑safe preview, deep link, channels requested/delivered, dedup key, audit history, etc.)*

**Data rule:** entities use clear IDs and explicit relationships — **the product model is never hidden inside unstructured JSON blobs** (§24).

---

## 5. Information Architecture

Primary navigation, exactly as §7 specifies, in plain durable language (no obscure internal dev terms):

1. **Overview** — SCS Home / Executive Snapshot
2. **ShockTheory OS** — system registry (SAPDOS, STACL, STP, #SOS, future)
3. **Products** — Product Command Pages (Kidlytics, CivicAI, …)
4. **Publications** — three families, phase‑gated
5. **Decisions** — governed decision register
6. **Canonical Language** — three‑tier statements + concepts
7. **AI Work** — collaborator coordination surface
8. **Benchmarks** — benchmark registry
9. **Risks & Divergence** — governed risk view
10. **Update Log** — chronological, filterable, sync‑code driven
11. **Settings** — folder paths, notifications, backup/restore, preferences

Plus two cross‑cutting surfaces the spec treats as first‑class:

- **Cheatsheet View** — a distinct, printable, exportable interface **generated from the same live data** (never a maintained duplicate).
- **Notification Center / Needs Your Review** — governed awareness, deep‑linking to the exact record.

**Overview / SCS Home** answers the five questions without navigation: Current Operating State · Needs Your Review (genuine gates only) · Active Products · Current Publications · AI Work · Recent Constitutional Changes · Current Risks · One Recommended Next Action — each with direct links to the authoritative artifact/folder.

**Responsive intent (§29 + design spec §20):** Desktop = Mission Control (nav + workspace + optional context panel); Tablet = working executive notebook; Mobile = trusted companion with drawer nav, stacked cards, no squeezed desktop tables, no horizontal overflow.

---

## 6. Initial Component Inventory

One coherent component family (shared spacing, radius, typography, interaction, motion, color logic — §28 / design spec §12). Built on accessible primitives.

**Foundational:** Page Header · Button system (Primary blue‑gradient / Secondary glass / Tertiary text / Danger‑rare) · Status Badge · **Authority Badge** (the constitutional "is this approved?" signal) · Filter Bar · Search · Empty State (every empty state *teaches*: why, what's next, how to proceed) · Review Drawer.

**Entity cards & rows:** System Card · Product Card · Publication Card · Decision Row · **Gate Timeline** · AI Assignment Card · Benchmark Card · Risk Card · Update Entry · Source Reference (with Open Source / Open Folder / Copy Path / link‑health state) · Next Action Card.

**Composite surfaces:** Executive Snapshot · Cheatsheet Section · Relationship Viewer · Notification item.

**Motion (design spec §9):** communicates *what changed*, not entertainment — soft easing, short, purposeful; no bounce/spin; Reduced Motion fully supported.

**Design tokens** (from AI Platform Builder benchmark, pending accessibility validation): Electric Blue `#418FFF`, Steel Blue `#3169A2`, Soft Sky `#81B8E7`, Soft Periwinkle `#8FA9FF`, Deep Navy `#161B25`, Midnight Slate `#203763`; text `#F9F9F9 / #B9B9B9 / #444750`. Brand icon accent (indigo `#694fa0`) from the existing SCS assets is honored. **All contrast pairs get WCAG validation before lock** (design spec §4 / §19).

---

## 7. Persistence & Migration Strategy

**v0.1 (local‑first, no server required):**
- All data behind a single **`StorageAdapter`** interface. Default implementation = **IndexedDB (Dexie)** — durable, survives reloads, not a browser‑only dead end.
- **Seed data** included and clearly labeled as demo/reviewable (§33).
- **JSON import/export** and **full workspace backup/restore**, each validated by Zod on the way in (sanitize imports — §32).
- **Schema version** stamped into every export; **destructive‑reset guard** (explicit confirmation, backup‑first).

**Migration path to production (Phase 3+, required before publishing at `shocktheoryos.com`):**
- Same domain + same `StorageAdapter` interface → swap `localAdapter` for **`httpAdapter`** against the PHP API. No UI or domain rewrite.
- **PHP + relational DB** (MySQL/MariaDB or Postgres) with migrations mirroring `DATA_MODEL.md`.
- **Authenticated private workspace** (nothing confidential is ever public).
- Import the JSON backup format directly into the hosted DB → clean local‑to‑hosted cutover.

This directly satisfies §25's "must migrate to a hosted database" and "do not lock into browser‑only storage with no migration path."

---

## 8. Major Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **PHP vs. Node tension** derails deployment. | Resolved in §2.1: static SPA + PHP API. Phase 0 scaffolds `server/` and documents the deploy so it's never a late surprise. |
| R2 | **Polished UI makes *proposed* look *approved*** (violates Non‑Negotiable #4). | Authority state is a first‑class field on every entity + a dedicated Authority Badge + distinct visual treatment; enforced in the design system, tested. |
| R3 | **Inventing data to look complete** (Non‑Negotiable #11). | Seed data labeled demo; `confidence` + `authorityStatus` on every record; unresolved info stays *visible*, never fabricated. |
| R4 | **Cheatsheet drifts into a maintained duplicate** (#14). | Cheatsheet is a pure *view* over live data — no separate store, generated on demand. |
| R5 | **Confidential content exposure** (legal/patent/company). | No public exposure of authenticated content; privacy‑safe notification previews; secrets never in repo; auth designed before hosted launch. |
| R6 | **Notification system complexity** (web push, email deliverability, cron on PHP host). | Deferred to Phase 3; Phase 0 only *recommends* email provider + SPF/DKIM/DMARC + scheduled‑job approach for review — not built yet. |
| R7 | **Scope creep** — spec is large; risk of over‑building v0.1. | Strict phase gates (§35); "Clear ships over clever" (#15); stop for review at every phase. |
| R8 | **Local path variability across Macs/iCloud.** | Store the iCloud absolute path as a *configurable setting*, never hard‑coded (§21). |
| R9 | **Broken/moved/permission‑restricted source links.** | `linkHealth` + `lastVerified` on every Artifact; broken links visibly flagged, not hidden. |

---

## 9. Open Product Owner Decisions

These need your ruling. My recommendation is marked **▶**. None of them block me from starting Phase 1 shell work *except D1*.

- **D1 — Approve this stack?** ▶ React + TypeScript + Vite (static build) client, `StorageAdapter` abstraction, PHP + relational DB for the hosted/private/notification layer later. *(Yes / adjust / discuss.)*
- **D2 — v0.1 scope: local‑first only, or include the hosted/auth/notification layer now?** ▶ **Local‑first for v0.1**, with `server/` scaffolded and the deploy documented; build auth + notifications in Phase 3+. Fastest path to a usable, demonstrable system.
- **D3 — PHP framework:** ▶ **Slim 4** (thin, matches "thin API" intent) vs. Laravel (heavier, batteries‑included). Decide at Phase 3; noting now.
- **D4 — Database engine:** ✅ **RESOLVED (2026‑07‑24).** Host is **Nestify** (managed PHP cloud hosting); database is **MySQL**. Architecture confirmed compatible: Nestify serves the static SPA build, runs the PHP API, hosts MySQL, and supports cron + SSH deploys for the Phase‑3 notification/digest workers.
- **D5 — Email provider** for transactional/digest mail on a PHP host: options to compare in Phase 3 (e.g., Postmark / Amazon SES / SMTP relay) with SPF/DKIM/DMARC. ▶ I'll bring a recommendation, not a build, when we reach it.
- **D6 — Palette lock:** the benchmark hex values are *direction*; ▶ I run WCAG 2.2 AA contrast validation and bring you the adjusted, locked token set before any screen is finalized.
- **D7 — Seed‑data accuracy:** I will seed only what the spec states (Kidlytics/CivicAI, the three Kidlytics playbooks with their stated statuses, The Creed / The Promise / The Approval Boundary, etc.) and label all of it reviewable. ▶ Confirm you'll correct seed values rather than have me infer beyond the spec.

---

## 10. Phase 0 Execution Plan

Phase 0 is **documentation + scaffolding only** — no product features. On your approval of this proposal, Phase 0 delivers:

1. **Repository initialized** (`git init`, structure from §3, `.gitignore`, no secrets) with the required docs stubbed: `README`, `PRODUCT_CHARTER`, `ARCHITECTURE`, `DATA_MODEL`, `DECISIONS`, `CHANGELOG`, `CONTRIBUTING`, `TESTING`, `ACCESSIBILITY`, `SECURITY`, `SCS_EXECUTIVE_SNAPSHOT_SCHEMA`, `docs/seed-data.md` (§36).
2. **`DATA_MODEL.md`** — the full typed entity/relationship model (expansion of §4) with authority states and source‑integrity fields.
3. **`ARCHITECTURE.md`** — this proposal as the living architecture doc, incl. the static‑SPA‑on‑PHP deployment recommendation and the server/db/email/cron requirements for `shocktheoryos.com` (§21, §25, §32 obligations).
4. **Design‑token draft + accessibility validation plan** — the blue/indigo system with a WCAG contrast pass (D6).
5. **Component inventory + navigation map** (expansion of §5–§6) as the build contract for Phase 1.
6. **Migration & persistence spec** — `StorageAdapter` contract, JSON backup format + schema version, local‑to‑hosted plan.
7. **Toolchain config committed but inert** — TypeScript/Vite/Tailwind/test scaffolding that compiles an empty shell, so Phase 1 starts on solid ground.
8. **ADR‑0001** in `DECISIONS.md` recording the stack decision and the PHP/Node resolution.

Then **stop for Product Owner review** before Phase 1 (Functional Shell + Artifact Registry). I will not build beyond the approved phase.

---

### What I need from you now

A simple **"approved"** (optionally with answers to D1–D7), **or** tell me what to change. On approval I'll begin Phase 0 exactly as scoped above and stop again before writing any feature UI.

*No constitutional records were created or modified in producing this proposal. Nothing here is presented as approved truth; the benchmark palette and seed values remain subject to your validation.*
