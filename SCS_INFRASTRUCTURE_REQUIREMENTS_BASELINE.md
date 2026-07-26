# SCS Infrastructure Requirements Baseline

**Version:** **v2.0 — ACCEPTED.** The accepted infrastructure baseline for future implementation planning.
**Authority:** Product Owner Review Disposition & Authorization Directive — *Accept the SCS Phase 10 Authorization Package and Preserve Implementation as Separately Gated* (2026-07-26).
**Supersedes:** Provisional SCS Infrastructure Requirements Baseline **v1.0** (interim authorization, commit `1159c04`) — now **superseded**; its content is preserved in git history and reconciled below.
**Basis:** Reconciled against the **now-accepted** SCS Phase 10 Authorization Package (ST-DLV-2026-017 — **Accepted**; rgate-017 **Approved & Closed**).
**Issued to:** the Product Owner; #SOS (governance alignment); #SCS-R (accepted research baseline for Assignment #001).
**Classification:** Non-confidential · provider-neutral · recommends **no** provider · Nestify treated as an **unverified** candidate.

> **Acceptance of the Phase 10 Authorization Package is NOT authorization to implement.** This v2.0 baseline is the accepted **planning & architectural** baseline. It confers **no** authority to select a provider, provision or purchase infrastructure, deploy, use confidential data, or activate production — each remains a separate Product Owner decision. Phase 10 **implementation has not begun.**

> **Reconciliation note.** With the Phase 10 Authorization Package now accepted, the requirements that v1.0 marked **Provisional Planning** (sourced from the then-in-review package) are now backed by an **accepted** governing record and are reclassified as **Accepted Requirements** — *except* the unresolved values/choices inside them, which remain **Product Owner Pending**. Full traceability among **Accepted / Derived / Product-Owner-Pending** is maintained.

---

## 1. Executive Summary

The Product Owner has accepted the SCS Phase 10 Authorization Package as the governing production **architecture & planning** baseline. Accordingly, #SCS reconciles the provisional infrastructure baseline into this **accepted v2.0**, in which every requirement is classified by source authority — **Accepted Requirement · Derived from Accepted Architecture · Product Owner Pending** — and traced to accepted governing records (Production Baseline v1.0, accepted Phases 5–9, the five constitutional doctrines, the Operational Readiness Principles, and now the accepted Phase 10 Authorization Package). #SCS-R uses this v2.0 baseline for Assignment #001; its findings remain advisory; **provider selection and all unresolved values remain Product Owner decisions**.

## 2. Purpose & Scope

Provider-neutral requirements baseline for provider research and future implementation planning. **Data:** no confidential data in any environment until a **separate Product Owner authorization gate** is passed. **Out of scope:** provider selection, provisioning, purchasing, deployment, confidential data, Phase 10 implementation, Phase 11/12, #SCS-R implementation.

## 3. Accepted Requirements *(governing — traceable to accepted governing records incl. the accepted Phase 10 package)*

### 3.1 Runtime, persistence & constitutional invariants (from Production Baseline v1.0 + accepted Phases 5–9 + doctrines)
| ID | Requirement | Accepted source |
|---|---|---|
| IR-A01 | **PHP 8.2+** runtime (matching CI-verified stack) | Baseline v1.0; Phases 5–9 CI |
| IR-A02 | **Composer** | accepted Phase 5 |
| IR-A03 | **MySQL 8** — InnoDB, utf8mb4, PDO/pdo_mysql; generated columns + FKs | accepted Phase 5 + migrations 0001–0005 |
| IR-A04 | Extensions: **pdo, pdo_mysql, mbstring** | accepted CI runtime |
| IR-A05 | **Env-var + secret contract**; secrets never in source | accepted `Config` (Phase 5) |
| IR-A06 | **Production-environment refusal until authorized** (`SCS_ENV=production` refused) | accepted design invariant |
| IR-A07 | **PO-only approval boundary + governed commands + authenticated attribution** hold in every environment | accepted Phases 6 & 8 |
| IR-A08 | **Server-side canonical derivation + append-only tamper-evident audit** intact & verifiable | accepted Phases 7 & 8 |

### 3.2 Production-operations architecture (now accepted via the accepted Phase 10 package)
| ID | Requirement | Accepted source | Unresolved value → PO Pending |
|---|---|---|---|
| IR-A09 | **Staging/production isolation** (separate DB, secrets, access) | Phase 10 §8 | environment set → IR-Q05 |
| IR-A10 | **Backup + restore architecture** — encryption, retention, integrity checks, restoration evidence | Phase 10 §13 | retention/RPO values → IR-Q02 |
| IR-A11 | **Restore/DR architecture** — an **EXERCISED** restore + DR test + **constitutional-integrity re-verification after recovery** | Phase 10 §13, §21 | RPO/RTO targets → IR-Q02 |
| IR-A12 | **Monitoring/alerting architecture** — incl. audit-integrity failures & derivation drift; monitoring never approves | Phase 10 §12 | retention/scope values → IR-Q08 |
| IR-A13 | **Logging** keeps the three constitutional/operational streams (Audit / Operational History / Notification History) distinct from infrastructure logs | Phase 10 §12 (H) | — |
| IR-A14 | **Deployment/release architecture** — build→verify→promote→approval-gates→rollback; post-deploy verification | Phase 10 §10, §20 | deployment authority/gates → IR-Q06 |
| IR-A15 | **Production access + separation-of-duties architecture**; **AI agents get no unrestricted production access** | Phase 10 §19 | access-model finalization → IR-Q07 |
| IR-A16 | **Infrastructure Decision Register** — infra behavior never silently redefines SCS architecture | Phase 10 §15 | governance cadence → IR-Q09 |
| IR-A17 | **Provider evaluation scorecard** (Required/Preferred/Optional/Disqualifying) with an evidence standard | Phase 10 §17 | — (criteria accepted; selection → IR-Q01) |
| IR-A18 | **Encryption-at-rest / key-management requirement** | Phase 10 §7 | key-management choice → IR-Q04 |

