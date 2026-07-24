import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="scs-page-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          {eyebrow && <p className="scs-page-header__eyebrow">{eyebrow}</p>}
          <h1 className="scs-page-header__title">{title}</h1>
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {subtitle && <p className="scs-page-header__subtitle">{subtitle}</p>}
    </header>
  );
}

export function Card({
  children,
  glass,
  className,
  style,
}: {
  children: ReactNode;
  glass?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`scs-card${glass ? ' scs-card--glass' : ''}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}

/**
 * Empty states teach: never "No data." Always explain why, what's next, how to proceed.
 */
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="scs-empty">
      <p className="scs-empty__title">{title}</p>
      <p className="scs-empty__body">{children}</p>
    </div>
  );
}

export function MetaGrid({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="scs-meta">
      {rows.map(([k, v]) => (
        <div className="scs-meta__row" key={k}>
          <dt className="scs-meta__key">{k}</dt>
          <dd className="scs-meta__val" style={{ margin: 0 }}>{v ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: '0 0 14px', fontWeight: 600 }}>
      {children}
    </h2>
  );
}
