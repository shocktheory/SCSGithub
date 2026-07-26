# SCS DigitalOcean Deployment Configuration Package (Preparation Version 1.0)

**Status:** Preparation / configuration-design only — submitted for Product Owner review. **Authorizes and performs no deployment.**
**Authority:** Product Owner Implementation Preparation Directive — *Prepare the Governed DigitalOcean Deployment Configuration Package (No Deployment Authorization)* (2026-07-26).
**Prepared by:** #SCS. **Basis:** the accepted SCS Infrastructure Requirements Baseline v2.0 + verified repository facts.

> **This package creates nothing.** It provisions no infrastructure, creates no accounts/databases/secrets, applies no configuration, and modifies no DNS. It is documentation + configuration *design* for Product Owner review *before* any future Phase 10 Implementation Authorization.

> **Provider selection is still not made.** DigitalOcean is prepared here as a **candidate** ("use *if* ultimately approved through the governed provider-selection process"). Provider selection remains **Product-Owner-Pending (IR-Q01)**, informed by #SCS-R Assignment #001. Preparing a DO-specific package does not select DO.

> **Production is refused by design (key constraint).** The backend **refuses `SCS_ENV=production`** (accepted invariant IR-A06). Permitting a production environment is itself a code change requiring a future **Phase 10 Implementation Authorization** — it is *not* done in this package and *not* done by setting an env var. Until then, any DO environment would run as `development`/`test` with synthetic, non-confidential data only.

---

## 1. Repository Architecture

**Repository:** `shocktheory/SCSGithub` · **Branch:** `main` · **Structure:** governed **monorepo**.

```
shocktheory/SCSGithub  (root — governance/documentation; NO deployment manifest at root, by design)
├── *.md                      constitutional doctrines, phase packages, baselines, DECISIONS/ARCHITECTURE/…
├── constitution/ docs/ scripts/   governance content
├── .github/workflows/        CI runtime verification (PHP 8.2 + MySQL 8)
├── app/          ← FRONTEND component  (React 18 + TypeScript + Vite static build)
│   ├── package.json          Node manifest  →  build to app/dist/
│   └── src/ …
└── server/       ← BACKEND component   (PHP 8.2 + Slim 4 + PDO + MySQL 8)
    ├── composer.json         PHP manifest (name: shocktheory/scs-server)
    ├── public/index.php      front controller (document root)
    ├── migrations/*.sql + migrate.php
    └── src/ …
```

