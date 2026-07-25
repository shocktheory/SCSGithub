# SCS Phase 6 Implementation — Identity, Authority & Trust

**Status:** **Accepted** — Product Owner disposition of the Phase 6 Implementation Review: *Implemented, Verified & Accepted* (2026-07-25). ST-DLV-2026-010 accepted; rgate-010 closed Approved; adr-011 closed.
**Authority:** Product Owner Implementation Authorization Directive — *Authorize Phase 6 Implementation* (2026-07-25), within the accepted Phase 6 Authorization Package and Authentication & Authority Principles.
**Runtime verification:** GitHub Actions "Phase 5 Runtime Verification" (extended for Phase 6), commit `30d4216` — **conclusion: success** on real PHP 8.2 + MySQL 8.
**Acceptance decisions (Product Owner):** Administrator MFA remains optional in Phase 6 (mandatory deferred); infrastructure rate-limiting deferred to Phase 10 (application-layer lockout sufficient for Phase 6); client login UI is outside Phase 6 scope; the full Technical Audit Log remains Phase 8. This acceptance does **not** authorize Phase 7, confidential data, hosting, deployment, or launch.

> **#SCS did not self-accept Phase 6.** It was submitted for, and received, Product Owner disposition. Implementation stayed strictly within the approved scope; no notifications, hosting, deployment, confidential data, external identity, Technical Audit Log, or launch. Commits `30d4216` and `9c0e33c` are preserved as accepted revisions.

---

## 1. Executive Summary

Phase 6 implements the **Identity, Authority, and Trust** foundation on the accepted Slim 4 + MySQL backend, transforming SCS from a protected development platform into a **governed** one with a server-enforced approval boundary. Native identity only (email/password + Argon2id + secure server-managed sessions + TOTP MFA; **no external IdP, no JWT**); a role/permission model with a **Product-Owner-only approval boundary**; and an authenticated **attribution seam**. Every mandatory rejection scenario is enforced and tested. All of it was **executed and passed in CI** against real MySQL — including the HTTP e2e of the auth boundary. The accepted **Authentication & Authority Principles** are upheld throughout.

---

## 2. Identity Implementation Report

- **Users** (`users` table, migration `0002_auth.sql`): id, email (unique), Argon2id `password_hash`, role, optional TOTP `mfa_secret`, status, failed-login counter, lock timestamp.
- **Authentication** (`Auth::login`): email/password with `password_verify` (Argon2id); **TOTP MFA mandatory for the Product Owner** (and any user with an enrolled secret); failed-login **lockout** after 5 attempts.
- **Sessions** (`sessions` table): opaque server session id (not a JWT); **idle** (30 min) + **absolute** (12 h) expiry; **rotation** (`Auth::rotate`, revokes the old id); **revocation** (single + all-sessions); **logout**; issued as an **HttpOnly, Secure, SameSite=Strict** cookie.
- **Recovery** (`recovery_tokens`): single-use, time-boxed token; consuming it resets the password and revokes existing sessions.
- **Actor identity resolution** (`Auth::resolveActor`): resolves the authenticated actor from the session cookie on every request, enforcing revocation/expiry/idle and tracking MFA freshness.
- **Endpoints:** `POST /api/auth/login|logout|recover`, `GET /api/auth/session`, and a dev/test-only `POST /api/auth/dev-seed`.

---

## 3. Authority Implementation Report

- **Role model:** `product_owner`, `administrator`, `agent`, `service` (plus `anon` = unauthenticated dev/test). No additional human users (per decision).
- **Permission model** (`Authz`): action matrix for `read`/`propose`/`admin`/`approve`, least privilege by default; denied actions return a structured **403**.
- **Server-side approval boundary:** the **`approve` command is Product-Owner-only** and requires **fresh MFA** (`Authz::canApprove`). A plain `upsert` may **never** set elevated authority (`approved`/`accepted`/`activated`) — it returns 403 and directs the caller to the approval command; an already-approved record's authority cannot be altered via `upsert`.
- **Agent authority:** agents may only `propose` (create/advance non-authoritative records); they can never approve/accept/activate/elevate.
- **Administrator authority:** admin/ops only — administrators **cannot** set authority.
- **Enforcement point:** authorization is checked in the command layer (and CSRF in the route middleware) — never on the client.

---

## 4. Trust Implementation Report

- **Authenticated attribution** (`mutation_attributions`): every governed mutation records actor id, actor role, request id, and action.
- **Request identifiers:** `X-Request-Id` propagates from the client through commands into attribution.
- **Approval integrity:** authority transitions occur only via the authenticated Product Owner `approve` command; recorded to `auth_events`.
- **Attribution seam only:** this is the Phase 6 seam — the **full Technical Audit Log remains Phase 8** (not implemented here), as directed.