## 4. Derived Requirements *(reasonably derived from accepted architecture; supported architectural expectations)*
| ID | Requirement | Derived from |
|---|---|---|
| IR-D01 | **TLS / HTTPS** | accepted Phase 6 secure cookie (`Secure`) |
| IR-D02 | **Custom DNS** | serving the accepted platform |
| IR-D03 | **Log access + retention**, distinct from the three constitutional streams | accepted Phases 8–9 |
| IR-D04 | **Background worker + scheduled jobs** | accepted Phase 9 notification generation + backups |
| IR-D05 | **Backup + restore with access & evidence** | accepted persistence + Operational Readiness Principles |
| IR-D06 | **Deploy + rollback** path | accepted CI pipeline + Operational Readiness Principles |
| IR-D07 | **File/object storage** for exports/backups | accepted export/import + backups |

## 5. Product Owner Pending *(unresolved decisions — acceptance of the package resolves none of these)*
| ID | Pending decision |
|---|---|
| IR-Q01 | **Hosting-provider selection** (Product-Owner-only; awaits accepted #SCS-R research) |
| IR-Q02 | Recovery objectives — **RPO/RTO** targets |
| IR-Q03 | **Confidential-data readiness** approval + the separate confidential-data **authorization/use** gate |
| IR-Q04 | **Secrets management** — secret-store / key-management choice |
| IR-Q05 | **Production environment strategy** — environment set (esp. recovery environment) |
| IR-Q06 | **Deployment authority** + release/cutover/acceptance gates |
| IR-Q07 | **Production access model** finalization + emergency-access policy |
| IR-Q08 | **Monitoring retention** + alerting scope |
| IR-Q09 | **Infrastructure Decision Register governance** (cadence, exceptions) |
| IR-Q10 | **Canonical identifier standard** |
| IR-Q11 | **Data residency** / geographic constraints |
| IR-Q12 | **Phase 11 / Phase 12** and #SCS-R sequencing |

## 6. Requirement Classification Matrix

| Class | IDs | Use in provider evaluation |
|---|---|---|
| **Accepted Requirement** | IR-A01–IR-A18 | **Governing pass/fail criteria** (a provider failing any applicable one fails that mandatory requirement, absent an approved exception) |
| **Derived from Accepted Architecture** | IR-D01–IR-D07 | Supported architectural expectations; traceable to accepted records |
| **Product Owner Pending** | IR-Q01–IR-Q12 | Unresolved decision points — document as dependencies; **never assumed or resolved through research** |

## 7. Traceability to Accepted Governing Records

Production Baseline v1.0 → IR-A01–A04 · Phase 5 → IR-A02–A06, IR-D07 · Phase 6 → IR-A05, IR-A07, IR-D01, IR-D03 · Phase 7 → IR-A08 · Phase 8 → IR-A07, IR-A08, IR-A13, IR-D03 · Phase 9 → IR-A13, IR-D04 · Five doctrines → IR-A06–A08, IR-A15 · Operational Readiness Principles → IR-A10–A12, IR-D05–D06 · **Accepted Phase 10 Authorization Package** → IR-A09–A18 (architecture), IR-Q01–Q12 (pending decisions).

## 8. Research Guidance for #SCS-R (accepted baseline)

- Evaluate providers using **Accepted Requirements (IR-A)** as governing pass/fail criteria and **Derived Requirements (IR-D)** as supported expectations; apply qualification **before** weighted scoring.
- Treat **Product Owner Pending (IR-Q)** items as unresolved decision points — **document each as a dependency in the Product Owner Decision Queue**; do not resolve them through research, and do not use provider capabilities as a substitute for Product Owner judgment.
- Evaluate **Nestify without presumption of suitability** and every mandated alternative; preserve strict evidence separation (verified fact · provider claim · third-party · customer · community · inference · estimate · unavailable); record source/retrieval dates, geography, confidence, limitations, review-by dates.
- Findings remain **advisory**; **provider selection is a Product Owner decision.** Escalate stop-conditions and any finding requiring a material SCS-architecture change to the Product Owner.

## 9. Constitutional Limitations

This accepted v2.0 baseline confers **no** implementation, production, provider-selection, procurement, deployment, or confidential-data authority, and constitutes **no** Phase 10 implementation approval. Phase 10 **implementation remains separately gated**. #SCS recommends no provider, selected nothing, and did **not** create, activate, or task #SCS-R. No new constitutional doctrine is created; all five doctrines + the Operational Readiness Principles are preserved; infrastructure remains subordinate to constitutional governance.

## 10. Supersession & Next Milestone

- **Provisional v1.0 → SUPERSEDED** by this accepted v2.0 (v1.0 preserved in git history, commit `1159c04`).
- **Next major governance milestone:** following completion of **#SCS-R Assignment #001** and Product Owner review of the research findings, a separate **Phase 10 Implementation Authorization** will determine whether implementation begins, which provider is selected, whether procurement proceeds, and whether provisioning is authorized. **No implementation activity may begin before that separate Product Owner disposition.**
