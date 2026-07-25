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

/** Demonstration data is constitutionally isolated — never real approved truth. */
export function DemonstrationBadge() {
  return (
    <span className="scs-seed-flag" title="Demonstration data — constitutionally isolated. Never exported as truth, cited as provenance, or counted in real metrics.">
      Demonstration Data
    </span>
  );
}

/**
 * Governance overlay badge. "Constitutional Review" is a governance state that sits
 * alongside — not instead of — the authority lifecycle (Revision 02).
 */
export function GovernanceBadge({ label = 'Constitutional Review' }: { label?: string }) {
  return (
    <span className="scs-gov-badge" title="Under active Product Owner constitutional review.">
      <span className="scs-badge__dot" aria-hidden />
      {label}
    </span>
  );
}
