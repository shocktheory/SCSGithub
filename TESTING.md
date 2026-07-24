# SCS Testing

Business logic must be testable, and the constitutional invariants must be *guarded* by tests.

## Layers

| Layer | Tool | Scope |
|---|---|---|
| Unit / domain | **Vitest** | Authority logic, next-action logic, schema validation, import/export round-trips. Pure, fast, no DOM. |
| Component | **Vitest + React Testing Library** | Design-system primitives and feature components; behavior and a11y roles. |
| End-to-end | **Playwright** | Critical user journeys across the shell. |
| Accessibility | **@axe-core/playwright** | Automated WCAG checks in e2e (Phase 4 gate). |

## Commands

```bash
cd app
npm test            # Vitest once (CI)
npm run test:watch  # Vitest watch
npm run test:e2e    # Playwright (Phase 4+)
npm run typecheck   # strict TS is the first line of defense
```

## Priority invariants to test (from §38)

1. **Proposed never reads as approved** — authority-state rendering and `isApproved`/`isUnsettled`
   logic. (Seeded in `tests/authority.test.ts`.)
2. **Backup round-trip** — export → import reproduces the workspace exactly, schema-version checked.
3. **Guarded reset** — `resetWorkspace` cannot fire without a valid confirmation token.
4. **Seed labeling** — seed data always carries `isSeed`.
5. **Cheatsheet is derived** — generated output matches live data; no separate store.
6. **Import sanitization** — malformed/hostile JSON is rejected by Zod, not persisted.

## CI

`.github/workflows/ci.yml` runs typecheck → test → build on every push/PR and uploads the static
`dist` artifact. Green CI is required before a phase is considered complete.
