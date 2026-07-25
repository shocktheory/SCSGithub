import { useCollection } from '../../lib/data';
import { canonicalDecId } from '../../lib/derive';
import { PageHeader, Card, MetaGrid, StatusBadge, GovernanceBadge, SectionTitle } from '../../design-system/components';
import type { Decision } from '../../domain/entities';

/**
 * Constitutional Decision Register — the authoritative interface for constitutional
 * decisions (ST-DEC-2026-012). Canonical ST-DEC-2026-### identifiers with preserved
 * historical traceability. The queue separates Product-Owner action from documentation.
 */
export function DecisionsPage() {
  const decisions = useCollection<Decision>('decisions');
  const rows = [...(decisions.data ?? [])].sort((a, b) => a.decisionId.localeCompare(b.decisionId));
  const ownerAction = rows.filter((d) => d.queue === 'owner-action');
  const documentation = rows.filter((d) => d.queue === 'documentation');

  return (
    <div>
      <PageHeader
        eyebrow="Authoritative interface · ST-DEC-2026-012"
        title="Constitutional Decision Register"
        subtitle="Governed Product Owner rulings under canonical ST-DEC-2026-### identifiers (historical interim IDs preserved). The queue separates decisions awaiting Product Owner action from historical decisions awaiting documentation completion."
      />

      <div className="scs-decisions__counts" style={{ marginBottom: 24 }}>
        <StatTileLike value={rows.length} label="Governed decisions" />
        <StatTileLike value={ownerAction.length} label="Awaiting Product Owner action" tone="review" />
        <StatTileLike value={documentation.length} label="Awaiting documentation completion" tone="muted" />
      </div>

      {[{ title: 'Awaiting Product Owner action', list: ownerAction }, { title: 'Awaiting documentation completion', list: documentation }].map(
        (grp) => grp.list.length > 0 && (
          <section key={grp.title} style={{ marginBottom: 28 }}>
            <SectionTitle>{grp.title}</SectionTitle>
            <div style={{ display: 'grid', gap: 16 }}>
              {grp.list.map((d) => (
                <Card key={d.id}>
                  <div className="scs-section-head">
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        {d.decisionId}{d.historicalId ? ` · historical ${d.historicalId}` : ''}
                      </div>
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
                      ['Dependencies', d.dependencies?.length ? d.dependencies.map((x) => canonicalDecId(x) ?? x).join(' · ') : '—'],
                      ['Superseded assumptions', d.supersededAssumptions ?? '—'],
                      ['Implementation consequences', d.implementationConsequences ?? '—'],
                      ['Related decisions', d.relatedDecisions?.length ? d.relatedDecisions.map((r) => canonicalDecId(r) ?? r).join(' · ') : '—'],
                      ['Source', d.sourceDirective ?? '—'],
                    ]}
                  />
                </Card>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

function StatTileLike({ value, label, tone }: { value: number; label: string; tone?: 'review' | 'muted' }) {
  return (
    <div className="scs-stat">
      <span className={`scs-stat__value${tone === 'review' ? ' scs-stat__value--review' : tone === 'muted' ? ' scs-stat__value--muted' : ''}`}>{value}</span>
      <span className="scs-stat__label">{label}</span>
    </div>
  );
}
