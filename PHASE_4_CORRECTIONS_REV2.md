# SCS Production Architecture — Corrected Package (Phase 4, Rev 2)

**In response to:** Product Owner Architecture Review Ruling — *Approve Phase 4 SCS Production Architecture with Conditions* (2026-07-25), against commit `5253ceb`.
**Gate disposition being addressed:** **Approved with Conditions — Corrections Required Before Phase 5 Authorization.**
**This package resolves Conditions A–J.** It is architecture and specification only.

> **No production implementation began.** No PHP API, MySQL migration, authentication, hosted-data transfer, or deployment was written or started. Identifiers remain **Product-Owner-pending** (ST-ADR-2026-006 advisory only; no canonical ST-DEC assigned).

This document supersedes any conflicting text in [PHASE_4_PRODUCTION_ARCHITECTURE.md](PHASE_4_PRODUCTION_ARCHITECTURE.md). The two are read together; the base doc holds the accepted direction, this holds the corrections.

---

## Deliverable 1 — Revised architecture (summary of what changed)

The trust boundary is now explicit and settled before any code:

- **Canonical derivation executes server-side** (Deliverable 2). The client verifies; it never governs.
- **Writes are governed commands**, not raw document replacement (Deliverable 3). `authorityStatus`, acceptance, and activation can change **only** through a permitted command by an authorized actor from a valid prior state.
- **Database enforces integrity** where a reference is structural; soft references are an intentional, listed exception (Deliverable 4).
- **Records are versioned; writes are concurrency-checked** (Deliverable 5).
- **Technical Audit Log ≠ Operational History** (Deliverable 6).
- **Authentication is settled:** secure server-managed sessions (Deliverable 7).
- **Actor classes are distinct and enforced** (Deliverable 8).
- **Import is dry-run-validated and PO-confirmed; no record is trusted because its JSON says "approved"** (Deliverable 9).
- **Hosting capabilities are treated as unverified until confirmed** (Deliverable 10).
- **Phase 5 is narrowed** to backend/persistence/migration/parity (Deliverable 12 / Condition J).

---

## Deliverable 2 — Canonical Server-Side Derivation Specification (Condition A)

**Production trust model (the pass-through alternative is removed):**

```
Authoritative production records (MySQL)
        ↓
Canonical server-side derivation (PHP engine)
        ↓
Versioned derived state (disposable cache)
        ↓
Client display
```

- **Where it executes:** a **PHP derivation engine** in the Slim API — a faithful port of the TypeScript `deriveAgentState` (`derivation.ts`) and `deriveTeam` (`team.ts`). It runs on write (and on demand) over authoritative records; the client never supplies constitutional state.
- **The client MAY:** display server-derived state; independently recompute for verification; compare local vs server; run explicitly labeled **demonstration/offline** mode.
- **The client MAY NOT:** submit a derived snapshot as governing truth; cause the server to trust browser-computed state; replace server derivation; approve its own derived result.
- **Preserving TypeScript behavior / parity:** the TypeScript engine is the **behavioral specification**. A shared, language-neutral **golden-fixtures** set (input record-sets → expected `DerivedAgentState`/team metrics, extending the existing 32-test suite) is run against **both** engines in CI. The PHP port must match the TS output byte-for-byte on every fixture; a divergence fails the build. (The existing derivation tests become the seed corpus.)
- **Derivation versioning:** each derived-state record carries `derivation_version` (semver) and the `schema_version` it was computed against. Bumping the engine bumps `derivation_version`; stored derived state older than the current version is recomputed.
- **Mismatch handling:** if the client's verification recompute disagrees with the server, the client shows a **non-blocking integrity warning**, the **server value governs**, and a Technical Audit entry (Deliverable 6) records the discrepancy for investigation. Client mismatch never changes authoritative state.
- **Cached derived state is disposable and fully reproducible** from authoritative records at any time; losing the cache loses nothing. Derived state is **never** an authoritative record and is never the input to a command.

---

## Deliverable 3 — Governed API Command & State-Transition Specification (Condition B)

