import { useCollection } from '../../lib/data';
import { PageHeader, Card, StatTile, StatusBadge, SectionTitle, EmptyState } from '../../design-system/components';
import { deriveGovernance } from '../../lib/governance';
import type { Deliverable, Gate, Decision, AssignmentDirective, OperationalHistoryEntry } from '../../domain/entities';
import '../snapshot/snapshot.css';

/**
 * Governance Dashboard (Phase 8) — the internal constitutional governance workspace.
 *
 * Constitutional Observability Principles: this surface is DERIVED and READ-ONLY. It presents
 * governance status — review/approval queues, constitutional health — and never mutates
 * constitutional state. It is NOT a production monitoring console.
 */
export function GovernanceDashboardPage() {
  const gates = useCollection<Gate>('gates');
  const deliverables = useCollection<Deliverable>('deliverables');
  const decisions = useCollection<Decision>('decisions');
  const assignmentDirectives = useCollection<AssignmentDirective>('assignmentDirectives');
  const operationalHistory = useCollection<OperationalHistoryEntry>('operationalHistory');

  const g = deriveGovernance({
    gates: gates.data,
    deliverables: deliverables.data,
    decisions: decisions.data,
    assignmentDirectives: assignmentDirectives.data,
    operationalHistory: operationalHistory.data,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Phase 8 · Constitutional Observability"
        title="Governance Dashboard"
        subtitle="A derived, read-only view of governance state — review and approval queues, decision and directive status, constitutional health. Observation only: this workspace never changes constitutional state, and is not a production monitoring console."
      />

      <div className="scs-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatTile value={g.reviewQueue.open} label="Open review gates" tone={g.reviewQueue.open ? 'review' : 'muted'} />
        <StatTile value={g.approvalQueue.deliverablesInReview} label="Deliverables awaiting approval" tone={g.approvalQueue.deliverablesInReview ? 'review' : 'muted'} />
        <StatTile value={g.deliverables.accepted} label="Deliverables accepted" tone="accent" />
        <StatTile value={g.decisions.approved} label="Decisions approved" />
        <StatTile value={g.directives.active} label="Assignments active" />
        <StatTile value={g.operationalHistory.entries} label="Operational History entries" tone="muted" />
      </div>

      <Card>
        <SectionTitle>Constitutional health</SectionTitle>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <StatusBadge
            label={g.constitutionalHealth.healthy ? 'Healthy — no contradictions surfaced' : 'Attention — contradictions present'}
            tone={g.constitutionalHealth.healthy ? 'approved' : 'risk'}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {g.constitutionalHealth.openReviewGates} open gate(s) · {g.constitutionalHealth.pendingApprovals} pending approval(s)
          </span>
        </div>
      </Card>

      <div style={{ height: 12 }} />

      <Card>
        <SectionTitle>Review queue</SectionTitle>
        {g.reviewQueue.openGates.length ? (
          <div className="scs-activity">
            {g.reviewQueue.openGates.map((name) => (
              <div className="scs-activity__item" key={name}>
                <span className="scs-activity__summary">{name}</span>
                <StatusBadge label="Open" tone="review" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No open review gates">Every review gate is closed or approved.</EmptyState>
        )}
      </Card>

      <div style={{ height: 12 }} />

      <Card>
        <SectionTitle>Approval queue</SectionTitle>
        {g.approvalQueue.items.length ? (
          <div className="scs-activity">
            {g.approvalQueue.items.map((id) => (
              <div className="scs-activity__item" key={id}>
                <span className="scs-activity__summary">{id}</span>
                <StatusBadge label="Awaiting Product Owner" tone="review" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No deliverables awaiting approval">Nothing is currently queued for Product Owner disposition.</EmptyState>
        )}
      </Card>
    </div>
  );
}
