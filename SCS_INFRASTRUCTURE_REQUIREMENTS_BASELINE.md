# SCS Production Infrastructure Requirements Baseline — for #SCS-R Assignment #001

**Status:** **PROVISIONAL v0.9-DRAFT — NOT a Product-Owner-accepted baseline.**
**Source:** Derived from the **submitted, in-review** SCS Phase 10 Authorization Package (ST-DLV-2026-017), currently open at the **SCS Phase 10 Authorization Package Review** gate (rgate-017). That package has **not** yet been dispositioned by the Product Owner.
**Acceptance date:** **None yet** — pending the Product Owner's disposition of the Phase 10 Authorization Package.
**Prepared by:** #SCS. **For:** #SCS-R (Product-Owner-established research agent), preflight of Assignment #001.
**Classification:** Non-confidential · provider-neutral · recommends **no** provider · Nestify treated as an **unverified** candidate.

> **Read this first (constitutional honesty).** #SCS-R's preflight requires the current *approved* requirements baseline (Item 3) and confirmation that it reflects the *Product-Owner-accepted* Phase 10 Authorization Package (Item 4). **That accepted baseline does not yet exist:** the Phase 10 Authorization Package is submitted and in review. This document is therefore a **provisional** reference so #SCS-R can prepare its traceability matrix — it is **not** an authoritative accepted baseline, and #SCS **cannot** certify Phase 10 alignment against an acceptance that has not occurred. Per #SCS-R's own charter (it will not do substantive research on non-authoritative requirements), **substantive provider evaluation should await the Product Owner's acceptance** of the Phase 10 package, upon which #SCS will re-issue this as an **accepted baseline** with a version and acceptance date.

> #SCS recommends **no** provider, selects nothing, provisions nothing, and does **not** identify a specific "Nestify offering to evaluate" as approved. Provider selection is a Product Owner decision, gated on accepted #SCS-R research.

---

## 1. Scope & assumptions (provisional)

- **Platform:** SCS is an internal governance platform (React 18 static client + Slim 4 PHP backend + MySQL 8). Governance operating core accepted (Phases 6–9); production infrastructure **not** yet authorized.
- **Data:** **No confidential data** is permitted in any environment until a **separate Product Owner authorization gate** is passed (Phase 10 §9). Synthetic/non-confidential data only.
- **Scale:** modest internal user base (Product Owner + administrators + agents/service accounts); not public-facing at this stage.
- **Data residency / geography:** **Product-Owner-pending** — no residency constraint has been set; do not assume one.
- **Runtime parity:** production must match the CI-verified stack (PHP 8.2, MySQL 8) — see the accepted Phase 5–9 CI runtime verification.

## 2. Mandatory (pass/fail) requirements — evaluate every provider against these first

| ID | Requirement | Notes for evaluation |
|---|---|---|
| INFRA-R01 | **PHP 8.2+** | must match the CI-verified runtime; newer 8.x acceptable if backward-compatible |
| INFRA-R02 | **Composer** support | dependency install at build/deploy |
| INFRA-R03 | **MySQL 8** (InnoDB, utf8mb4), via PDO/pdo_mysql | generated columns + FKs are used |
| INFRA-R04 | Required PHP extensions: pdo, pdo_mysql, mbstring | |
| INFRA-R05 | **TLS** termination (HTTPS) | |
| INFRA-R06 | **Custom DNS** | |
| INFRA-R07 | **Environment variables + secret storage** (`SCS_ENV`, `DB_*`, `RESET_TOKEN`, `DERIVATION_VERSION`) | secrets never in source |
| INFRA-R08 | **Background worker + scheduled jobs** | notification generation, backups, periodic reviews |
| INFRA-R09 | **File/object storage** for exports/backups | |
| INFRA-R10 | **Log access + retention** | distinct from constitutional record streams |
| INFRA-R11 | **Backup + restore** with access + **evidence** | restore must be exercisable |
| INFRA-R12 | **Staging/production isolation** (separate DB, secrets, access) | |
| INFRA-R13 | **Deploy + rollback** support | |
| INFRA-R14 | **Administrative access** to the environment | |

## 3. Preferred requirements (weighted after pass/fail)

| ID | Requirement |
|---|---|
| INFRA-P01 | Encryption at rest / managed key management |
| INFRA-P02 | Redis or equivalent cache (a future optimization) |
| INFRA-P03 | Multi-region / disaster-recovery options |
| INFRA-P04 | Dedicated object storage |
| INFRA-P05 | Managed backups with retention controls |

## 4. Optional requirements

| ID | Requirement |
|---|---|
| INFRA-O01 | Managed OS/runtime patching |
| INFRA-O02 | Managed monitoring/alerting |

## 5. Disqualifying conditions (automatic fail)

| ID | Condition |
|---|---|
| INFRA-D01 | No PHP 8.2+ |
| INFRA-D02 | No MySQL 8 |
| INFRA-D03 | No TLS / no custom DNS |
| INFRA-D04 | No isolated staging environment |
| INFRA-D05 | No backup + restore access/evidence |
| INFRA-D06 | No background worker / scheduled-job capability |

## 6. Evidence standard (per the Phase 10 package §17)

Distinguish **verified fact · provider claim · third-party analysis · customer report · inference · estimate · unavailable**. For each material claim record source date, retrieval date, geography, confidence, limitations, and review-by date. **Unresolved verification = "pending," never assumed.** This baseline supplies *requirements*; provider-capability confirmations are #SCS-R's to verify.

## 7. Product-Owner-pending determinations (do NOT infer)

From the Phase 10 Authorization Package §23 decision queue — these are **open** and must not be filled by assumption:
1. Provider selection (blocked pending accepted #SCS-R research)
2. RPO/RTO targets for backup/restore/DR
3. Confidential-data readiness approval (and the separate use gate)
4. Secret-store / key-management choice
5. Environment set (esp. a dedicated recovery environment)
6. Deployment authority + release/cutover/acceptance gates
7. Production access model + emergency-access policy
8. Monitoring/alerting scope + retention
9. Infrastructure Decision Register governance
10. Canonical identifier standard
11. Data residency / geographic constraints
12. Phase 11/12 and #SCS-R implementation sequencing (out of scope)

## 8. Citation / sharing restrictions

Non-confidential and provider-neutral; #SCS-R may cite these requirements. **Do not represent this baseline as Product-Owner-accepted** — it is provisional until the Phase 10 Authorization Package is dispositioned. Cross-reference the authoritative source: **SCS_PHASE_10_AUTHORIZATION_PACKAGE.md** (§6 hosting requirements, §17 scorecard, §4 capability breakdown A–O, §23 decision queue).

## 9. Known discrepancy statement

There is **no discrepancy** between this baseline and the Phase 10 Authorization Package content — it is extracted directly from it. The **only** gap is status: the package is **in review, not accepted**, so no *accepted* baseline exists to certify against. When the Product Owner accepts the Phase 10 package, #SCS will re-issue this as **v1.0 (Accepted)** with the acceptance date and the deliverable's final identifier.