The generic adapter stays **client-internal**. The production API classifies operations; sensitive governing records change only through governed commands.

**Operation classes:** (1) **Ordinary record operations** — permissioned edits to non-governing fields; (2) **Governed transitions** — propose · submit · activate · pause · block · accept · reject · supersede · archive · correct · close; (3) **Product Owner decisions** — actions requiring authenticated Product Owner authority (approve, grant activation authority, accept deliverable); (4) **Append-only history actions** — Operational History, decision history, acceptance events, audit evidence (insert-only, never update/delete); (5) **Administrative operations** — import, recovery, migration, controlled repair.

**Representative command contracts** (each command specifies: *actor · prior state → target state · validation · evidence · Operational History effect · idempotency · error*):

| Command | Authorized actor | Prior → target | Key validation | Evidence / OpHistory | Idempotency | Error |
| --- | --- | --- | --- | --- | --- | --- |
| `ProposeRecord` | agent (scoped) / PO | none → `proposed` | shape (Zod); refs exist | proposed record; no OpHistory | idempotency-key; re-propose = no-op | 409 on duplicate |
| `SubmitDeliverable` | agent / PO | `draft` → `in-review` | linked ADR + gate exist | OpHistory "submitted" | key | 422 if unlinked |
| `ActivateAgent` | **Product Owner** | `pending` → `active` | full approved evidence set present | OpHistory activation event | key | 403 non-PO; 409 evidence incomplete |
| `AcceptDeliverable` | **Product Owner** | `in-review` → `accepted` | gate `requiresOwnerApproval` | OpHistory acceptance | key | 403 non-PO |
| `RejectDeliverable` / `ReturnForCorrection` | **Product Owner** | `in-review` → `rejected`/`draft` | — | OpHistory | key | 403 non-PO |
| `SupersedeRecord` | PO / admin (with reason) | `approved`→`superseded` | successor id | OpHistory; record retained | key | 409 if referenced immutably |
| `RecordOperationalHistory` | system/PO | append-only | evidenceType valid | the OpHistory row itself | key | insert-only; never update |
| `ProductOwnerApprove` | **Product Owner (MFA)** | `proposed/reported`→`approved` | authenticated PO session | OpHistory; `authorityStatus=approved` | key | **403 for any non-PO actor** |
| `ImportWorkspace` | admin (PO-confirmed) | — | Deliverable 9 pipeline | immutable import report | manifest hash | rollback on any failure |

**Hard rule:** **no actor can set `authorityStatus`, acceptance, or activation by submitting a replacement JSON object.** Those fields are server-owned and change only via the commands above; the `RemoteAdapter.put()` for a governing record is rejected unless it routes through a permitted command. Every command is transactional and writes a Technical Audit entry.

---

## Deliverable 4 — Relational Integrity Matrix (Condition C)

**General rules:** primary keys non-null; `authority_status` non-null (enum via CHECK where supported, else domain-validated); unique on `(collection, canonical_id)` where a canonical id exists; indexes on every foreign reference. **Immutable records:** Operational History and acceptance events are insert-only (enforced by revoked UPDATE/DELETE grants + domain). **Archival/supersession:** superseded records are retained (`authority_status='superseded'`), never deleted; supersession stores `superseded_by`.

**Constitutional trace — enforcement per link:**

| Link | Enforcement | Rationale |
| --- | --- | --- |
| Agent → Standing Directive | **Hard FK** (`standing_directives.agent → ai_collaborators.id`) | An SD without an agent is invalid |
| Standing Directive → governing Decision | **Hard FK** | Activation authority must resolve |
| Assignment Directive → Standing Directive | **Hard FK** | ADR must trace to a role authority |
| Assignment Directive → Deliverable | **Hard FK** (nullable) | Some ADRs (e.g., review) have no deliverable — nullable, not soft |
| Assignment Directive → Review Gate | **Hard FK** (nullable) | Same |
| Assignment Directive → Product Owner Decision | **Soft (intentional)** | The decision's canonical id may be **Product-Owner-pending**; a hard FK would block legitimate pending-id records. Enforced by **integrity audit**, not DB. |
| Deliverable → Review Gate | **Hard FK** | A deliverable's gate must exist |
| Team Membership → Team, → Agent | **Hard FK** | Membership requires both |
| Operational History → related object | **Soft (intentional)** | OpHistory is append-only evidence that must survive supersession/deletion of the referent; a hard FK would force cascade rules that erase evidence. Enforced by **integrity audit**. |

