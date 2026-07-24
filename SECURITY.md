# SCS Security & Privacy

SCS will eventually hold confidential product, legal, patent, and company information. It is built
with that future in mind from v0.1 (§32).

## v0.1 posture

- **No unnecessary third-party transmission.** No analytics, no trackers, no telemetry.
- **No confidential exposure.** Authenticated SCS content and seed data are never served publicly.
- **Sanitize imports.** All imported JSON is Zod-validated and sanitized before it touches storage.
- **Protect exports.** Backups may contain sensitive data; treat exported files as confidential.
- **Label demo data.** Seed content is flagged `isSeed` and visibly labeled so it is never mistaken
  for authoritative truth.
- **No secrets in the repo.** `.env*` is gitignored; only `*.env.example` (placeholders) is committed.

## Secrets management

- Client build takes **no** secrets (it is static and public once served).
- Server secrets (DB, VAPID push keys, email API keys) live in `server/.env` on Nestify — never
  committed, never logged. See `server/.env.example` for the required variables.

## Phase 0 obligations for production (to design before hosted launch — §25, §32)

Authentication, private access control, and hosted data protection **must** be addressed before
publishing at shocktheoryos.com. Recommended for Phase 3:

- **Authentication:** private single-owner (plus future invited stewards) auth over HTTPS; server
  sessions or signed tokens; no third-party identity provider unless separately approved.
- **Transport:** HTTPS only; HSTS; secure, httpOnly, SameSite cookies.
- **Authorization:** re-check current authority before presenting sensitive details (also in
  notifications — privacy-safe previews; no confidential titles on lock screens unless opted in).
- **Data at rest:** MySQL on Nestify; documented backup + restore; encryption of sensitive fields
  evaluated in Phase 3.
- **Email:** authenticated sending domain (SPF, DKIM, DMARC); no confidential content, credentials,
  or patent details in email bodies; deep links instead.
- **Auditability:** notification delivery/open/dismissal history; decision and update change history
  preserved.

## Reporting

Security concerns → Product Owner (Sonja Ross) directly. Do not file sensitive details in public
issue trackers.
