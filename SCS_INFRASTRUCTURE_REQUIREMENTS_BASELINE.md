# Provisional SCS Infrastructure Requirements Baseline

**Version:** v1.0 — **Provisional (Interim Authorization).** **NOT Product Owner acceptance of the Phase 10 Authorization Package.**
**Authority:** Product Owner Clarification & Interim Authorization Directive — *Authorize a Provisional SCS Infrastructure Requirements Baseline for #SCS-R Assignment #001* (2026-07-26).
**Issued to:** the Product Owner; and #SCS-R as the authorized research baseline for Assignment #001.
**Prepared by:** #SCS. **Classification:** Non-confidential · provider-neutral · recommends **no** provider · Nestify treated as an **unverified** candidate.
**Governance status of Phase 10 Authorization Package (ST-DLV-2026-017):** **In Review** — Review Gate rgate-017 **remains open**; no Product Owner disposition has accepted it. This baseline neither accepts it nor certifies alignment with an accepted package.

> **This baseline exists solely to enable independent infrastructure research by #SCS-R while preserving the integrity of Product Owner governance.** It creates no new constitutional, implementation, production, confidential-data, or provider authority, and constitutes no Phase 10 approval. Provisional ≠ acceptance.

---

## 1. Executive Summary

During Assignment #001 preflight, #SCS-R requested the *approved* SCS infrastructure requirements baseline and confirmation of alignment with the *accepted* Phase 10 Authorization Package. #SCS determined — and the Product Owner has confirmed — that the Phase 10 Authorization Package remains **in review** and therefore **cannot be represented as an accepted governing baseline**. Under the Product Owner's Interim Authorization Directive, #SCS issues this **Provisional Infrastructure Requirements Baseline v1.0**, in which **every requirement is classified by its source authority** — *Accepted Baseline Requirement · Derived from Accepted Architecture · Provisional Planning Requirement · Product Owner Pending* — and traced to accepted governing records where applicable. #SCS-R may evaluate providers using this baseline with the classification-specific guidance in §10, but **research shall not resolve architectural uncertainty**, and provider selection remains a Product Owner decision.

## 2. Purpose

To give #SCS-R an authorized, governance-honest requirements baseline for provider research **before** the Phase 10 Authorization Package is dispositioned — without representing any in-review planning artifact as approved architecture, and without transferring any authority.

## 3. Scope

- **Platform:** internal governance platform — React 18 static client (HashRouter) + Slim 4 PHP backend + MySQL 8. Governance operating core accepted (Phases 6–9). Production infrastructure **not** authorized.
- **Data:** **no confidential data** in any environment until a **separate Product Owner authorization gate** is passed. Synthetic/non-confidential data only.
- **Source rule (per the directive):** requirements are derived only from **currently accepted governing records** for the Accepted/Derived categories; anything from proposed/draft/in-review work is explicitly marked **Provisional Planning**.
- **Out of scope:** provider selection, provisioning, accounts, purchasing, deployment, confidential data, Phase 10 implementation, Phase 11/12, #SCS-R implementation/activation.

## 4. Accepted Baseline Requirements *(derived directly from accepted Product Owner governing records — current governing requirements)*

| ID | Requirement | Accepted source |
|---|---|---|
| IR-A01 | **PHP 8.2+** runtime (matching the CI-verified stack) | Production Baseline v1.0; Phases 5–9 CI runtime verification |
| IR-A02 | **Composer** dependency management | accepted backend (Phase 5) |
| IR-A03 | **MySQL 8** — InnoDB, utf8mb4, via PDO/pdo_mysql; generated columns + FKs | accepted Phase 5 persistence + migrations 0001–0005 |
| IR-A04 | PHP extensions: **pdo, pdo_mysql, mbstring** | accepted CI runtime |
| IR-A05 | **Environment-variable + secret contract** (`SCS_ENV`, `DB_*`, `RESET_TOKEN`, `DERIVATION_VERSION`); **secrets never in source** | accepted `Config` (Phase 5) |
| IR-A06 | **Production-environment refusal until authorized** (`SCS_ENV=production` is refused by design) | accepted design invariant (Phases 5–9) |
| IR-A07 | **Product-Owner-only approval boundary + governed commands + authenticated attribution** must hold in every environment | accepted Phases 6 & 8 (Auth & Authority / Observability doctrines) |
| IR-A08 | **Server-side canonical derivation + append-only, tamper-evident audit** must remain intact and verifiable | accepted Phases 7 & 8 (Derivation / Audit) |

