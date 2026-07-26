import { describe, expect, it } from 'vitest';
import { deriveGovernance } from '../src/lib/governance';

/** Phase 8 — Governance Visibility (client presentation): derived + read-only. */
describe('deriveGovernance — derived, read-only governance visibility', () => {
  it('summarizes review/approval queues and status counts', () => {
    const g = deriveGovernance({
      gates: [
        { id: 'g1', name: 'Phase 8 Review', status: 'Open — pending Product Owner review' } as never,
        { id: 'g2', name: 'Phase 7 Review', status: 'Closed — Approved' } as never,
      ],
      deliverables: [
        { id: 'd1', deliverableId: 'ST-DLV-A', status: 'In review' } as never,
        { id: 'd2', deliverableId: 'ST-DLV-B', status: 'Accepted' } as never,
      ],
      decisions: [{ id: 'dec1', status: 'Approved', authorityStatus: 'approved' } as never],
      assignmentDirectives: [
        { id: 'a1', status: 'Active' } as never,
        { id: 'a2', status: 'Closed' } as never,
      ],
      operationalHistory: [{ id: 'oh1' } as never],
    });

    expect(g.readOnly).toBe(true);
    expect(g.reviewQueue.open).toBe(1);
    expect(g.reviewQueue.closed).toBe(1);
    expect(g.reviewQueue.openGates).toEqual(['Phase 8 Review']);
    expect(g.approvalQueue.deliverablesInReview).toBe(1);
    expect(g.approvalQueue.items).toEqual(['ST-DLV-A']);
    expect(g.deliverables).toEqual({ total: 2, inReview: 1, accepted: 1 });
    expect(g.decisions).toEqual({ total: 1, approved: 1 });
    expect(g.directives).toEqual({ total: 2, active: 1, closed: 1 });
    expect(g.operationalHistory.entries).toBe(1);
    expect(g.constitutionalHealth.openReviewGates).toBe(1);
  });

  it('is empty-safe', () => {
    const g = deriveGovernance({});
    expect(g.reviewQueue.open).toBe(0);
    expect(g.approvalQueue.deliverablesInReview).toBe(0);
    expect(g.readOnly).toBe(true);
  });
});