---

## 5. Verification Evidence

Executed in CI (commit `30d4216`, run on PHP 8.2 + MySQL 8, conclusion **success**):
- migration `0002_auth` applied; backend booted; `/api/health` OK.
- **PHPUnit** (real MySQL): `AuthTest` + `PersistenceTest` — all passed.
- **Auth e2e** (real HTTP, `SCS_E2E_BASE`): login+MFA, session cookie, CSRF, PO approve, forged-CSRF rejection, agent/unauthenticated denial, logout — all passed.
- **Phase 5 persistence e2e** and the full **frontend** suite remained green (no regression).

---

## 6. Test Results

| Suite | Where | Result |
| --- | --- | --- |
| Frontend (vitest) | local + CI | 39 pass (+ 8 e2e skipped locally) |
| Backend PHPUnit (`AuthTest` 13 + `PersistenceTest` 8) | CI (real MySQL) | **21 pass** |
| Auth e2e (`auth.e2e.test.ts`) | CI (real backend) | **3 pass** |
| Persistence e2e (`remoteAdapter.e2e.test.ts`) | CI (real backend) | 5 pass |

**Mandatory regression scenarios — all enforced & tested:** agent approval → denied · admin authority mutation → denied · unauthenticated approval → 401 · replay (idempotency) → single apply · stale session → not resolved · stale version → 409 · forged CSRF → 403 · direct authority mutation via upsert → 403 · client-side authority manipulation → 403.

---

## 7. Traceability Update

```
Capability → Requirement → Verification → Evidence
Authentication & Identity Lifecycle → Argon2id/sessions/MFA/rotation/revoke/expiry/recovery/lockout → AuthTest + auth e2e → CI 30d4216 (green)
Roles & Permissions → matrix/least-privilege/approval-boundary/agent-propose-only/admin-no-authority → AuthTest (authz + regressions) + auth e2e → CI green
Authenticated Attribution → actor+request-id on mutations; approval integrity → AuthTest(attribution) + auth_events → CI green
```

---

## 8. Risk Assessment

| Risk | Status / mitigation |
| --- | --- |
| Approval-boundary bypass | Mitigated — PO-only `approve` + fresh MFA; negative tests enforce; residual low |
| Session theft (XSS) | Mitigated — HttpOnly server sessions (no browser token) |
| CSRF | Mitigated — token required for authenticated writes; tested |
| Agent misuse | Mitigated — agents propose-only; cannot approve/elevate; tested |
| Brute force | Mitigated — lockout + (rate-limiting recommended at hosting, Phase 10) |
| Attribution completeness | Partial — attribution seam only; full Technical Audit Log is Phase 8 |

---

## 9. Remaining Known Limitations

- **Full Technical Audit Log** is Phase 8 (only the attribution seam exists now).
- **Rate limiting** (per-IP) is recommended at the hosting/edge layer in Phase 10; lockout is implemented at the app layer.
- **Administrator MFA** is optional in Phase 6 (enforced when a secret is enrolled); the decision requires it "later" — recommend making it mandatory in a later phase.
- **Client login UI** is out of Phase 6 scope (backend identity/authority foundation); the client already sends `credentials:'include'` for future use.
- **Production hosting/deployment** is not part of Phase 6 (Phase 10).

---

## 10. Product Owner Decision Queue

- Accept Phase 6 implementation? · make **Administrator MFA mandatory** now or in a later phase? · rate-limiting placement (app vs edge, Phase 10) · when to build the **client login UI** · canonical **ST-ADR/ST-DEC** identifier standard (still deferred) · whether Phase 7 (Server-Side Derivation & Authority Completion) should be prepared next.

---

## 11. Phase 6 Readiness Assessment

| Question | Answer |
| --- | --- |
| Implementation complete (within scope)? | **Yes** — Identity, Authority, Trust attribution delivered. |
| Verification complete? | **Yes** — executed and green in CI on real PHP 8.2 + MySQL 8, including HTTP auth e2e and all mandatory regressions. |
| Acceptance criteria satisfied? | **Yes** to the approved Phase 6 criteria (auth boundary un-bypassable; agents propose-only; PO sole authority; attribution present). |
| Ready for Product Owner review? | **Yes.** |

**#SCS does not self-accept Phase 6.** Submitted to the **Phase 6 Implementation Review** gate for Product Owner disposition. No Phase 7 work has begun; no deployment, confidential data, hosting decision, or launch occurred.