- **Frontend location:** `/app` (static site; output `app/dist`).
- **Backend location:** `/server` (PHP web service; document root `server/public`).
- **Required source directories:** `app` and `server` — each must be set explicitly on its component (this is why DigitalOcean's *root* scan returned "No components detected": there is no root manifest, by design).
- **Rationale for the monorepo:** governance records (the constitutional source of truth) and application code are versioned together so every code change is traceable to its governed decision, and CI verifies the whole platform in one pipeline. **Deployment must build only `app/` and `server/`** — the governance documentation at the root is **not** served to production.

## 2. DigitalOcean App Platform Configuration (proposed)

Two deployable components + one managed database + governed jobs. **All values below are proposed for review; none are applied.**

| Component | Type | Source dir | Runtime / buildpack | Notes |
|---|---|---|---|---|
| `scs-web` | **Static Site** | `/app` | Node (Vite) | build → `dist/`; SPA (HashRouter → no server rewrites needed) |
| `scs-api` | **Web Service** | `/server` | PHP (Heroku PHP buildpack) | document root `public/`; health check `GET /api/health` |
| `scs-migrate` | **Pre-deploy Job** | `/server` | PHP | runs migrations before a new release goes live |
| `scs-notify` | **Scheduled Job** (worker) | `/server` | PHP | periodic notification generation (Phase 9) |
| `scs-db` | **Managed MySQL 8** (dependency) | — | — | *documented only; not created* |

**Health-check recommendation:** `scs-api` → HTTP `GET /api/health` (this endpoint exists and returns `{status: ok, env, schemaVersion}`); success = HTTP 200.

### Draft App Spec (`.do/app.yaml`) — **DRAFT ONLY, intentionally NOT written to `.do/app.yaml`**

> This draft is embedded here for review. It is deliberately **not** placed at the `.do/app.yaml` path so DigitalOcean cannot auto-detect or apply it. Committing a real `.do/app.yaml` is deferred to a future **authorized** implementation step. Values marked `# PENDING` require Product Owner decisions (provider, region, sizes, DB) and must not be assumed.

```yaml
# DRAFT — NOT APPLIED. For Product Owner review only.
name: scs                         # PENDING final app name
region: nyc                       # PENDING (data residency IR-Q11 unresolved)

static_sites:
  - name: scs-web
    source_dir: /app
    github:
      repo: shocktheory/SCSGithub
      branch: main
      deploy_on_push: false        # autodeploy DISABLED (per directive)
    build_command: npm ci && npm run build
    output_dir: dist
    catchall_document: index.html  # SPA fallback
    envs:
      - key: VITE_SCS_API_BASE
        scope: BUILD_TIME
        value: ${scs-api.PUBLIC_URL}   # frontend RemoteAdapter → backend

services:
  - name: scs-api
    source_dir: /server
    github:
      repo: shocktheory/SCSGithub
      branch: main
      deploy_on_push: false
    build_command: composer install --no-dev --optimize-autoloader
    run_command: heroku-php-apache2 public/   # PENDING: confirm DO PHP buildpack run cmd
    http_port: 8080
    instance_count: 1               # PENDING sizing
    instance_size_slug: basic-xxs   # PENDING sizing
    health_check:
      http_path: /api/health
    envs:
      - key: SCS_ENV
        value: development          # 'production' is REFUSED by design until authorized
      - key: DB_DSN
        value: ${scs-db.DATABASE_URL}   # PENDING: DSN mapping to PDO mysql: form
      - key: DB_USER
        value: ${scs-db.USERNAME}
      - key: DB_PASSWORD
        scope: RUN_TIME
        type: SECRET                # PENDING secret (not created here)
      - key: RESET_TOKEN
        scope: RUN_TIME
        type: SECRET                # PENDING secret (dev/test only; reset is guarded)
      - key: DERIVATION_VERSION
        value: "1.0.0"

jobs:
  - name: scs-migrate
    kind: PRE_DEPLOY                # run migrations before release
    source_dir: /server
    run_command: php migrations/migrate.php
    envs: [ *same DB envs as scs-api ]

workers:                            # OR a scheduled component, per DO capability (PENDING)
  - name: scs-notify
    source_dir: /server
    run_command: |                  # PENDING: DO scheduling mechanism (cron vs worker loop)
      php -r 'file_get_contents(getenv("SCS_SELF_URL")."/api/notifications/generate");'

databases:
  - name: scs-db                    # documented dependency; NOT created here
    engine: MYSQL
    version: "8"                    # PENDING plan/size
```

## 3. Deployment Commands

Clearly classified per the directive:

| Command | Value | Status |
|---|---|---|
| **Build (frontend)** | `npm ci && npm run build` (in `/app`) | **Proposed** — matches CI; **requires future authorization** |
| **Build (backend)** | `composer install --no-dev --optimize-autoloader` (in `/server`) | **Proposed** — **requires future authorization** |
| **Start (backend)** | `heroku-php-apache2 public/` (DO PHP buildpack) | **Proposed — PENDING** (confirm DO's PHP run command / buildpack) — **requires future authorization** |
| **Worker (notifications)** | invoke `POST /api/notifications/generate` on a schedule | **Proposed — PENDING** scheduling mechanism — **requires future authorization** |
| **Scheduler (backups/reviews)** | periodic backup + review jobs | **Proposed — PENDING** — **requires future authorization** |
| **Migration** | `php migrations/migrate.php` (in `/server`, pre-deploy) | **Proposed** — real runner exists — **requires future authorization** |

**Product-Owner-approved commands: NONE.** No command in this package is approved for execution; each requires a future Phase 10 Implementation Authorization (deployment authority is Product-Owner-Pending, IR-Q06).

## 4. Environment Variable Inventory *(no secret values — name / purpose / sensitivity / component)*

| Variable | Purpose | Sensitivity | Component |
|---|---|---|---|
| `SCS_ENV` | environment mode; **must not be `production`** until authorized | Config | scs-api, scs-migrate, scs-notify |
| `DB_DSN` | PDO DSN (`mysql:host=…;dbname=…;charset=utf8mb4`) | Config (host/db non-secret) | scs-api, scs-migrate, scs-notify |
| `DB_USER` | database user | Config | scs-api, scs-migrate, scs-notify |
| `DB_PASSWORD` | database password | **Secret** | scs-api, scs-migrate, scs-notify |
| `RESET_TOKEN` | guards the dev/test admin reset endpoint | **Secret** | scs-api |
| `DERIVATION_VERSION` | Phase 7 derivation version stamp | Config | scs-api |
| `VITE_SCS_API_BASE` | frontend → backend API base (RemoteAdapter) | Config (build-time) | scs-web |

*No secret values are included. Secrets are not created by this package.*

## 5. Production Dependency Inventory *(relationships only — nothing created)*

| Dependency | Required? | Role |
|---|---|---|
| **MySQL 8** (managed) | **Required** | primary persistence (all governed collections + audit_log + derivations + notification_history) |
| **Object/file storage** | Required (later) | exports/backups (backup architecture IR-A10) |
| **Cache (Redis)** | Optional | future derivation caching (IR-P10) — not required |
| **Scheduled jobs / worker** | Required | notification generation (Phase 9), backups, periodic reviews |
| **Mail / notification channels** | **Excluded** | external channels (email/SMS/push) are out of scope until separately authorized |
| **Queues** | Not required | workflow routing is derived, not a message queue |
| **External services** | **None** | no external integrations (constitutional exclusion) |

## 6. DNS Readiness Plan *(recommendations only — no DNS changes)*

Assuming the Product-Owner-designated domain **`shocktheoryos.com`**:

| Hostname | Points to | SSL |
|---|---|---|
| `shocktheoryos.com` / `www.shocktheoryos.com` | `scs-web` (frontend) | managed TLS (Let's Encrypt via DO) |
| `app.shocktheoryos.com` | `scs-web` (if app kept off the apex) | managed TLS |
| `api.shocktheoryos.com` | `scs-api` (backend) | managed TLS |
| `staging.shocktheoryos.com` / `api.staging.shocktheoryos.com` | staging components (isolated) | managed TLS |

- **Redirect strategy:** `www` → apex (or apex → `www`), consistent HTTPS redirect.
- **SSL approach:** DigitalOcean-managed certificates (automatic renewal) — monitor TLS expiry (IR-A12).
- **DNS record plan (proposed, not applied):** `CNAME`/`A`/`ALIAS` records per DO's app ingress; `api.` and `staging.` subdomains isolated. **Do not create these records** — DNS modification is not authorized.

## 7. Deployment Sequence *(prerequisite → expected output → rollback point — for review; not executed)*

| Step | Prerequisite | Expected output | Rollback point |
|---|---|---|---|
| **Repository** | provider selected + Phase 10 impl authorized | source dirs configured (`app`, `server`) | n/a (no live change) |
| **Infrastructure** | provider approved | App + components created (not before authorization) | delete app |
| **Database** | infra ready | managed MySQL 8 provisioned; empty | destroy DB (no data yet) |
| **Secrets** | DB ready | `DB_PASSWORD`, `RESET_TOKEN` set in secret store | rotate/revoke |
| **Application** | secrets set | build both components; **run `migrate.php` (pre-deploy)** with backup-before-migration | roll back to prior release; restore pre-migration backup |
| **Verification** | app deployed | `GET /api/health` 200; `GET /api/audit/verify` ok; derivation parity | halt promotion; roll back |
| **DNS** | verification green | hostnames resolve; TLS issued | revert DNS; app still reachable on DO URL |
| **Production Validation** | DNS live | constitutional-integrity checks (re-derivation, audit chain, approval boundary); **exercised restore test** | full rollback + restore |

*Each step is gated by the prior; a failed verification blocks promotion. The whole sequence is **not authorized** — it is the plan to be executed only under a future Phase 10 Implementation Authorization.*

## 8. Risk Assessment

- **Deployment risks:** monorepo mis-detection (mitigated by explicit source dirs); PHP buildpack run-command uncertainty (`heroku-php-apache2 public/` must be verified on DO — marked PENDING); build-time `VITE_SCS_API_BASE` coupling (frontend must know the API URL at build).
- **Operational risks:** notification scheduling mechanism on DO (worker vs cron) unconfirmed; backup/restore not yet exercised (required at implementation, IR-A11).
- **Security risks:** secrets must live in DO's secret store, never in source; `RESET_TOKEN` guards a destructive dev/test endpoint (must be disabled/removed in any real environment); TLS/DNS ownership; least-privilege DB user.
- **Rollback strategy:** DO release rollback + **backup-before-migration** + restore; DNS revert leaves the DO app URL reachable.
- **Production readiness gaps (blocking, by design):** (1) **`SCS_ENV=production` is refused** — enabling production is future authorized code work; (2) **no provider selected** (pending #SCS-R); (3) RPO/RTO, secret-store, data-residency, and access-model decisions are **Product-Owner-Pending**; (4) confidential-data readiness is a **separate** gate; (5) an **exercised** restore/DR test has not been performed.

## 9. Constitutional Boundary Verification

This package explicitly verifies that it:

- **creates no infrastructure** — no App, component, or resource created;
- **provisions no resources** — no compute, database, storage, or scheduler;
- **performs no deployment** — no build/run/migrate executed against any environment;
- **introduces no secrets** — no secret values; secret *names/roles* only;
- **modifies no DNS** — hostnames/records are proposed, not applied;
- **selects no provider** — DigitalOcean prepared as a candidate; selection remains Product-Owner-Pending (IR-Q01), informed by #SCS-R Assignment #001;
- **does not enable production** — `SCS_ENV=production` remains refused by design;
- **remains implementation preparation only** — a design document for Product Owner review.

**The draft app spec is embedded in §2 and was deliberately NOT written to `.do/app.yaml`**, so it cannot be auto-detected or applied. Nothing in this package changes any live system.

---

## Disposition

**SCS DigitalOcean Deployment Configuration Package (Preparation Version 1.0)** — submitted for Product Owner review, suitable to precede a future Phase 10 Implementation Authorization. #SCS created no resources, selected no provider, and executed no deployment. All commands, hostnames, and the app spec are **proposed** and **require future Product Owner authorization** before any execution.
