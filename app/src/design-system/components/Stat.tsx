import type { ReactNode } from 'react';

type StatTone = 'default' | 'muted' | 'accent' | 'review';

/** A quantity read before its description — supports fast executive comprehension. */
export function StatTile({
  value,
  label,
  tone = 'default',
  small,
}: {
  value: ReactNode;
  label: string;
  tone?: StatTone;
  small?: boolean;
}) {
  const toneClass = tone === 'default' ? '' : ` scs-stat__value--${tone}`;
  return (
    <div className="scs-stat">
      <span className={`scs-stat__value${small ? ' scs-stat__value--sm' : ''}${toneClass}`}>{value}</span>
      <span className="scs-stat__label">{label}</span>
    </div>
  );
}

/** Restrained maturity indicator (0–1). */
export function MaturityMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="scs-meter" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="scs-meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
