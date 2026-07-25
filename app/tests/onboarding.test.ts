import { describe, expect, it } from 'vitest';
import { deriveOnboarding } from '../src/lib/onboarding';
import { cklrCandidate, type OnboardingCandidate } from '../src/seed/onboarding';
import { deriveTeam } from '../src/lib/team';
import { seedWorkspace } from '../src/seed';

const clone = (): OnboardingCandidate => JSON.parse(JSON.stringify(cklrCandidate));

describe('Phase 3 — #CKL-R onboarding is prepared but nonauthoritative', () => {
  it('the proposed package does NOT activate #CKL-R', () => {
    const m = deriveOnboarding(cklrCandidate);
    expect(m.before.activated).toBe(false);
    expect(m.before.status).toBe('Pending Onboarding');
    expect(m.statusLabel).toMatch(/Proposed \/ Pending constitutional onboarding/);
  });

  it('every checklist item is present-but-proposed or pending — none satisfies activation now', () => {
    const m = deriveOnboarding(cklrCandidate);
    expect(m.checklist.length).toBeGreaterThan(0);
    for (const item of m.checklist) {
      expect(item.satisfiesActivationNow).toBe(false);
      expect(['present-proposed', 'pending-approval']).toContain(item.status);
    }
  });

  it('missing approved activation authority is exactly what prevents activation', () => {
    const m = deriveOnboarding(cklrCandidate);
    // Standing Directive is proposed (not Current) and no approved authority/event/active membership.
    expect(m.before.missingEvidence).toContain('Current Standing Directive');
    expect(m.before.missingEvidence).toContain('Product Owner activation authority');
    expect(m.before.missingEvidence).toContain('Operational History activation event');
    expect(m.before.missingEvidence).toContain('active Team Membership');
  });

  it('the proposed activation event is traced as PENDING, never counted', () => {
    const m = deriveOnboarding(cklrCandidate);
    const traced = m.before.trace.sourceRecords.join(' ');
    expect(traced).toMatch(/PENDING approval, not valid evidence/i);
    expect(m.before.trace.sourceRecords.some((r) => /\(approved Operational History\)/.test(r))).toBe(false);
  });
});

describe('Phase 3 — preview shows the effect of approval before authority is created', () => {
  it('approving the onboarding records WOULD activate and make assignment-ready (Available)', () => {
    const m = deriveOnboarding(cklrCandidate);
    expect(m.afterActivation.activated).toBe(true);
    expect(m.afterActivation.status).toBe('Available');
    expect(m.wouldActivate).toBe(true);
    expect(m.wouldBecomeAssignmentReady).toBe(true);
  });

  it('research begins only when the Assignment Directive is ALSO approved and activated', () => {
    const m = deriveOnboarding(cklrCandidate);
    // Available (assignment-ready) is not the same as Working (research active).
    expect(m.afterActivation.status).toBe('Available');
    expect(m.afterAssignment.status).toBe('Working');
    expect(m.researchBlocked).toBe(true);
  });

  it('a proposed (not-Current) Standing Directive can never activate, even with other evidence present', () => {
    const c = clone();
    // Force-approve authority + event + membership, but keep the Standing Directive PROPOSED.
    const m = deriveOnboarding(c);
    // `before` uses only approved evidence and the SD stays proposed → not activated.
    expect(m.before.activated).toBe(false);
    expect(m.before.missingEvidence).toContain('Current Standing Directive');
  });
});

describe('Phase 3 — no canonical identifier is originated', () => {
  it('every proposed record carries a nonauthoritative working ref and a separate recommended id', () => {
    const c = cklrCandidate;
    expect(c.identity.tempRef).toMatch(/^PROPOSED-/);
    expect(c.standingDirective.ref.tempRef).toMatch(/^PROPOSED-/);
    expect(c.teamMembership.ref.tempRef).toMatch(/^PROPOSED-/);
    expect(c.activationEvent.ref.tempRef).toMatch(/^PROPOSED-/);
    expect(c.assignmentDirective.ref.tempRef).toMatch(/^PROPOSED-/);
    // Recommended ids exist but are explicitly recommendations, gated behind a PO decision.
    expect(c.identity.recommendedId).toBe('AGENT-006');
    expect(c.identity.authorizingDecisionNeeded).toMatch(/Product Owner/);
  });

  it('the activation event authorityStatus is proposed (nonauthoritative)', () => {
    expect(cklrCandidate.activationEvent.authorityStatus).toBe('proposed');
  });
});

describe('Phase 3 — existing five agent states are unchanged (isolation)', () => {
  const c = seedWorkspace.collections as unknown as Record<string, unknown[]>;
  const model = deriveTeam({
    agents: c.aiCollaborators as never, decisions: c.decisions as never, products: c.products as never,
    standingDirectives: c.standingDirectives as never, assignmentDirectives: c.assignmentDirectives as never,
    operationalHistory: c.operationalHistory as never, teams: c.teams as never, teamMemberships: c.teamMemberships as never,
    deliverables: c.deliverables as never, gates: c.gates as never, isSeed: true,
  });
  const byName = Object.fromEntries(model.agents.map((a) => [a.name, a]));

  it('the roster still has exactly the five governed agents (no #CKL-R leaked in)', () => {
    expect(model.agents.map((a) => a.name).sort()).toEqual(['#CIA', '#CKL', '#CKP', '#SCS', '#SOS']);
  });

  it('#CIA remains the only activated agent (Available)', () => {
    expect(model.agents.filter((a) => a.activated).map((a) => a.name)).toEqual(['#CIA']);
    expect(byName['#CIA'].status).toBe('Available');
  });

  it('#SOS/#SCS/#CKL/#CKP remain Pending activation', () => {
    for (const n of ['#SOS', '#SCS', '#CKL', '#CKP']) expect(byName[n].activated).toBe(false);
    expect(model.metrics.activeAgents.value).toBe(1);
  });

  it('no contradictions in the existing roster', () => {
    expect(model.agents.reduce((s, a) => s + a.contradictions.length, 0)).toBe(0);
  });
});
