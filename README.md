# ShockTheory Constitutional System (SCS)

**The executive operating environment for ShockTheory OS.**

SCS is a living, always-current, *governed* view of everything ShockTheory OS contains —
constitutional systems, products, publications, decisions, canonical language, AI collaborators,
benchmarks, risks, and next actions. It answers, immediately and without hunting through AI
conversations:

> Where are we? · What is authoritative? · What changed? · What is waiting on me? · What should happen next?

SCS is **not** a project manager, task app, spreadsheet, chat client, or a second source of
constitutional truth. It is a governed index and command center that **displays** authority — it
never manufactures it.

- **Product Owner:** Sonja Ross
- **Status:** v0.1 MVP · Phase 0 (Architecture) complete, awaiting Phase 1
- **Production:** https://shocktheoryos.com · Host: Nestify (PHP) · DB: MySQL
- **Classification:** Confidential — Internal Use Only

## Repository layout

| Path | What |
|---|---|
| `app/` | React + TypeScript client (Vite). Builds to **static assets** — no Node in production. |
| `server/` | PHP + MySQL API. Scaffolded in Phase 0; built in Phase 3+ (auth, hosted data, push, email, cron). |
| `docs/` | Seed-data provenance, frozen Phase 0 architecture. |
| Root `*.md` | Charter, architecture, data model, decisions, testing, accessibility, security. |

## Governing documents

Start here: [`PRODUCT_CHARTER.md`](PRODUCT_CHARTER.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) ·
[`DATA_MODEL.md`](DATA_MODEL.md) · [`DECISIONS.md`](DECISIONS.md) ·
[`ACCESSIBILITY.md`](ACCESSIBILITY.md) · [`SECURITY.md`](SECURITY.md)

## Developing the client

> **iCloud note:** this folder is synced by iCloud Drive. `node_modules/` is gitignored, but
> installing dependencies inside an iCloud folder can be slow and noisy. For active development,
> prefer a clone of the GitHub repo in a **non-synced** local path. The canonical source of truth
> is GitHub: `git@github.com:shocktheory/SCSGithub.git`.

```bash
cd app
npm install
npm run dev        # local dev server
npm run typecheck  # strict TypeScript, no emit
npm test           # Vitest unit tests
npm run build      # → app/dist (static assets for the Nestify host)
```

Requires Node 20+ (see `.nvmrc` → 24). Node is a **build-time** tool only; production serves
the pre-built static output.

## Phase plan

| Phase | Scope | State |
|---|---|---|
| 0 | Architecture, data model, docs, toolchain scaffold | ✅ done — awaiting review |
| 1 | Functional shell, ShockTheory OS registry, Products, Publications, seed data, local persistence | pending |
| 2 | Decisions, Canonical Language, Benchmarks, Risks, Update Log, source references, authority states | pending |
| 3 | AI Work, update intake, Needs Your Review, next action, Cheatsheet, exports, notifications | pending |
| 4 | Accessibility, responsive, dark mode, search/filter, tests, import/export recovery, release | pending |

Every phase stops for Product Owner review. **Do not build beyond the approved phase.**
