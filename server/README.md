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

## Phase 5 status — Backend Foundation & Persistence (dev/test only)

Phase 5 implements the **backend foundation and governed persistence** (Slim 4 + MySQL) — no
authentication rollout, no confidential data, no deployment. `SCS_ENV` must be `development`/`test`;
the app refuses to run with `SCS_ENV=production`.

**Layout**
- `public/index.php` — Slim app + routes (health, collection reads, `/api/commands/upsert`,
  dev delete, admin import/export/guarded-reset, derivation seam).
- `src/` — `Config`, `Database` (PDO), `Repository` (per-collection persistence + optimistic
  concurrency), `Commands` (governed upsert + idempotency), `Importer` (validated import), `Http`.
- `migrations/0001_init.sql` — 23 governed tables (JSON `data` + version/timestamps + generated
  FK columns per the Phase 4 integrity matrix); `migrate.php` — deterministic runner (`apply`,
  `status`, dev-only `reset`).

**Contract:** the endpoints mirror `app/src/storage/testing/inMemoryApi.ts` (the executable
contract the client's `RemoteAdapter` is parity-tested against). To point the client at this API,
build it with `VITE_SCS_API_BASE=http://localhost:8787`.

**Local run (host with PHP 8.2+ & MySQL):**
```
cp .env.example .env    # set DB_* ; keep SCS_ENV=development
composer install
composer migrate         # apply 0001_init
composer serve           # php -S localhost:8787 -t public
```

> **Not runtime-validated in the authoring environment** (no PHP/MySQL there). Executing the
> backend, running migrations, and confirming Nestify capabilities are **host-verification items**
> — see `../PHASE_5_IMPLEMENTATION.md`.

## Rules

- Secrets live in `server/.env` (gitignored) — **never** committed. See `../SECURITY.md`.
- Every external service, credential, env var, and failure mode must be documented here.
