# SCS Phase 10 Implementation — Hosting, Security & Production Operations

**Deliverable:** ST-DLV-2026-023 (canonical identifier Product-Owner-pending)
**Directive:** Product Owner Phase 10 Implementation Authorization Directive — *Authorize SCS Phase 10 Implementation — Hosting, Security, and Production Operations*
**Platform:** DigitalOcean (Product-Owner-selected)
**Prepared by:** #SCS
**Disposition:** **In review** — submitted to the Phase 10 Implementation Review gate (rgate-024).
**Lifecycle status:** **Implementation Complete (Submitted) — Product Owner Review & Acceptance Pending; Review Gate 024 Open.** These are separate governed lifecycle states: #SCS's *implementation completion* and *submission* are distinct from *Product Owner review*, *Product Owner acceptance*, *Review Gate closure*, *deployment authorization*, and *production activation* — none of which this record asserts. Deployment authorization is a **later** event that becomes relevant only **after** acceptance; it is not the immediate next step.
**Date:** 2026-07-26

> **Boundary.** This is implementation only. **No deployment, DNS, TLS, production activation, public launch, DigitalOcean account action, secret-value entry, or brand-asset placement occurred.** The DigitalOcean app has not been created and no infrastructure was provisioned. Deployment authorization is the Product Owner's next, separate decision.

---

## 1. Precheck
- Branch `main`; Phase 10 Planning closed; Phase 10 Implementation authorized (this directive).
- Frontend (Phases 6–9) accepted and green; backend accepted and CI-verified.
- Repository authority: yes (implementation owner). Deployment/DNS/TLS/production authority: **none**.
- Local PHP/MySQL: not available — backend runtime verification is via **CI** (`.github/workflows/phase5-verify.yml`: PHP 8.2 + MySQL 8; lint → migrate → PHPUnit → boot → health → e2e).

## 2. Files created / modified
| File | Change |
|---|---|
| `.do/app.yaml` | **New.** DigitalOcean App Spec: `scs-web` static site (`/app`), `scs-api` PHP service (`/server`, health `/api/health`), `scs-migrate` PRE_DEPLOY job, `scs-db` managed MySQL 8. No `domains:` (DNS not authorized); autodeploy off; secret values never committed. |
| `server/src/Config.php` | Added `sslCa` (managed-DB TLS CA path), `isProduction()`, `productionReadiness()` (pure fail-closed check), `isProductionReady()`. |
| `server/public/index.php` | Replaced the hard production refusal with **fail-closed readiness** (503 + requirement names, no values); added baseline security headers; made the destructive `/api/admin/reset` **dev/test-only**; `/api/health` now returns `ready`. |
| `server/src/Database.php` | Managed-DB **TLS**: applies `PDO::MYSQL_ATTR_SSL_CA` when `DB_SSL_CA` is set (dev/test unchanged). |
| `server/migrations/migrate.php` | Forward-only `apply`/`status` now permitted in production (pre-deploy job); destructive `reset` refused in production; fails closed on incomplete production config. |
| `server/tests/ConfigTest.php` | **New.** 7 unit tests for the production-readiness contract (no DB; runs in CI). |

## 3. Implementation summary
Production becomes a **supported, fail-closed** environment without weakening any governance control. The application refuses to serve in production if required configuration is missing (rather than falling back to development defaults), the destructive reset surface is removed in production, managed-database TLS is supported, and the pre-deploy migration job is production-capable while the destructive reset path is not. Constitutional derivation, the audit hash-chain, governed commands, authentication/authorization, operational awareness, and the client presentation layer are **unchanged**.

## 4. Build & test results
- **Frontend:** typecheck clean · 44/44 tests · build succeeds.
- **Backend:** verified in CI (this commit) — `php -l` across `server/`, `composer` install, migrations apply + status under `SCS_ENV=test`, PHPUnit (incl. the new `ConfigTest`), server boot, `/api/health` asserted healthy, and the Phase 5–9 e2e suite. *(Local PHP/MySQL unavailable; CI is the runtime channel.)*

## 5. Migration & health-check design
- **Migrations:** forward-only, ordered `0001…0005`, tracked in `schema_migrations`; runner `php migrations/migrate.php` as a **PRE_DEPLOY** job with backup-before-migrate at deploy time. `reset` is dev/test-only.
- **Health:** `GET /api/health` → `{status, env, schemaVersion, ready}`, HTTP 200. `ready` reflects production-config completeness (always true in dev/test). DO health check targets this path.

