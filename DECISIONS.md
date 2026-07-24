# Architecture Decision Records (ADRs)

Chronological, append-only record of significant technical decisions. This is distinct from the
in-product **Decision Register** (constitutional/product decisions) defined in `DATA_MODEL.md`.

---

## ADR-0001 — Stack & the PHP/Node resolution

- **Date:** 2026-07-24
- **Status:** Accepted (Product Owner approved)
- **Context:** §31 prefers TypeScript + React; §21/§25/§32 require a PHP-compatible host at
  shocktheoryos.com and state Node must not be assumed in production. These appear to conflict.
- **Decision:** Build a React + TypeScript SPA compiled by **Vite to static assets** (Node is a
  build-time tool only), served by the PHP host. Introduce a thin **PHP + MySQL** API in Phase 3+
  for auth, hosted data, web push, email, and cron. All persistence sits behind a single
  `StorageAdapter` interface (`localAdapter` now, `httpAdapter` later).
- **Consequences:** v0.1 ships local-first with no server dependency; the production path is
  documented from day one; migrating to hosted data requires no UI rewrite. No production Node.

---

## ADR-0002 — Host & database

- **Date:** 2026-07-24
- **Status:** Accepted
- **Context:** Needed to confirm the production runtime to validate the deployment architecture (D4).
- **Decision:** Host = **Nestify** (managed PHP cloud hosting); database = **MySQL**; domain =
  https://shocktheoryos.com. PHP 8.2+.
- **Consequences:** Static-SPA-on-PHP + PHP/MySQL API confirmed compatible. Cron + SSH available for
  Phase-3 workers. MySQL dialect assumed for `server/migrations/`.

---

## ADR-0003 — Palette contrast validation (design token lock)

- **Date:** 2026-07-24
- **Status:** Accepted
- **Context:** The benchmark palette (AI Platform Builder doc) is *direction*; §4/§19 require WCAG
  2.2 AA validation before lock (D6).
- **Decision:** Adopt the blue/indigo palette with three validated adjustments recorded in
  `ACCESSIBILITY.md`:
  1. Benchmark "muted text" `#444750` fails as text (1.86:1) → **reclassified to border/divider
     only**; muted **text** token = `#8A93A6` (5.6:1).
  2. Primary CTA uses **deep-navy text on the blue gradient** (5.4–7.6:1); white text fails (3.2:1).
  3. Electric-blue accent **text** on the Midnight-Slate surface (3.7:1) is restricted to large text /
     icons; small accent text on surfaces uses a lighter tint.
- **Consequences:** Tokens in `app/src/design-system/tokens.css` are AA-safe by construction.

---

## Open technical decisions (not yet ADRs)

- **D3 — PHP framework:** Slim 4 (recommended, thin) vs. Laravel. Settle at Phase 3.
- **D5 — Email provider:** compare Postmark / Amazon SES / SMTP relay with SPF/DKIM/DMARC. Phase 3.
- **Light theme finalization:** scoped in tokens; validated and completed in Phase 4.
