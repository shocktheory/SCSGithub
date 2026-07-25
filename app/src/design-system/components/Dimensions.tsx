import type { ReactNode } from 'react';

type DimensionTone = 'authority' | 'governance' | 'work' | 'maturity' | 'gate' | 'neutral';

/**
 * A record may carry several dimensions (authority, governance, work state,
 * maturity, gate). Each is labeled with its dimension name so they are never
 * confused for one another (Revision 02 — separate record dimensions).
 */
export function DimensionTag({
  label,
  children,
  tone = 'neutral',
}: {
  label: string;
  children: ReactNode;
  tone?: DimensionTone;
}) {
  return (
    <span className={`scs-dim scs-dim--${tone}`}>
      <span className="scs-dim__label">{label}</span>
      <span className="scs-dim__value">{children}</span>
    </span>
  );
}

export function DimensionRow({ children }: { children: ReactNode }) {
  return <div className="scs-dim-row">{children}</div>;
}
