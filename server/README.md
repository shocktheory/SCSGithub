# SCS Server (PHP API) — scaffold only

This directory is **scaffolded in Phase 0 and built in Phase 3+**. It is intentionally
empty of logic today so the deployment story is explicit from the start, not a late surprise.

## Responsibilities (later phases)

The static React client (`../app`) handles all UI and, in v0.1, all data (local IndexedDB).
This PHP layer is introduced only when SCS needs a server:

- **Authenticated private workspace** — no confidential content is ever public.
- **Hosted data** — MySQL, schema mirroring `../DATA_MODEL.md` (`migrations/`).
- **Web Push** — standards-based VAPID push via a service worker in the client.
- **Transactional & digest email** — provider TBD (Phase 3 decision D5), with SPF/DKIM/DMARC.
- **Scheduled jobs** (`workers/`) — cron-driven digests, push retries, link-health checks.

## Target host

**Nestify** (managed PHP cloud hosting) · **MySQL** · production domain `https://shocktheoryos.com`.
PHP 8.2+. Framework decision (Slim vs. Laravel) is open decision **D3**, to be settled at Phase 3.

## Deployment shape

`public/` is the web root. It serves:
1. the built static client (`app/dist` copied/synced here), and
2. `/api/*` routes handled by PHP.

No Node.js runtime is required in production — the client is pre-built to static assets.

## Rules

- Secrets live in `server/.env` (gitignored) — **never** committed. See `../SECURITY.md`.
- Every external service, credential, env var, and failure mode must be documented here.