## 5. Derived Requirements *(reasonably derived from accepted architecture; traceable to accepted records; usable as supported architectural expectations)*

| ID | Requirement | Derived from |
|---|---|---|
| IR-D01 | **TLS / HTTPS** | accepted Phase 6 secure session cookie (`Secure`; HttpOnly; SameSite=Strict) implies TLS |
| IR-D02 | **Custom DNS** | serving the accepted platform |
| IR-D03 | **Log access + retention**, kept distinct from the three constitutional streams (Audit / Operational History / Notification History) | accepted Phase 8 audit/observability + Phase 9 notification history |
| IR-D04 | **Background worker + scheduled jobs** | accepted Phase 9 notification generation (`POST /api/notifications/generate`) + backup scheduling |
| IR-D05 | **Backup + restore** with access and **evidence** | accepted persistence + Operational Readiness Principles ("recovery preserves constitutional integrity") |
| IR-D06 | **Deploy + rollback** path | accepted CI build pipeline + Operational Readiness Principles |
| IR-D07 | **File/object storage** for exports/backups | accepted export/import tooling + backup needs |

## 6. Provisional Planning Requirements *(originate from the in-review Phase 10 Authorization Package; NOT yet accepted; conditional evaluation items — never present as approved architecture)*

| ID | Requirement | Provisional source (in-review Phase 10 pkg) |
|---|---|---|
| IR-P01 | Formal **staging/production isolation** (separate DB, secrets, access) | §8 |
| IR-P02 | Backup **frequency / encryption / retention / geo-or-provider separation / integrity checks / evidence** specifics | §13 |
| IR-P03 | Restore/DR: **RPO/RTO**, an **EXERCISED** restore + DR test, and **constitutional-integrity re-verification after recovery** | §13, §21 |
| IR-P04 | Monitoring/alerting scope (app/API/DB health, authN/authZ failures, **audit-integrity failures, derivation drift**, command/queue/workflow failures, backup failures, capacity, TLS expiry, deploy failures, unusual admin actions) | §12 |
| IR-P05 | Production **access model + separation of duties + emergency access** | §19 |
| IR-P06 | **Deployment approval gates** + release/cutover/acceptance structure | §10, §20 |
| IR-P07 | **Infrastructure Decision Register** | §15 |
| IR-P08 | Provider **scorecard thresholds** (Required/Preferred/Optional/Disqualifying) | §17 |
| IR-P09 | Encryption **at rest** / key management | §6, §7 |
| IR-P10 | Redis/cache; dedicated object storage; multi-region / DR options | §6 (preferred) |

## 7. Product Owner Pending Requirements *(unresolved decisions requiring future Product Owner disposition — clearly identified; never assumed)*