## 6. DigitalOcean configuration summary
- `scs-web` static site from `/app` (`npm ci && npm run build` → `dist`, SPA catch-all).
- `scs-api` PHP service from `/server` (`heroku-php-apache2 public/`, health `/api/health`).
- `scs-migrate` PRE_DEPLOY job (`php migrations/migrate.php`).
- `scs-db` managed MySQL 8 (dev in-spec; production cluster provisioned separately, gated).
- **Not expressed (deliberate):** no `domains:` (DNS/TLS gated); `scs-notify` recurring trigger deferred to a DO Function scheduled trigger (App Platform jobs are deploy-hooks, not cron) — a deployment-finalization item.

## 7. Environment variables & secrets (names only — no values)
| Variable | Purpose | Sensitivity | Source at deploy |
|---|---|---|---|
| `SCS_ENV` | environment mode (`production`) | Config | app spec |
| `DB_DSN` | PDO DSN | Config | managed-DB binding `${scs-db.*}` |
| `DB_USER` | database user | Config | `${scs-db.USERNAME}` |
| `DB_PASSWORD` | database password | **Secret** | `${scs-db.PASSWORD}` (Product Owner / managed DB) |
| `DB_SSL_CA` | path to managed-DB CA cert | Config (path) | materialized from `${scs-db.CA_CERT}` at deploy |
| `DERIVATION_VERSION` | Phase 7 derivation stamp | Config | app spec |
| `VITE_SCS_API_BASE` | frontend→API base (build-time) | Config | app spec (finalize to API host) |
| `RESET_TOKEN` | dev/test reset guard | **Secret** | **not used in production** (endpoint disabled) |

**#SCS entered no secret values.** `DB_PASSWORD` and any Product-Owner-controlled secret remain empty in the repository and are supplied through DigitalOcean at deploy time by the Product Owner.

## 8. Security & rollback validation
- **Fail-closed production:** missing/dev-default DB config → 503, no serving. Verified by `ConfigTest`.
- **Reduced attack surface:** destructive reset endpoint does not exist in production.
- **TLS to DB:** CA-verified connection when `DB_SSL_CA` set.
- **Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` on all responses.
- **Preserved:** Argon2id + server sessions (HttpOnly/Secure/SameSite=Strict), PO-only approval boundary, audit hash-chain + `/api/audit/verify`, derivation parity, error details off in production.
- **Rollback:** forward-only migrations + backup-before-migrate; redeploy prior release + restore pre-migration backup (exercised restore/DR test is a deploy-time requirement, not performed here).

## 9. Deployment-readiness status
Implementation is **complete and self-consistent**; the repository now contains a deployable, production-capable configuration. **Not deployed.** Deployment requires Product-Owner-controlled events (below).

## 10. Remaining Product Owner actions (in order)
1. **Accept** this Phase 10 implementation (rgate-024).
2. Provision DigitalOcean infrastructure (create app from `.do/app.yaml`; provision managed MySQL) — account action.
3. Set secret values in DigitalOcean (`DB_PASSWORD` / managed-DB binding) — **Product Owner only**.
4. Finalize `VITE_SCS_API_BASE` and materialize the managed-DB CA to `DB_SSL_CA`.
5. Issue a **Deployment Authorization** → build + pre-deploy migrate + verify health/audit/parity.
6. Add DNS (CNAMEs) + managed TLS — separate DNS authorization.
7. Production validation → **Production Activation / launch** decision.

## 11. Exact next directive required
**Product Owner Deployment Authorization Directive** (after accepting this implementation) — authorizing app creation, managed-DB provisioning, secret entry, and the first governed deploy to a non-production/staging validation environment. DNS/TLS and production activation remain separate after that.

## 12. Confirmation
No deployment, DNS change, TLS change, production activation, or public launch occurred. No DigitalOcean account action, no secret-value entry, no managed-database provisioning, and no brand-asset placement occurred. `SCS-Brand-Assets/` remains untracked and unplaced. Baseline v1.0 unaltered; canonical identifiers remain Product-Owner-pending; #SCS did not self-accept.