**Soft references are the listed exceptions with a stated reason — not the default.** An **integrity-audit** job periodically verifies soft links resolve (or are intentionally dangling, e.g., a pending canonical id) and reports orphans. The derivation engine additionally surfaces missing links as `missingLinks`/contradictions (already implemented).

---

## Deliverable 5 — Record Versioning & Concurrency Specification (Condition D)

Every table adds: `version INT` (or revision), `created_at`, `updated_at`, `actor_id` (who last wrote), `request_id`/correlation id. Governed commands accept an **idempotency key**.

- **Optimistic locking:** writes require `expected_version`; the server updates only if the stored `version` matches, then increments. Mismatch → **409 Conflict** with the current record; **a stale client never silently overwrites a newer authoritative record.**
- **Idempotency:** a repeated command with the same idempotency key returns the original result without re-applying (safe retries).
- **Transactional boundaries:** each command is one DB transaction (record write + OpHistory + audit + derived-state invalidation commit or roll back together).
- **Before/after audit:** the Technical Audit Log (Deliverable 6) stores prior `version` and resulting `version` for every mutation.
- **Conflict response:** 409 with `{currentVersion, currentRecord}`; the client re-reads, re-derives, and re-issues.
- **Import concurrency:** import runs in a single transaction with an exclusive advisory lock; concurrent writes are blocked or queued; a failed import rolls back wholly.

---

## Deliverable 6 — Technical Audit vs Operational History Boundary (Condition E)

| | **Operational History** (governed) | **Technical Audit Log** (security/integrity) |
| --- | --- | --- |
| Nature | Constitutional product record; evidence | System record of activity |
| Content | Activations, acceptances, submissions, milestones | Auth events, commands, mutations, actor, timestamp, request id, result, prior→resulting version, failures, admin actions |
| Authority | Can be authoritative evidence | **Never** constitutional authority |
| Mutability | Append-only | Append-only |
| Retention | Indefinite (constitutional) | Defined window (e.g., ≥1 year), then archived |
| Access | Product Owner + governed views | Admin/security only |
| Export/backup | Included in `WorkspaceBackup` | Separate secure export; separate backup |
| Correction | Via governed `correct`/`supersede` (new record) | Never edited; corrections are new entries |

**Rule:** a Technical Audit entry **does not automatically become** Operational History. Constitutional evidence is created only by an explicit governed command (`RecordOperationalHistory`). Emergency technical intervention (Deliverable 8) is audited but is **not** constitutional history unless the Product Owner subsequently records it as such.

---

## Deliverable 7 — Final Authentication Architecture Recommendation (Condition F)

**Firm recommendation (not interchangeable options):** **Secure server-managed sessions.**

- **Sessions, not JWT:** opaque session id in an **HttpOnly, Secure, SameSite=Strict** cookie; server-side session store (DB/Redis). Rationale: no browser token storage (XSS token theft avoided), instant server-side revocation, simpler rotation. Bearer/JWT only if a documented future requirement (e.g., third-party API clients) justifies it — recorded as a decision, not a default.
- **Product Owner auth:** password (Argon2id) + **mandatory TOTP MFA**.
- **CSRF:** synchronizer token (or double-submit) on all state-changing commands; SameSite=Strict as defense-in-depth.
- **Session lifecycle:** rotate id on login/privilege change; idle + absolute expiry; explicit **logout revokes server-side**; device/session list with per-session revoke.
- **Recovery:** emailed single-use, time-boxed token; recovery events audited; a documented out-of-band **emergency recovery** for the sole Product Owner.
- **Abuse controls:** failed-login lockout with backoff; per-IP and per-account **rate limiting**; all auth events written to the Technical Audit Log.

