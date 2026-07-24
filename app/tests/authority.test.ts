import { describe, expect, it } from 'vitest';
import {
  AUTHORITY_STATES,
  isApproved,
  isUnsettled,
  authorityRank,
} from '../src/domain/authority';

// Guards the constitutional invariant: proposed must never be treated as approved.
describe('authority states', () => {
  it('enumerates the five governed states', () => {
    expect(AUTHORITY_STATES).toEqual([
      'reported',
      'verified',
      'proposed',
      'approved',
      'superseded',
    ]);
  });

  it('treats only "approved" as approved', () => {
    expect(isApproved('approved')).toBe(true);
    expect(isApproved('proposed')).toBe(false);
  });

  it('marks pre-approval states as unsettled so the UI flags them', () => {
    expect(isUnsettled('reported')).toBe(true);
    expect(isUnsettled('verified')).toBe(true);
    expect(isUnsettled('proposed')).toBe(true);
    expect(isUnsettled('approved')).toBe(false);
  });

  it('ranks approved above proposed', () => {
    expect(authorityRank('approved')).toBeGreaterThan(authorityRank('proposed'));
  });
});
