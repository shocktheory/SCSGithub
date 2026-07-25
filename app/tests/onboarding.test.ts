import { describe, expect, it } from 'vitest';
import { deriveOnboarding } from '../src/lib/onboarding';
import { cklrCandidate } from '../src/seed/onboarding';
import { deriveTeam } from '../src/lib/team';
import { seedWorkspace } from '../src/seed';

describe('#CKL-R is activated AND assigned — derives as Working', () => {
  const m = deriveOnboarding(cklrCandidate);

  it('is activated with no missing evidence and no contradictions', () => {
    expect(m.activated).toBe(true);
    expect(m.current.missingEvidence).toEqual([]);
    expect(m.contradictions).toEqual([]);
  });

  it('derives as Working under the active Assignment Directive (not Available)', () => {
    expect(m.current.status).toBe('Working');
    expect(m.isAvailableAwaitingAssignment).toBe(false);
    expect(m.researchBlocked).toBe(false);
    expect(m.statusLabel).toMatch(/Working \(ST-ADR-2026-005\)/);
  });

  it('the current gate is the Competitive Research Review', () => {
    expect(m.current.currentGate).toBe('Competitive Research Review');
    expect(m.current.directiveCoverage).toBe('Full');
  });

  it('the assignment record is present-approved with ST-ADR-2026-005', () => {
    const item = m.checklist.find((i) => i.label === 'Competitive-research Assignment Directive')!;
    expect(item.status).toBe('present-approved');
    expect(cklrCandidate.assignmentDirective.status).toBe('Active');
    expect(cklrCandidate.assignmentDirective.ref.approvedId).toBe('ST-ADR-2026-005');
  });

  it('preserves proposal → approval provenance for the assignment', () => {
    const adr = m.provenance.find((p) => p.record === 'Research Assignment Directive')!;
    expect(adr.from).toBe('PROPOSED-ST-ADR-CKL-R');
    expect(adr.to).toBe('ST-ADR-2026-005');
  });
});

describe('The team now shows two activated agents, one of them Working', () => {
  const c = seedWorkspace.collections as unknown as Record<string, unknown[]>;
  const model = deriveTeam({
    agents: c.aiCollaborators as never, decisions: c.decisions as never, products: c.products as never,
    standingDirectives: c.standingDirectives as never, assignmentDirectives: c.assignmentDirectives as never,
    operationalHistory: c.operationalHistory as never, teams: c.teams as never, teamMemberships: c.teamMemberships as never,
    deliverables: c.deliverables as never, gates: c.gates as never, isSeed: true,
  });
  const byName = Object.fromEntries(model.agents.map((a) => [a.name, a]));

  it('exactly two agents are activated: #CIA and #CKL-R', () => {
    expect(model.agents.filter((a) => a.activated).map((a) => a.name).sort()).toEqual(['#CIA', '#CKL-R']);
    expect(model.metrics.activeAgents.value).toBe(2);
  });

  it('#CKL-R derives as Working under ST-ADR-2026-005', () => {
    expect(byName['#CKL-R'].status).toBe('Working');
    expect(byName['#CKL-R'].assigned).toBe(true);
    expect(byName['#CKL-R'].assignmentDirectiveStatus).toMatch(/ST-ADR-2026-005/);
  });

  it('#CKL-R (Working) is an active assignment; #CIA is the only Available — Awaiting Assignment', () => {
    // #CKL-R carries an active Assignment Directive. #SCS carries the Phase 5 assignment too
    // (valid independently of its Pending activation). #CIA is activated with no assignment.
    expect(model.metrics.activeAssignments.ids).toContain(byName['#CKL-R'].id);
    // Available — Awaiting Assignment = activated agents with no assignment = #CIA only
    // (#SCS is not activated, so it is never counted here regardless of its assignment).
    expect(model.metrics.directivesNoWork.value).toBe(1);
    expect(model.metrics.directivesNoWork.ids).toEqual([byName['#CIA'].id]);
  });

  it('the five existing agent states are unchanged', () => {
    expect(byName['#CIA'].status).toBe('Available');
    for (const n of ['#SOS', '#SCS', '#CKL', '#CKP']) expect(byName[n].activated).toBe(false);
    expect(model.metrics.pendingOnboarding.value).toBe(4);
  });

  it('no contradictions and no alignment warnings introduced', () => {
    expect(model.agents.reduce((s, a) => s + a.contradictions.length, 0)).toBe(0);
    expect(model.metrics.warnings.value).toBe(0);
  });
});

describe('ST-ADR-2026-004 remains reserved and untouched', () => {
  const adrs = (seedWorkspace.collections as unknown as { assignmentDirectives: Array<{ id: string; directiveId: string; status: string }> }).assignmentDirectives;

  it('ST-ADR-2026-005 is the only newly-authoritative ST-ADR; -004 stays a Product-Owner-pending placeholder', () => {
    const ids = adrs.map((a) => a.directiveId);
    expect(ids).toContain('ST-ADR-2026-005');
    expect(ids).not.toContain('ST-ADR-2026-004');
    const reconciliation = adrs.find((a) => a.id === 'adr-004')!;
    expect(reconciliation.directiveId).toMatch(/Pending Product Owner-authorized ST-ADR identifier/);
  });

  it('#CKL-R uses -005, not the reserved -004', () => {
    const cklr = adrs.find((a) => a.id === 'adr-005')!;
    expect(cklr.directiveId).toBe('ST-ADR-2026-005');
    expect(cklr.status).toBe('Active');
  });
});
