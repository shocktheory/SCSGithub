# DigitalOcean Provider Independence Assessment (Preparation Version 1.0)

**Deliverable:** ST-DLV-2026-021 (canonical identifier Product-Owner-pending)
**Planning Artifact Index entry:** PAI-015
**Directive:** Product Owner Planning Completion Directive — *Prepare the DigitalOcean Provider Independence Assessment (Preparation Version 1.0)*
**Standard followed:** Provider Independence Assessment (PIA) Standard — `PROVIDER_INDEPENDENCE_ASSESSMENT_STANDARD.md` (ST-DLV-2026-019)
**Prepared by:** #SCS
**Disposition:** **Accepted** (Product Owner, 2026-07-26; rgate-022 Accepted & closed). All findings accepted; relationship to the DigitalOcean Deployment Configuration Package confirmed supplemental (not modifying). With this acceptance, **Phase 10 Planning is fully reconciled and complete.** The next governed milestone is a separate **Phase 10 Implementation Authorization**; no implementation, provisioning, database/secret creation, DNS/TLS change, deployment, or production activation may begin until it is issued.
**Date:** 2026-07-26

**Classification:** **Planning Documentation · Provider-Specific Planning Artifact.** Creates **no implementation authority**. This assessment **supplements — but does not modify** — the accepted DigitalOcean Deployment Configuration Package (Preparation v1.0, ST-DLV-2026-018).

---

## 0. Context

The Product Owner has **completed #SCS-R Assignment #001** and **selected DigitalOcean** as the approved hosting provider. The DigitalOcean Deployment Configuration Package was accepted as a planning artifact **before** the Provider Independence Assessment became an operational governance requirement; this assessment reconciles that package with the current governance framework by supplying the required Provider Independence Assessment, standalone.

This assessment authorizes nothing. Provider selection is already the Product Owner's decision; deployment and infrastructure remain gated behind a future Phase 10 Implementation Authorization.

---

## 1. Portable Components (platform-independent)

Architecture that remains reusable regardless of hosting provider:

| Component | Portability basis |
|---|---|
| **Application architecture** | React 18 + Vite static frontend · PHP 8.2 + Slim 4 API · MySQL 8 datastore — all commodity runtimes available on any competent host. |
| **Repository organization** | Monorepo with `/app` (frontend) and `/server` (backend); no proprietary layout. Any provider that supports per-component source directories or an app spec can consume it. |
| **Deployment sequencing** | Repository → Infrastructure → Database → Secrets → Application → Verification → DNS → Production Validation. Provider-agnostic ordering with prerequisite/output/rollback per step. |
| **Migration strategy** | Versioned SQL migrations (`0001…0005`) + `server/migrations/migrate.php` runner; portable to any MySQL 8 instance via standard tooling (`mysqldump`, the existing runner). |
| **Health-check philosophy** | `GET /api/health` → `{status, env, schemaVersion}`, HTTP 200 = healthy. Standard HTTP health check, host-independent. |
| **Environment-variable taxonomy** | `SCS_ENV`, `DB_DSN`, `DB_USER`, `DB_PASSWORD` (secret), `RESET_TOKEN` (secret), `DERIVATION_VERSION`, `VITE_SCS_API_BASE`. Twelve-factor config; names and semantics carry to any platform. |
| **Governance controls** | Constitutional derivation, audit hash-chain, constitutional evidence, governed command vocabulary, review gates, the Planning Artifact Index. **Pure application/data logic — entirely host-independent.** |
| **Rollback strategy** | Redeploy prior release + restore pre-migration backup. Conceptually portable; every target platform offers an equivalent. |
| **Runtime assumptions** | PHP 8.2+, MySQL 8, static asset hosting, a pre-deploy job hook, and a scheduled job hook — all commodity capabilities. |

**Summary:** the entire application, its data, its migrations, its health/rollback model, its configuration taxonomy, and — critically — **all constitutional governance** are portable. Nothing in the SCS application depends on DigitalOcean.

---

## 2. DigitalOcean-Specific Components (provider-specific)

Implementation elements that are specific to DigitalOcean and would be re-authored on another provider:

| Element | DigitalOcean-specific detail |
|---|---|
| **App Platform configuration** | The `.do/app.yaml` App Spec shape and component types (static site, web service, pre-deploy job, scheduled job, dev database). Equivalent elsewhere: `render.yaml`, `fly.toml`, ECS task definitions, Kubernetes manifests. |
| **Source-directory configuration** | App Platform's per-component `source_dir` (`/app`, `/server`) and buildpack auto-detection behavior. |
| **Managed database assumptions** | DO Managed MySQL 8: connection strings, trusted sources/firewall, connection pools, CA certificate handling, managed backups. The engine is standard MySQL 8; the managed wrapper is DO-specific. |
| **Platform-specific networking** | DO ingress hostname `<name>.ondigitalocean.app`, route configuration, internal component addressing. |
| **Platform-specific build behavior** | Node buildpack (Vite build → static site) and Heroku PHP buildpack run command `heroku-php-apache2 public/` (**PENDING** verification on DO). |
| **Secrets management** | App Platform encrypted env vars (`SECRET` scope) as the secret store for `DB_PASSWORD`, `RESET_TOKEN`. |
| **Deployment services** | App Platform deploy/rollback mechanics; `PRE_DEPLOY` job for `migrate.php`; scheduled job for Phase 9 notification generation. |
| **Managed TLS / domains** | DO-managed Let's Encrypt certificates and domain configuration. |

