import { Link } from 'react-router-dom';
import { useCollection, indexById } from '../../lib/data';
import { canonicalDecId } from '../../lib/derive';
import { PageHeader, Card, MetaGrid, StatusBadge } from '../../design-system/components';
import type {
  AssignmentDirective, StandingDirective, Deliverable, Gate, AICollaborator,
} from '../../domain/entities';

/**
 * Assignment Directives (ST-DEC-2026-014). Each governs one assignment with its own
 * lifecycle, linking Standing Directive → Deliverable → Review Gate → Product Owner
 * Decision. Traceability is bidirectional across the constitutional chain.
 */
export function AssignmentDirectivesPage() {
  const directives = useCollection<AssignmentDirective>('assignmentDirectives');
  const agents = indexById(useCollection<AICollaborator>('aiCollaborators').data);
  const standing = indexById(useCollection<StandingDirective>('standingDirectives').data);
  const deliverables = indexById(useCollection<Deliverable>('deliverables').data);
  const gates = indexById(useCollection<Gate>('gates').data);

  const tone = (s: string) => (/closed|accepted|complete/i.test(s) ? 'approved' : /await|review/i.test(s) ? 'review' : 'proposed');

  return (
    <div>
      <PageHeader
        eyebrow="Assignment Directive management · ST-DEC-2026-014"
        title="Assignment Directives"
        subtitle="Governed assignments with their own lifecycle, each linked to a Standing Directive, Deliverable, Review Gate, and Product Owner Decision."
      />
      <div style={{ display: 'grid', gap: 16 }}>
        {(directives.data ?? []).map((d) => (
          <Card key={d.id}>
            <div className="scs-section-head">
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.directiveId}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                  {agents.get(d.agent)?.name ?? d.agent} — {d.title}
                </div>
              </div>
              <StatusBadge label={d.status} tone={tone(d.status)} />
            </div>
            <MetaGrid
              rows={[
                ['Agent', <Link key="a" className="scs-trace__link" to="/ai-work">{agents.get(d.agent)?.name ?? d.agent} ↗</Link>],
                ['Standing directive', d.standingDirective ? <Link key="s" className="scs-trace__link" to="/standing-directives">{standing.get(d.standingDirective)?.directiveId ?? d.standingDirective} ↗</Link> : '—'],
                ['Deliverable', d.deliverable ? <Link key="dl" className="scs-trace__link" to="/deliverables">{deliverables.get(d.deliverable)?.deliverableId ?? d.deliverable} ↗</Link> : '—'],
                ['Review gate', d.reviewGate ? <Link key="g" className="scs-trace__link" to="/review-gates">{gates.get(d.reviewGate)?.name ?? d.reviewGate} ↗</Link> : '—'],
                ['Product Owner decision', d.productOwnerDecision ? <Link key="pd" className="scs-trace__link" to="/decisions">{canonicalDecId(d.productOwnerDecision)} ↗</Link> : '—'],
              ]}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
