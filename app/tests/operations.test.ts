import { describe, expect, it } from 'vitest';
import { deriveOperations, deliverableWorkflowState } from '../src/lib/operations';

/** Phase 9 — Operational Awareness (client presentation): derived, read-only; workflow≠constitutional. */
describe('deriveOperations — derived, read-only operational awareness', () => {
  it('derives notifications, queues, and workflow states from governed records', () => {
    const o = deriveOperations({
      deliverables: [{ id: 'd1', deliverableId: 'ST-DLV-A', status: 'In review' } as never],
      gates: [{ id: 'g1', name: 'Review', status: 'Open — pending Product Owner review' } as never],
      assignmentDirectives: [
        { id: 'a1', directiveId: 'ST-ADR-A', agent: 'ai-x', status: 'Active' } as never,
        { id: 'a2', directiveId: 'ST-ADR-B', agent: 'ai-y', status: 'Blocked on dependency' } as never,
      ],
    });
    expect(o.readOnly).toBe(true);
    const types = o.notifications.map((n) => n.type);
    expect(types).toContain('review-request');
    expect(types).toContain('approval');
    expect(types).toContain('blocker');
    expect(o.reviewQueues.productOwner.length).toBe(2); // open gate + in-review deliverable
    expect(o.assignmentAwareness.awaitingReview).toBe(1);
    expect(o.escalation.map((e) => e.related)).toContain('assignmentDirectives/a2');
    // Notifications carry no authority.
    for (const n of o.notifications) expect(n).not.toHaveProperty('authorityStatus');
  });

  it('workflow state is distinct from constitutional state', () => {
    // A deliverable in review has workflow state "awaiting-review" — a workflow concept, not authority.
    expect(deliverableWorkflowState({ id: 'd', deliverableId: 'x', status: 'In review' } as never)).toBe('awaiting-review');
    expect(deliverableWorkflowState({ id: 'd', deliverableId: 'x', status: 'Accepted' } as never)).toBe('accepted');
  });

  it('is empty-safe', () => {
    const o = deriveOperations({});
    expect(o.notifications).toEqual([]);
    expect(o.reviewQueues.productOwner).toEqual([]);
    expect(o.readOnly).toBe(true);
  });
});
