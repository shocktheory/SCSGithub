import type { AuthorityState } from '../../domain/authority';

const AUTHORITY_LABEL: Record<AuthorityState, string> = {
  reported: 'Reported',
  verified: 'Verified',
  proposed: 'Proposed',
  approved: 'Approved',
  superseded: 'Superseded',
};

/**
 * AuthorityBadge — the constitutional "is this approved?" signal.
 * Status carries a text label AND a dot, so meaning never depends on color alone.
 */
export function AuthorityBadge({ state }: { state: AuthorityState }) {
  return (
    <span className={`scs-badge scs-badge--${state}`} title={`Authority: ${AUTHORITY_LABEL[state]}`}>
      <span className="scs-badge__dot" aria-hidden />
      {AUTHORITY_LABEL[state]}
    </span>
  );
}

type StatusTone = 'approved' | 'proposed' | 'verified' | 'review' | 'risk' | 'neutral';

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return (
    <span className={`scs-badge scs-badge--${tone}`}>
      <span className="scs-badge__dot" aria-hidden />
      {label}
    </span>
  );
}

export function SeedFlag() {
  return (
    <span className="scs-seed-flag" title="This is labeled demo/seed data — review and correct.">
      Demo data
    </span>
  );
}