| ID | Pending decision |
|---|---|
| IR-Q01 | **Provider selection** (blocked pending accepted #SCS-R research) |
| IR-Q02 | RPO/RTO targets |
| IR-Q03 | Confidential-data readiness approval + the separate confidential-data **use** gate |
| IR-Q04 | Secret-store / key-management choice |
| IR-Q05 | Environment set (esp. a dedicated recovery environment) |
| IR-Q06 | Deployment authority + release/cutover/acceptance gates |
| IR-Q07 | Production access model finalization + emergency-access policy |
| IR-Q08 | Monitoring/alerting scope + retention |
| IR-Q09 | Infrastructure Decision Register governance |
| IR-Q10 | Canonical identifier standard |
| IR-Q11 | Data residency / geographic constraints |
| IR-Q12 | Phase 11/12 and #SCS-R implementation sequencing |

## 8. Requirement Classification Matrix

| Class | IDs | Use in provider evaluation |
|---|---|---|
| **Accepted Baseline Requirement** | IR-A01–IR-A08 | **Governing criteria** — mandatory; a provider failing any is disqualified |
| **Derived from Accepted Architecture** | IR-D01–IR-D07 | **Supported architectural expectations** — required in practice; traceable to accepted records |
| **Provisional Planning Requirement** | IR-P01–IR-P10 | **Conditional** — evaluate, but never present as approved; may change on Phase 10 disposition |
| **Product Owner Pending** | IR-Q01–IR-Q12 | **Unresolved decision points** — document as dependencies; do not assume |

**Pass/fail note for #SCS-R:** treat **IR-A** (and, in practice, **IR-D**) as the mandatory qualification set; a provider must satisfy these before any weighted scoring. **IR-P** items are conditional and weighted only after qualification. **IR-Q** items are not provider criteria — they are Product Owner decisions.

## 9. Traceability to Accepted Governing Records

- **Production Baseline v1.0** (accepted, immutable) — platform/runtime baseline → IR-A01–IR-A04.
- **Phase 5 (accepted)** — Slim 4 + MySQL 8 persistence, migrations, config/secret contract → IR-A02–IR-A06, IR-D07.
- **Phase 6 (accepted)** — identity/authority/attribution; secure sessions → IR-A05, IR-A07, IR-D01, IR-D03.
- **Phase 7 (accepted)** — server-side derivation; version governance → IR-A08.
- **Phase 8 (accepted)** — Technical Audit Log (append-only, tamper-evident); observability; admin ≠ authority → IR-A07, IR-A08, IR-D03.
- **Phase 9 (accepted)** — notifications/workflows; Notification History → IR-D03, IR-D04.
- **Five constitutional doctrines (accepted)** — approval boundary, derivation, commands, evidence, observability → IR-A06–IR-A08.
- **Operational Readiness Principles (accepted operational standard)** — evidence-based readiness; recovery preserves constitutional integrity; production remains governed → IR-D05, IR-D06.
- **Phase 10 Authorization Package (IN REVIEW — not accepted)** — source **only** for the **Provisional Planning** (IR-P) items and the pending decisions (IR-Q), never for Accepted/Derived.

## 10. Research Guidance for #SCS-R

- Evaluate providers using **Accepted Baseline Requirements (IR-A)** as governing criteria; **Derived Requirements (IR-D)** as supported architectural expectations; **Provisional Planning Requirements (IR-P)** as conditional evaluation items (never presented as approved architecture); **Product Owner Pending (IR-Q)** items as unresolved decision points.
- Apply **pass/fail qualification (IR-A/IR-D) before weighted scoring**.
- Evaluate **Nestify without presumption of suitability**, and every mandatory alternative named in the assignment.
- Preserve the distinction between verified fact · provider claim · third-party analysis · customer report · inference · estimate · unavailable; record source/retrieval dates, geography, confidence, limitations, review-by dates.
- **Research shall not resolve architectural uncertainty.** Where uncertainty materially affects provider evaluation, **document the dependency in your Product Owner Decision Queue** rather than assuming a resolution.
- Escalate all stop-condition matters to the Product Owner; do not resolve #SCS/#SCS-R conflicts by consensus.

## 11. Constitutional Limitations

This interim baseline: creates **no** new constitutional authority · **no** implementation authority · **no** production authority · **no** confidential-data authority · **no** provider preference · **no** Phase 10 approval. It was **issued under interim Product Owner authorization**; the **Phase 10 Authorization Package remains in review** (rgate-017 open); the provisional baseline is **not a substitute for Product Owner acceptance**. #SCS recommends no provider, selected nothing, provisioned nothing, and did **not** create, activate, or task #SCS-R (a Product Owner act, outside #SCS authority).

## 12. Product Owner Decision Dependencies

Provider selection and the whole IR-Q set (§7) remain open. **Future reconciliation:** when the Product Owner disposes of the Phase 10 Authorization Package — *if accepted*, #SCS-R reconciles its research against the accepted package, identifies material differences, and revises conclusions with documented impact; the IR-P (provisional) items are then reclassified as accepted/derived and this baseline is re-issued as **Accepted v2.0** with the acceptance date. *If revised before acceptance*, the revised accepted package becomes governing and provisional items are reclassified accordingly. Until then, #SCS-R's substantive conclusions remain **conditional** on that disposition.
