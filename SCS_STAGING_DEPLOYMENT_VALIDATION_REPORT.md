# SCS Staging Deployment — Validation Report

**Deliverable:** ST-DLV-2026-024 (canonical identifier Product-Owner-pending)
**Directive:** Product Owner Deployment Authorization Directive — *Authorize First Governed SCS Deployment to a Staging/Validation Environment*
**Prepared by:** #SCS
**Disposition:** **In review** — submitted to the Product Owner Deployment Review gate (rgate-025).
**Date:** 2026-07-27

**Governed state created:** **Staging Deployment Completed — Product Owner Deployment Review Pending.** This creates **no** production authorization, production validation, production activation, or public-launch authority.

---

## 1. Deployment summary
First governed SCS deployment to a **non-production staging/validation** environment on **DigitalOcean App Platform** (region NYC1), live at `https://scs-app-m5jic.ondigitalocean.app`. Runs as **`SCS_ENV=test`** (non-production), synthetic/empty data only, no custom domain, not publicly launched. Deployed from `main` (with the deployment-enablement fixes: `composer.lock`, `.htaccess`, ingress `preserve_path_prefix`). Went live 2026-07-27 ~01:31 UTC.

## 2. Infrastructure created
- App **`scs-app`** in project *ShockTheory Constitutional System*, NYC1.
- **`scsgithub-app`** — Static Site (React/Vite frontend, `/app`).
- **`scsgithub-server`** — PHP web service (Slim, `/server`), 1 instance.
- **`scs-migrate`** — PRE_DEPLOY job (`php migrations/migrate.php`).
- **`scs-db`** — managed **MySQL 8** cluster (`scs-db-cluster`, db-s-1vcpu-1gb).
- Ingress: `/api` → backend (`preserve_path_prefix: true`), `/` → frontend. Autodeploy OFF. Est. ~$12–24/mo + managed DB.

## 3. Managed database status
Managed MySQL 8 **online and connected** — governed reads succeed (empty result sets, DB schema present). Schema-only (no governed data imported — expected for infrastructure validation).

## 4. Migration results
`scs-migrate` PRE_DEPLOY job ran `php migrations/migrate.php`; migrations `0001–0005` applied against the managed cluster (audit/decisions/governance endpoints query successfully; `/api/health` `ready:true`).

## 5. Validation results (live, against the public URL)
| Check | Endpoint | Result |
|---|---|---|
| Health / readiness | `GET /api/health` | **200** `{status:ok, env:test, schemaVersion:0.1.0, ready:true}` ✅ |
| Server derivation authority (P7) | `GET /api/derivation/version` | `{derivationVersion:1.0.0, source:server}` ✅ |
| Derived team (P7) | `GET /api/derived/team` | server-derived, versioned, `inputHash` present ✅ |
| Audit integrity (P8) | `GET /api/audit/verify` | `{ok:true, count:0, brokenAt:null}` ✅ |
| Audit log (P8) | `GET /api/audit` | `{count:0, events:[]}` ✅ |
| Governance visibility (P8) | `GET /api/derived/governance` | derived, read-only view ✅ |
| Operational awareness (P9) | `GET /api/derived/operations` | derived, read-only view ✅ |
| Governed read / DB connectivity | `GET /api/decisions` | `{items:[]}` (DB query OK) ✅ |
| Frontend SPA | `GET /` and `/assets/*.js` | **200** HTML + JS asset served ✅ |
| Command routing | `POST /api/commands/...` | routes through governed command layer (validation enforced) ✅ |

## 6. Backup and rollback evidence
- **Backups:** DigitalOcean managed MySQL provides automated daily backups (managed-service feature; enabled by default on the cluster).
- **Rollback:** App Platform retains prior deployments (console rollback available); migrations are forward-only with a pre-deploy hook.
- **Outstanding:** an **exercised** backup-restore + rollback **drill has not yet been performed** — see §9. Not characterized as completed.

## 7. Security validation results
- Security headers on API responses: `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: no-referrer` ✅
- Public transport: **HTTPS/HTTP-2**, valid TLS (edge-terminated) ✅
- Environment: **`test`** (non-production) ✅ — not represented as production.
- No secret values exposed in any response ✅; secrets held only in DO's store (managed-DB binding).
- **DB TLS:** connection to managed MySQL succeeds (DO enforces encrypted connections). **CA is not pinned** (`DB_SSL_CA` empty) — a hardening item for production (§9).
- **Production fail-closed:** CI-verified (`ConfigTest`); not exercised live (would require `SCS_ENV=production`, out of staging scope).
- Error-detail suppression is production-only; in `test` details are shown (expected).

## 8. Health-check results
DigitalOcean health check on `/api/health` is green; the public `/api/health` returns **200** with `ready:true`.

## 9. Outstanding issues (honest)
1. **Exercised backup/restore + rollback drill** — not yet performed (a directive validation requirement).
2. **DB TLS CA pinning** — `DB_SSL_CA` empty; connection is encrypted but not CA-verified. Materialize the managed-DB CA for production.
3. **`scs-notify` scheduler** — recurring notification trigger not deployed (deferred to a DO Function).
4. **Production fail-closed** not exercised live (CI-verified only).
5. No governed data imported to the server DB (schema-only) — validation of governed reads *with data* would need a workspace import.

None of these blocks the staging deployment's **infrastructure/application** validation; they are items to close before any production consideration.

## 10. Recommendation — *Recommendation Only*
The staging/validation deployment is **live and validated** across health, server-side derivation (P7), audit integrity (P8), governance & operational derivation (P8/P9), DB connectivity, security headers, TLS, and frontend serving. I recommend it as **sufficient to support your Product Owner Deployment Review**, with the §9 items — chiefly an **exercised backup/restore/rollback drill** and **DB-TLS CA pinning** — completed before any production authorization is considered. **The Product Owner determines the disposition; #SCS does not.**

## Confirmation
This is a **non-production** staging environment. **No** production deployment, production validation, production activation, public launch, DNS, TLS/domain, production data, customer use, or production traffic occurred. Governed state created is solely *Staging Deployment Completed — Product Owner Deployment Review Pending*.

*Governance records: adr-026 (deployment execution, closed), dlv-024 / ST-DLV-2026-024 (this report, In review), rgate-025 (Product Owner Deployment Review, open), oh-047. Canonical identifiers remain Product-Owner-pending.*
