import { describe, expect, it } from 'vitest';
import { deriveAgentState, type DeriveInput } from '../src/lib/derivation';

// Full activation evidence set (approved baseline).
const full = (): DeriveInput => ({
  agentName: '#X',
  standingDirective: { id: 'ST-SD-005', version: 'v1', status: 'Current' },
  productOwnerAuthority: { id: 'ST-DEC-2026-008', approved: true },
  activationEventIds: ['ST-OPH-2026-004'],
  teamMembership: { label: 'TEAM-001 — Active', active: true },
});

describe('Constitutional State Derivation Engine — activation evidence set', () => {
  it('Available: full evidence, no Assignment Directive', () => {
    const s = deriveAgentState(full());
    expect(s.activated).toBe(true);
    expect(s.status).toBe('Available');
    expect(s.currentGate).toBe('Awaiting Assignment');
    expect(s.synchronization).toBe('Not Required');
    expect(s.directiveCoverage).toBe('Full');
    expect(s.assignmentDirectiveStatus).toBe('Not Applicable — Awaiting Assignment');
    expect(s.missingLinks).toEqual([]);
  });

  it('missing Current Standing Directive → Pending Onboarding', () => {
    const s = deriveAgentState({ ...full(), standingDirective: undefined });
    expect(s.activated).toBe(false);
    expect(s.missingEvidence).toContain('Current Standing Directive');
    expect(s.status).toBe('Pending Onboarding');
  });

  it('inactive Standing Directive (not Current) → Pending Onboarding', () => {
    const s = deriveAgentState({ ...full(), standingDirective: { id: 'ST-SD-005', version: 'v1', status: 'Pending activation' } });
    expect(s.activated).toBe(false);
    expect(s.missingEvidence).toContain('Current Standing Directive');
  });

  it('missing Product Owner authority → Pending Onboarding', () => {
    const s = deriveAgentState({ ...full(), productOwnerAuthority: { id: 'x', approved: false } });
    expect(s.activated).toBe(false);
    expect(s.missingEvidence).toContain('Product Owner activation authority');
  });

  it('missing Operational History activation event → Pending Onboarding', () => {
    const s = deriveAgentState({ ...full(), activationEventIds: [] });
    expect(s.activated).toBe(false);
    expect(s.missingEvidence).toContain('Operational History activation event');
  });

  it('missing Team Membership → Pending Onboarding', () => {
    const s = deriveAgentState({ ...full(), teamMembership: undefined });
    expect(s.activated).toBe(false);
    expect(s.missingEvidence).toContain('active Team Membership');
  });

  it('contradictory evidence (Standing Current but authority not approved) → not activated', () => {
    const s = deriveAgentState({ ...full(), productOwnerAuthority: { id: 'ST-DEC-2026-008', approved: false } });
    expect(s.activated).toBe(false);
  });
});

describe('assignment lifecycle derives only from Assignment Directives', () => {
  it('Active Assignment Directive → Working, gate from directive', () => {
    const s = deriveAgentState({ ...full(), activeAssignmentDirective: { directiveId: 'ST-ADR-2026-002', title: 'Build', status: 'Active', deliverable: 'D', reviewGate: 'Gate A' } });
    expect(s.status).toBe('Working');
    expect(s.currentGate).toBe('Gate A');
    expect(s.directiveCoverage).toBe('Full');
  });

  it('Waiting Assignment Directive → Waiting on dependency', () => {
    const s = deriveAgentState({ ...full(), activeAssignmentDirective: { directiveId: 'ST-ADR-2026-010', title: 'Blocked task', status: 'Waiting on dependency', deliverable: 'D', reviewGate: 'G' } });
    expect(s.status).toBe('Waiting on dependency');
  });

  it('Blocked Assignment Directive → Blocked (alignment Warning)', () => {
    const s = deriveAgentState({ ...full(), activeAssignmentDirective: { directiveId: 'ST-ADR-2026-011', title: 'Blocked', status: 'Blocked', deliverable: 'D', reviewGate: 'G' } });
    expect(s.status).toBe('Blocked');
    expect(s.alignment).toBe('Warning');
  });

  it('Assignment Directive missing a Review Gate → Partial coverage (flagged)', () => {
    const s = deriveAgentState({ ...full(), activeAssignmentDirective: { directiveId: 'ST-ADR-2026-012', title: 'No gate', status: 'Active', deliverable: 'D' } });
    expect(s.directiveCoverage).toBe('Partial');
    expect(s.missingLinks).toContain('Assignment Directive has no Review Gate');
  });

  it('every derived state carries a traceable explanation', () => {
    const s = deriveAgentState(full());
    expect(s.trace.sourceRecords.length).toBeGreaterThan(0);
    expect(s.trace.logic.length).toBeGreaterThan(0);
  });
});