---

## Deliverable 8 — Role & Authority Enforcement Matrix (Condition G)

**Distinct actor classes** — an agent identity is **not** a human login:

| Actor | Authenticates directly? | May propose | May **approve/accept/activate** | May edit constitutional content | Notes |
| --- | --- | --- | --- | --- | --- |
| **Product Owner** (human) | Yes (password + MFA) | Yes | **Yes — sole authority** | Yes (via governed commands) | The only approval authority |
| **Authenticated human user** (future) | Yes | Per role | No | No | Read/limited |
| **Governed agent identity** (#SOS…#CKL-R) | **No** interactive login | Yes, via scoped API key (proposed-only) | **No** | No | Work enters SCS as **proposed** records attributed to the agent |
| **Service process** (workers) | Machine credential | System actions only | No | No | Digests, retries, integrity audit |
| **System administrator** | Yes | No | **No** | **No — ops/repair only** | May run migration/backup/repair; **cannot exercise constitutional authority** |
| **Demonstration actor** | n/a | n/a | n/a | n/a | Demo data only; isolated, never authoritative |

- **How agent work enters SCS:** an agent's scoped API key can only create/advance **`proposed`** records attributed to that agent; acceptance/activation always require a Product Owner command. **Attribution** (agent identity) is preserved on the record and in the audit log.
- **Product Owner approval execution:** an authenticated PO session issues `ProductOwnerApprove`/`AcceptDeliverable`/`ActivateAgent`; the server verifies the PO role + MFA freshness.
- **Administrators cannot edit constitutional content.** Emergency technical intervention (e.g., a data repair) is performed via admin commands, **fully audited**, and is **not** constitutional Operational History unless the Product Owner later records it as such.

---

## Deliverable 9 — Import & Migration Safety Specification (Condition H)

Import pipeline (all steps before any write):

1. **Dry-run validation** (no writes) → 2. **Schema-version compatibility** check (`schema_version` vs current; migrate or reject) → 3. **Duplicate detection** (by id/canonical id) → 4. **Referential-integrity report** (unresolved hard/soft links) → 5. **Authority-status validation** (see rule below) → 6. **Demonstration-data detection** (`isSeed`/`demonstration` → staging only) → 7. **Import manifest** (record counts + per-collection content hashes) → 8. **Product Owner confirmation** required before any **production** import → 9. transactional apply with **rollback on any failure** → 10. **post-import derivation comparison** (server re-derives; compare to expected) → 11. **immutable import report** stored.

**Rule (authority is never imported blindly):** **no record becomes `approved` merely because its JSON says so.** On import, `authority_status='approved'` is accepted **only** when validated against accepted source evidence (an approved governing decision / Operational History acceptance event present in the same import or already authoritative). Otherwise the record is downgraded to `proposed`/`reported` and flagged in the import report for Product Owner ruling.

---

## Deliverable 10 — Hosting Capability Verification (Condition I)

**Slim 4 retained as provisional recommendation — hosting is NOT treated as confirmed until verified.** I do not have live introspection of the Nestify account; the following must be **verified on the actual host** before Phase 5:

**Verification checklist:** PHP version (need **8.2+**) · Composer availability (build vs upload vendored) · **cron** support (workers) · environment-variable/secret handling · TLS termination · **outbound** DB connection limits/allowlist · outbound email/API egress (for D5) · Web Push egress · backup access/scheduling · log access/retention · deploy + **rollback** mechanism (SSH/Git/panel).

**Returned assessment:**
- **Assumptions currently UNVERIFIED** (flagged, not confirmed): cron granularity, outbound egress for email/push, Composer on-host, secret storage, rollback tooling.
- **Fallbacks:** if cron is unavailable → external scheduler pinging a worker endpoint; if Composer unavailable → commit a vendored build; if outbound egress restricted → provider allowlisting or a proxy.
- **Consequences of choosing Laravel instead:** heavier footprint and more host requirements (queue/scheduler/storage), higher managed-hosting risk, but richer built-ins (Sanctum, Eloquent, Mail, Queue, Scheduler). Laravel is the fallback if Slim + managed hosting cannot meet the worker/queue needs.

**Decision gate:** hosting is **Unconfirmed** until this checklist is run against Nestify; confirming it is Product Owner decision **D-host** informed by the verification.

---

## Deliverable 11 — Revised Product Owner Decision Package

| ID | Decision | Recommendation | Status |
| --- | --- | --- | --- |
| **D3** | Framework | **Slim 4**, pending hosting verification (D10) | Open |
| **D5** | Email provider | ESP with SPF/DKIM/DMARC | Open |
| **D-auth** | Auth model | **Server-managed sessions + MFA** (settled, Deliverable 7) | **Resolved-recommendation** |
| **D-host** | Hosting confirmation | Confirm **after** capability verification (D10) | Open — blocked on verification |
| **D-migrate** | Migration approach | Dry-run + PO-confirmed import (Deliverable 9) | Open |
| **D-derive** | Derivation location | **Server-side canonical** (settled, Deliverable 2) | **Resolved-recommendation** |
| **D-api** | API shape | **Governed commands** (settled, Deliverable 3) | **Resolved-recommendation** |
| **D-prod-auth** | Production implementation authorization | Phase-by-phase; **Phase 5 narrow** (Deliverable 12) | Open |
| **D-seq** | Sequencing | Accept revised 5→9 | Open |
| **D-deploy** | Deployment authority | Product Owner authorizes go-live | Open |

Identifiers stay **Product-Owner-pending** (ST-ADR-2026-006 advisory; no ST-DEC assigned).

---

## Deliverable 12 — Updated Phase 5–9 Sequence (Condition J)

- **Phase 5 — Backend Foundation & Persistence (NARROW).** Authorizes **only**: Slim skeleton, MySQL schema + migrations, `RemoteAdapter` implementation, and **parity** (server derivation + full test suite match `LocalAdapter` on seeded staging). **Does NOT authorize:** authentication rollout, email, Web Push, **confidential-data migration**, deployment, or go-live. Data used is demo/staging only.
- **Phase 6 — Auth, Roles & Permissions** (separately gated). **No confidential production data may be hosted until this boundary is accepted.**
- **Phase 7 — Integrations** (email/push/workers). **Phase 8 — Validation.** **Phase 9 — Deployment/go-live** (Product Owner authorizes).

Each phase: own scope, deliverable, gate, Product Owner approval, exit criteria. **None authorized now.**

---

## Deliverable 13 — Correction Traceability Table

| Condition | Requirement | Addressed in |
| --- | --- | --- |
| **A** | Canonical derivation server-side; remove pass-through | **Deliverable 2**; base doc §Deliverable 1 (pass-through removed) |
| **B** | Governed commands, not unrestricted CRUD | **Deliverable 3**; base doc §API architecture |
| **C** | Database-enforced integrity + trace matrix | **Deliverable 4** |
| **D** | Record versioning & concurrency control | **Deliverable 5** |
| **E** | Immutable audit model vs Operational History | **Deliverable 6** |
| **F** | Finalize authentication (server sessions) | **Deliverable 7**; base doc §Deliverable 5 |
| **G** | Role & authority enforcement; agent ≠ human login | **Deliverable 8** |
| **H** | Import & migration safety | **Deliverable 9** |
| **I** | Resolve Slim deployment assumptions | **Deliverable 10** |
| **J** | Phase 5 must remain narrow | **Deliverable 12**; base doc §Deliverable 12 |

---

## Deliverable 14 — No production implementation began

Confirmed. This corrected package is **specification only**. No PHP API, MySQL migration, authentication, integration, hosted-data transfer, or deployment was written or started. Governed records were updated solely to reflect the gate disposition (Approved with Conditions) and the resubmission for final review. Identifiers remain Product-Owner-pending.

**Phase 5 may begin only after** (1) these corrections are submitted (done), (2) the Product Owner accepts the corrected architecture, and (3) the Product Owner issues a separate production-implementation directive.
