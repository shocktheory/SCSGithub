import { Link } from 'react-router-dom';
import { useCollection, indexById } from '../../lib/data';
import { PageHeader, Card, MetaGrid, StatusBadge } from '../../design-system/components';
import type { Deliverable, AssignmentDirective, Gate } from '../../domain/entities';

/** Deliverables (ST-DEC-2026-015) — independent objects, each with a review gate. */
export function DeliverablesPage() {
  const deliverables = useCollection<Deliverable>('deliverables');
  const adr = indexById(useCollection<AssignmentDirective>('assignmentDirectives').data);
  const gates = indexById(useCollection<Gate>('gates').data);
  const tone = (s: string) => (/accept|complete|approv/i.test(s) ? 'approved' : /review/i.test(s) ? 'review' : 'proposed');

  return (
    <div>
      <PageHeader
        eyebrow="Deliverables · ST-DEC-2026-015"
        title="Deliverables"
        subtitle="Independent constitutional objects. Each deliverable traces to its assignment directive and review gate."
      />
      <div style={{ display: 'grid', gap: 14 }}>
        {(deliverables.data ?? []).map((d) => (
          <Card key={d.id}>
            <div className="scs-section-head">
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.deliverableId}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{d.title}</div>
              </div>
              <StatusBadge label={d.status} tone={tone(d.status)} />
            </div>
            <MetaGrid
              rows={[
                ['Assignment directive', d.assignmentDirective ? <Link key="a" className="scs-trace__link" to="/assignment-directives">{adr.get(d.assignmentDirective)?.directiveId ?? d.assignmentDirective} ↗</Link> : '—'],
                ['Review gate', d.reviewGate ? <Link key="g" className="scs-trace__link" to="/review-gates">{gates.get(d.reviewGate)?.name ?? d.reviewGate} ↗</Link> : '—'],
              ]}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
