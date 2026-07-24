# SCS Architecture

Living architecture document. The approved Phase 0 proposal is frozen at
[`docs/phase-0-architecture.md`](docs/phase-0-architecture.md); this file evolves with the build.

## 1. Shape

SCS is a **local-first React + TypeScript single-page application** that compiles to **static
assets**, with a **thin PHP + MySQL API** introduced later for the things that must live on a
server (private auth, hosted data, web push, email, scheduled jobs).

```
┌──────────────────────────────────────────────┐
│  Client (app/) — React + TS, built by Vite    │
│  UI  →  domain  →  StorageAdapter             │
│                     ├─ localAdapter (IndexedDB)  v0.1
│                     └─ httpAdapter  (fetch)      Phase 3+
└───────────────────────────┬──────────────────┘
                            │ static build (index.html + hashed JS/CSS)
                            ▼
┌──────────────────────────────────────────────┐
│  Nestify (PHP host) · https://shocktheoryos.com│
│  public/ serves static client + /api/*         │
│  PHP API → MySQL · Web Push · Email · cron      │  Phase 3+
└──────────────────────────────────────────────┘
```

## 2. The PHP ↔ Node resolution (why this shape)

The specification prefers TypeScript/React (§31) **and** requires a PHP-compatible host that must
not assume Node in production (§21, §25, §32). Both hold simultaneously because **Node is a
build-time tool only**. Vite compiles the client to plain static files that any PHP host serves.
Server-side needs are handled by PHP. See [`DECISIONS.md`](DECISIONS.md) ADR-0001.

## 3. Layering (strict separation — §31)

- **`domain/`** — entity types, Zod schemas, authority logic, next-action logic. **No React, no I/O.**
- **`storage/`** — the `StorageAdapter` interface + adapters. The only thing that touches persistence.
- **`design-system/`** — tokens + primitive components. One coherent visual family.
- **`features/`** — one folder per navigation section; composes domain + design system.
- **`lib/`** — search, filtering, export/import, a11y utilities.

Dependency direction is one-way: `features → domain`, `features → design-system`, everything →
`storage` only through the interface. Domain never imports UI.

## 4. Client stack

| Concern | Choice |
|---|---|
| Language / UI | TypeScript (strict) · React 18 |
| Build | Vite (static output, `base: './'`) |
| Routing | React Router (deep-linkable — required for notification links) |
| UI primitives | Radix UI (headless, accessible) styled by the SCS design system |
| Styling | Tailwind + CSS-variable design tokens |
| Data | TanStack Query over `StorageAdapter` |
| Validation | Zod (seed, import, API payloads share one schema) |
| Local persistence | IndexedDB via Dexie |
| Icons | Lucide (thin, rounded, consistent) |
| Tests | Vitest · React Testing Library · Playwright + axe |

## 5. Server stack (Phase 3+)

PHP 8.2+ (framework = open decision D3: Slim vs. Laravel) · MySQL · Web Push (VAPID) · email
provider TBD (D5) with SPF/DKIM/DMARC · cron workers for digests, push retries, link-health.
Host: Nestify. Secrets in `server/.env` only — never committed.

## 6. Deployment

1. CI builds the client → `app/dist` (static).
2. `dist` is published to Nestify's web root (`server/public`).
3. From Phase 3, PHP serves `/api/*` alongside the static app; MySQL holds the hosted workspace.
4. No Node runtime in production. Scheduled jobs run via Nestify cron → PHP workers.

Because the build uses relative asset paths, the same output works from the domain root or a subpath.

## 7. Persistence & migration

One `StorageAdapter` interface, two implementations. v0.1 is local-first (IndexedDB) with portable
JSON backup/restore stamped by `SCHEMA_VERSION`. Migration to hosted MySQL swaps the adapter — no
UI/domain rewrite — and imports the same JSON backup format. Full detail in
[`DATA_MODEL.md`](DATA_MODEL.md).

## 8. Constitutional invariants enforced in code

- **Authority states** (`domain/authority.ts`): `reported → verified → proposed → approved →
  superseded`. Rendered distinctly; proposed can never look approved.
- **Source integrity** on every record (§23): reported vs. verified vs. approved is explicit.
- **No fabricated data**: seed content is flagged `isSeed` and labeled in-UI.
- **Cheatsheet is a view**, computed from live data — never a stored duplicate.

## 9. Accessibility & responsive

WCAG 2.2 AA is a build constraint, not a finishing pass — see [`ACCESSIBILITY.md`](ACCESSIBILITY.md).
Desktop = Mission Control; tablet = executive notebook; mobile = trusted companion (drawer nav, no
horizontal overflow, no squeezed desktop tables).

## 10. Open architecture decisions

Tracked in [`DECISIONS.md`](DECISIONS.md): D3 PHP framework · D5 email provider · light-theme
finalization (Phase 4). Resolved: stack (ADR-0001), host/DB = Nestify/MySQL, palette contrast pass.
