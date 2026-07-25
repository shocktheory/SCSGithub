import { Link } from 'react-router-dom';
import { useCollection } from '../../lib/data';
import { canonicalDecId } from '../../lib/derive';
import { PageHeader, Card, MetaGrid, StatusBadge } from '../../design-system/components';
import type { Gate } from '../../domain/entities';

/** Review Gates (ST-DEC-2026-015) — independent objects governing what must be reviewed. */
export function ReviewGatesPage() {
  const gates = useCollection<Gate>('gates');
  const rows = (gates.data ?? []).filter((g) => g.requiresOwnerApproval);
  const tone = (s: string) => (/approv|passed/i.test(s) ? 'approved' : /open|await/i.test(s) ? 'review' : 'proposed');

  return (
    <div>
      <PageHeader
        eyebrow="Review Gates · ST-DEC-2026-015"
        title="Review Gates"
        subtitle="Independent constitutional objects. Each review gate identifies what requires Product Owner review and the decision it produces."
      />
      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((g) => (
          <Card key={g.id}>
            <div className="scs-section-head">
              <div style={{ fontSize: 16, fontWeight: 600 }}>{g.name}</div>
              <StatusBadge label={g.status} tone={tone(g.status)} />
            </div>
            <MetaGrid
              rows={[
                ['Requires Product Owner', g.requiresOwnerApproval ? 'Yes' : 'No'],
                ['Produces decision', g.decisionRef ? <Link key="d" className="scs-trace__link" to="/decisions">{canonicalDecId(g.decisionRef)} ↗</Link> : 'Pending'],
              ]}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
