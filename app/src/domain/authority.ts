/**
 * Authority is DISPLAYED, never MANUFACTURED (Non-Negotiable Rule #3).
 *
 * Every governed record carries an authority state. The UI must render these
 * distinctly so a *proposed* record can never *look* approved (Rule #4).
 * This union is the single source of truth for that ordering.
 */
export const AUTHORITY_STATES = [
  'reported',
  'verified',
  'proposed',
  'approved',
  'superseded',
] as const;

export type AuthorityState = (typeof AUTHORITY_STATES)[number];

/** Ascending "settledness". Higher = more authoritative (superseded sits apart). */
const RANK: Record<AuthorityState, number> = {
  reported: 0,
  verified: 1,
  proposed: 2,
  approved: 3,
  superseded: -1,
};

export const isApproved = (s: AuthorityState): boolean => s === 'approved';

/** True when the record is not yet authoritative and must be visibly marked so. */
export const isUnsettled = (s: AuthorityState): boolean =>
  s === 'reported' || s === 'verified' || s === 'proposed';

export const authorityRank = (s: AuthorityState): number => RANK[s];
