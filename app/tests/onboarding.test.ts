import { describe, expect, it } from 'vitest';
import { deriveOnboarding } from '../src/lib/onboarding';
import { cklrCandidate } from '../src/seed/onboarding';
import { deriveTeam } from '../src/lib/team';
import { seedWorkspace } from '../src/seed';

describe('Phase 3 — AGENT-006/#CKL-R is onboarded and ACTIVATED (Available — Awaiting Assignment)', () => {
  const m = deriveOnboarding(cklrCandidate);

  it('derives as activated from the approved evidence', () => {
    expect(m.activated).toBe(true);
    expect(m.current.activated).toBe(true);
  });

  it('is Available — Awaiting Assignment, NOT Working', () => {
    expect(m.current.status).toBe('Available');
    expect(m.current.currentGate).toBe('Awaiting Assignment');
    expect(m.isAvailableAwaitingAssignment).toBe(true);
    expect(m.current.status).not.toBe('Working');
  });

  it('has no missing evidence and no contradictions', () => {
    expect(m.current.missingEvidence).toEqual([]);
    expect(m.contradictions).toEqual([]);
  });

  it('the onboarding evidence records count toward activation', () => {
    const byLabel = Object.fromEntries(m.checklist.map((i) => [i.label, i]));
    expect(byLabel['Standing Directive (Current)'].satisfiesActivationNow).toBe(true);
    expect(byLabel['Product Owner activation authority'].satisfiesActivationNow).toBe(true);
    expect(byLabel['Operational History activation event'].satisfiesActivationNow).toBe(true);
    expect(byLabel['Team Membership (TEAM-001, Active)'].satisfiesActivationNow).toBe(true);
    expect(byLabel['Standing Directive (Current)'].status).toBe('present-approved');
  });

  it('preserves proposal → approval provenance', () => {
    const sd = m.provenance.find((p) => p.record === 'Standing Directive')!;
    expect(sd.from).toBe('PROPOSED-ST-SD-CKL-R');
    expect(sd.to).toBe('ST-SD-006');
    const id = m.provenance.find((p) => p.record === 'Agent identity')!;
    expect(id.from).toBe('PROPOSED-AGENT-CKL-R');
    expect(id.to).toBe('AGENT-006');
  });
});

describe('Phase 3 — the competitive-research assignment remains nonauthoritative; research is blocked', () => {
  const m = deriveOnboarding(cklrCandidate);

  it('the research Assignment Directive is proposed / not active', () => {
    expect(cklrCandidate.assignmentDirective.status).toBe('Proposed — not active');
    const item = m.checklist.find((i) => i.label === 'Competitive-research Assignment Directive')!;
    expect(item.status).toBe('present-proposed');
    expect(item.satisfiesActivationNow).toBe(false);
  });

  it('no canonical ST-ADR identifier is assigned', () => {
    expect(cklrCandidate.assignmentDirective.ref).not.toHaveProperty('approvedId');
    expect(cklrCandidate.assignmentDirective.ref.recommendedId).toMatch(/not assigned/i);
  });

  it('research is blocked and the only remaining decision is the research assignment', () => {
    expect(m.researchBlocked).toBe(true);
    expect(m.requiredDecisions).toHaveLength(1);
    expect(m.requiredDecisions[0]).toMatch(/Assignment Directive/i);
  });

  it('an active research assignment WOULD make it Working — but that state is illustrative only', () => {
    expect(m.withAssignment.status).toBe('Working');
    // The current, real state is not Working.
    expect(m.current.status).toBe('Available');
  });
});

describe('Phase 3 — the full team now derives two activated agents', () => {
  const c = seedWorkspace.collections as unknown as Record<string, unknown[]>;
  const model = deriveTeam({
    agents: c.aiCollaborators as never, decisions: c.decisions as never, products: c.products as never,
    standingDirectives: c.standingDirectives as never, assignmentDirectives: c.assignmentDirectives as never,
    operationalHistory: c.operationalHistory as never, teams: c.teams as never, teamMemberships: c.teamMemberships as never,
    deliverables: c.deliverables as never, gates: c.gates as never, isSeed: true,
  });
  const byName = Object.fromEntries(model.agents.map((a) => [a.name, a]));

  it('the roster now includes #CKL-R alongside the five existing agents', () => {
    expect(model.agents.map((a) => a.name).sort()).toEqual(['#CIA', '#CKL', '#CKL-R', '#CKP', '#SCS', '#SOS']);
  });

  it('exactly two agents are activated: #CIA and #CKL-R', () => {
    expect(model.agents.filter((a) => a.activated).map((a) => a.name).sort()).toEqual(['#CIA', '#CKL-R']);
    expect(model.metrics.activeAgents.value).toBe(2);
  });

  it('#CKL-R is Available — Awaiting Assignment and not Working', () => {
    expect(byName['#CKL-R'].status).toBe('Available');
    expect(byName['#CKL-R'].currentGate).toBe('Awaiting Assignment');
    expect(byName['#CKL-R'].assigned).toBe(false);
  });

  it('the five existing agent states are unchanged', () => {
    expect(byName['#CIA'].status).toBe('Available');
    for (const n of ['#SOS', '#SCS', '#CKL', '#CKP']) expect(byName[n].activated).toBe(false);
    expect(model.metrics.pendingOnboarding.value).toBe(4);
  });

  it('no contradictions introduced by this ruling', () => {
    expect(model.agents.reduce((s, a) => s + a.contradictions.length, 0)).toBe(0);
  });

  it('no active assignments (the research directive is not active)', () => {
    expect(model.metrics.activeAssignments.value).toBe(0);
  });
});
