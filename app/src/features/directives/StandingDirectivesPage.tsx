import { Link } from 'react-router-dom';
import { useCollection, indexById } from '../../lib/data';
import { canonicalDecId } from '../../lib/derive';
import { PageHeader, Card, MetaGrid, StatusBadge, GovernanceBadge } from '../../design-system/components';
import type { StandingDirective, AICollaborator } from '../../domain/entities';

/**
 * Standing Directive Library (ST-DEC-2026-013). Each governed agent's durable role
 * authority — an independent constitutional object with its own version and history.
 */
export function StandingDirectivesPage() {
  const directives = useCollection<StandingDirective>('standingDirectives');
  const agents = indexById(useCollection<AICollaborator>('aiCollaborators').data);

  return (
    <div>
      <PageHeader
        eyebrow="Standing Directive Library · ST-DEC-2026-013"
        title="Standing Directives"
        subtitle="Durable role authority for each governed agent — current directive, version, governing authority, and superseded history. Distinct from Decision Records and Assignment Directives."
      />
      <div style={{ display: 'grid', gap: 16 }}>
        {(directives.data ?? []).map((d) => (
          <Card key={d.id}>
            <div className="scs-section-head">
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.directiveId} · {d.version}</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>
                  {agents.get(d.agent)?.name ?? d.agent} — {d.title}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge label={d.status} tone="approved" />
                {d.demonstration === false && <GovernanceBadge label="Governed record" />}
              </div>
            </div>
            <p style={{ margin: '4px 0 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{d.text}</p>
            <MetaGrid
              rows={[
                ['Agent', <Link key="a" className="scs-trace__link" to="/ai-work">{agents.get(d.agent)?.name ?? d.agent} ↗</Link>],
                ['Version', d.version],
                ['Governing authority', d.governingAuthority],
                ['Governing decision', d.governingDecision ? <Link key="d" className="scs-trace__link" to="/decisions">{canonicalDecId(d.governingDecision)} ↗</Link> : '—'],
                ['Superseded history', d.supersededHistory.length ? d.supersededHistory.join('; ') : 'None — current version'],
              ]}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
