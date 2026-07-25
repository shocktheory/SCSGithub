import { useCollection } from '../../lib/data';
import { PageHeader, Card, MetaGrid, StatusBadge, GovernanceBadge } from '../../design-system/components';
import type { Decision } from '../../domain/entities';

/**
 * Decisions — the interim governed constitutional decision source (ST-LOCK).
 * These are REAL Product Owner rulings (not demonstration), version-controlled in
 * /constitution and mirrored here. The Phase 2 Decision Register ingests them.
 */
export function DecisionsPage() {
  const decisions = useCollection<Decision>('decisions');
  const rows = [...(decisions.data ?? [])].sort((a, b) => a.decisionId.localeCompare(b.decisionId));

  return (
    <div>
      <PageHeader
        eyebrow="Interim governed decision source"
        title="Decisions"
        subtitle="Real Product Owner rulings recorded under ST-LOCK, version-controlled in /constitution. The Phase 2 Decision Register will ingest these records unchanged. These are governed — not demonstration."
      />

      <div style={{ display: 'grid', gap: 16 }}>
        {rows.map((d) => (
          <Card key={d.id}>
            <div className="scs-section-head">
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{d.decisionId}</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{d.title}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge label={d.status} tone="approved" />
                {d.demonstration === false && <GovernanceBadge label="Governed record" />}
              </div>
            </div>
            <p style={{ margin: '4px 0 16px', fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>{d.ruling}</p>
            <MetaGrid
              rows={[
                ['Product Owner', d.approvingAuthority ?? '—'],
                ['Date', d.date ?? '—'],
                ['Rationale', d.rationale ?? '—'],
                ['Affected', d.affectedArtifacts.join(' · ') || '—'],
                ['Dependencies', d.dependencies?.length ? d.dependencies.join(' · ') : '—'],
                ['Superseded assumptions', d.supersededAssumptions ?? '—'],
                ['Implementation consequences', d.implementationConsequences ?? '—'],
                ['Related decisions', d.relatedDecisions?.length ? d.relatedDecisions.map((r) => r.replace('dec-', 'DEC-').toUpperCase()).join(' · ') : '—'],
                ['Source', d.sourceDirective ?? '—'],
              ]}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
