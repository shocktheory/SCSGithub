import { SCHEMA_VERSION } from '@domain/schemaVersion';

/**
 * Phase 0 shell.
 *
 * This is an intentionally inert placeholder that proves the toolchain compiles
 * and the design tokens render. No feature UI (the 11 navigation sections) is
 * built yet — that begins in Phase 1 after Product Owner review.
 */
export function App() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <section
        style={{
          maxWidth: 560,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-7)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          ShockTheory Constitutional System
        </p>
        <h1 style={{ margin: '8px 0 12px', fontSize: 28, fontWeight: 600 }}>
          Executive operating environment
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Phase 0 scaffold. The toolchain, design tokens, and typed domain model are in
          place. Feature sections begin in Phase 1 after Product Owner review.
        </p>
        <p style={{ marginTop: 'var(--space-5)', fontSize: 13, color: 'var(--text-muted)' }}>
          Data schema v{SCHEMA_VERSION}
        </p>
      </section>
    </main>
  );
}
