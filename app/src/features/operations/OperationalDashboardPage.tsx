import { useCollection } from '../../lib/data';
import { PageHeader, Card, StatTile, StatusBadge, SectionTitle, EmptyState } from '../../design-system/components';
import { deriveOperations } from '../../lib/operations';
import type { Deliverable, Gate, AssignmentDirective } from '../../domain/entities';
import '../snapshot/snapshot.css';

/**
 * Operational Dashboard (Phase 9) — the internal operational coordination workspace.
 *
 * Constitutional Observability + Operational awareness: this surface is DERIVED and READ-ONLY. It
 * coordinates governed work (notifications, attention, queues, escalation, workflow progress) and
 * NEVER modifies constitutional state, never approves, and never becomes authority. It is SEPARATE
 * from the Governance Dashboard: the Governance Dashboard explains constitutional governance; this
 * one coordinates operational execution. Workflow state is distinct from constitutional state.
 */
export function OperationalDashboardPage() {
  const deliverables = useCollection<Deliverable>('deliverables');
  const gates = useCollection<Gate>('gates');
  const assignmentDirectives = useCollection<AssignmentDirective>('assignmentDirectives');

  const o = deriveOperations({
    deliverables: deliverables.data,
    gates: gates.data,
    assignmentDirectives: assignmentDirectives.data,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Phase 9 · Constitutional Operational Awareness"
        title="Operational Dashboard"
        subtitle="A derived, read-only view that coordinates governed work — notifications, attention, review queues, escalation, and workflow progress. Operational awareness informs action; it never approves work or changes constitutional state. Distinct from the Governance Dashboard, and workflow state is separate from constitutional state."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatTile value={o.assignmentAwareness.awaitingReview} label="Awaiting review" tone={o.assignmentAwareness.awaitingReview ? 'review' : 'muted'} />
        <StatTile value={o.reviewQueues.productOwner.length} label="Product Owner queue" tone={o.reviewQueues.productOwner.length ? 'review' : 'muted'} />
        <StatTile value={o.assignmentAwareness.inProgress} label="Assignments in progress" />
        <StatTile value={o.assignmentAwareness.blocked} label="Blocked work" tone={o.assignmentAwareness.blocked ? 'review' : 'muted'} />
        <StatTile value={o.assignmentAwareness.completed} label="Completed" tone="accent" />
        <StatTile value={o.escalation.length} label="Escalations" tone={o.escalation.length ? 'review' : 'muted'} />
      </div>

      <Card>
        <SectionTitle>Notifications (derived · never authoritative)</SectionTitle>
        {o.notifications.length ? (
          <div className="scs-activity">
            {o.notifications.map((n) => (
              <div className="scs-activity__item" key={`${n.type}-${n.relatedRecord}`}>
                <span className="scs-activity__code">{n.type}</span>
                <span className="scs-activity__summary">
                  {n.subject}
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    → {n.recipients} · {n.reason}
                  </span>
                </span>
                <StatusBadge label={n.attention} tone={n.attention === 'blocker' ? 'risk' : n.attention === 'attention-required' ? 'review' : 'neutral'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No notifications">No governed work currently needs attention.</EmptyState>
        )}
      </Card>

      <div style={{ height: 12 }} />

      <Card>
        <SectionTitle>Product Owner review queue (organizes work · never approves)</SectionTitle>
        {o.reviewQueues.productOwner.length ? (
          <div className="scs-activity">
            {o.reviewQueues.productOwner.map((q) => (
              <div className="scs-activity__item" key={`${q.kind}-${q.id}`}>
                <span className="scs-activity__code">{q.kind}</span>
                <span className="scs-activity__summary">{q.label || q.id}</span>
                <StatusBadge label="Awaiting Product Owner" tone="review" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Queue empty">Nothing is awaiting Product Owner action.</EmptyState>
        )}
      </Card>

      <div style={{ height: 12 }} />

      <Card>
        <SectionTitle>Escalation (increases visibility · never bypasses approval)</SectionTitle>
        {o.escalation.length ? (
          <div className="scs-activity">
            {o.escalation.map((e) => (
              <div className="scs-activity__item" key={`${e.escalation}-${e.related}`}>
                <span className="scs-activity__code">{e.escalation}</span>
                <span className="scs-activity__summary">{e.related} · {e.reason}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No escalations">No blocked or overdue work requires escalation.</EmptyState>
        )}
      </Card>
    </div>
  );
}