**Summary:** DigitalOcean-specific surface is confined to the **deployment definition, build/run wiring, managed-service configuration, networking/ingress, secret store, and TLS/DNS** — the packaging around the application, not the application itself.

---

## 3. Lock-In Assessment

| Area | Rating | Justification |
|---|---|---|
| **Operational lock-in** | **Moderate** | Day-to-day operations (deploys, log access, scaling, alerts) run through DO App Platform tooling (`doctl`, DO console). Procedures would be re-authored for another platform, but **no application behavior depends on DO**; the runbook concepts transfer directly. |
| **Deployment lock-in** | **Moderate** | The `.do/app.yaml` App Spec and buildpack run-commands are DO-specific and would need an equivalent (`render.yaml`, `fly.toml`, ECS, k8s) elsewhere. The underlying build/run/migrate **commands themselves are standard** and portable. |
| **Infrastructure lock-in** | **Low** | The datastore is standard **MySQL 8**; schema and data move via `mysqldump` + the existing migration runner. Static hosting and PHP are commodity. Only managed-service wrappers (backups, trusted sources, CA) are DO-specific — configuration, not data lock-in. |
| **Configuration lock-in** | **Moderate** | Env-var **names and semantics are portable**, but their wiring — secret store, per-component scoping, build-time `VITE_SCS_API_BASE` coupling, DB connection injection — is DO-specific configuration that must be recreated. |

**Overall lock-in: Low-to-Moderate.** No proprietary DigitalOcean service is embedded in the application or its data. Lock-in is concentrated entirely in the replaceable deployment/configuration layer.

---

## 4. Migration Complexity

**Classification: Moderate** (toward the lower end).

**Rationale.** Migrating SCS from DigitalOcean to another provider is a bounded, well-understood re-platforming — not a rewrite:

- **No effort (fully portable):** application code, database schema, data, migration runner, health-check contract, environment-variable taxonomy, rollback model, and **all constitutional governance**.
- **Bounded re-authoring effort:** the deployment spec (`.do/app.yaml` → target equivalent), buildpack/run-command wiring, managed-MySQL provisioning + connection wiring, secret-store setup, networking/ingress, and TLS/DNS.

Because nothing proprietary is embedded in the application, migration is a matter of re-expressing the packaging on the target platform and moving standard MySQL data — measured in **days of governed re-platforming**, executed through the same review gates, not a structural change to SCS.

---

## 5. Constitutional Impact

**Changing hosting providers affects NONE of the following:**

| Dimension | Impact of a provider change |
|---|---|
| Constitutional governance | **None** — derivation, audit hash-chain, evidence, governed commands are in-application and in-repository; host-independent. |
| Product Owner authority | **None** — authority is displayed from governed records, never from infrastructure. |
| Review gates | **None** — gates are governance records in the repository, unaffected by hosting. |
| Auditability | **None** — the Technical Audit Log (append-only, tamper-evident hash-chain) and Operational History are application/data constructs, portable with the database. |
| Deployment governance | **None to the model** — a provider change is itself a governed planning revision, evaluated through this same PIA mechanism and the review gates; the *governance of deployment* is invariant. |
| Planning governance | **None** — the Planning Artifact Index (now operational) governs planning regardless of host, and would record a provider change as a governed revision. |

**Conclusion:** the hosting provider is an **implementation packaging decision**, not a constitutional one. The PIA Standard plus the operational Planning Registry ensure any future provider change is evaluated objectively and governed through existing gates — never disruptive to constitutional or planning governance.

---

## 6. Relationship to Existing Planning

**Referenced planning artifacts:**
- PAI-010 — SCS DigitalOcean Deployment Configuration Package (ST-DLV-2026-018) — *the package this assessment supplements.*
- PAI-011 — Provider Independence Assessment Standard (ST-DLV-2026-019) — *the standard this assessment follows.*
- PAI-008 — SCS Phase 10 Authorization Package (ST-DLV-2026-017).
- PAI-009 — SCS Infrastructure Requirements Baseline v2.0.

**Supporting planning artifacts:**
- PAI-002 — SCS Production Baseline v1.0 (immutable comparison point).
- PAI-012 — Operational Readiness Principles.
- PAI-013 — Migration Ledger.

**Implementation dependencies (all gated; none satisfied by this assessment):**
- A future **Phase 10 Implementation Authorization** (required before any implementation).
- The drafted **`.do/app.yaml`** App Spec (in the Deployment Configuration Package; deliberately not written to the repository).
- DigitalOcean Managed MySQL provisioning, secret-store population, and DNS/TLS configuration.
- The backend's `SCS_ENV=production` refusal must be deliberately changed under Phase 10 implementation (hard technical precondition for any production environment).

**Supplement-not-modify confirmation:** this assessment **supplements** the accepted DigitalOcean Deployment Configuration Package and **does not modify** it. The Deployment Configuration Package remains accepted and unchanged; this document adds the Provider Independence Assessment the package predated.

---

## Governance record references

- Assignment: **adr-023** (Active — assessment submitted; awaiting Product Owner review).
- Deliverable: **dlv-021 / ST-DLV-2026-021** (In review).
- Review gate: **rgate-022** — DigitalOcean Provider Independence Assessment Review (open, awaiting Product Owner review).
- Operational history: **oh-041**.
- Planning Artifact Index: registered as **PAI-015** (per the operational registry maintenance protocol).

*Planning documentation only; provider-specific planning artifact; creates no implementation authority. Canonical identifiers remain Product-Owner-pending. #SCS does not self-accept — this assessment awaits Product Owner disposition.*
