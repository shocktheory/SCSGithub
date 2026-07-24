# Contributing to SCS

SCS is a governed product build, not a disposable prototype. Contributions follow the phase plan and
the Non-Negotiable Rules in [`PRODUCT_CHARTER.md`](PRODUCT_CHARTER.md).

## Ground rules

1. **Respect the phase gates.** Do not build beyond the currently approved phase. Each phase stops
   for Product Owner review.
2. **Architecture lives in the repo, not in chat** (§36). If a decision matters, record it in
   [`DECISIONS.md`](DECISIONS.md).
3. **Keep the layers clean** (see `ARCHITECTURE.md` §3). Domain code never imports UI. Persistence is
   only ever reached through `StorageAdapter`.
4. **Never manufacture authority or invent data.** Seed/demo content is flagged and labeled.
5. **Accessibility is part of the work**, not a follow-up. New color pairings go in the
   `ACCESSIBILITY.md` table with measured contrast.
6. **No secrets committed.** Ever.

## Workflow

```bash
cd app
npm install
npm run typecheck && npm test   # must pass before committing
```

- Branch from `main`; open a PR; CI (typecheck + test + build) must be green.
- Conventional, plain-language commit messages. Update `CHANGELOG.md` for user-visible changes.
- Prefer clear over clever; proven over novel (Rules #15, #16).

## Where things go

| Adding… | Put it in |
|---|---|
| A new entity / field | `app/src/domain/entities/` + `DATA_MODEL.md` + a Zod schema |
| A reusable UI piece | `app/src/design-system/components/` |
| A navigation section | `app/src/features/<section>/` |
| A persistence concern | behind `app/src/storage/StorageAdapter.ts` |
| A cross-cutting utility | `app/src/lib/` |
