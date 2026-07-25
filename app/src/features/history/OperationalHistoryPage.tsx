import { useCollection, indexById } from '../../lib/data';
import { PageHeader, Card, StatusBadge } from '../../design-system/components';
import type { OperationalHistoryEntry, AICollaborator } from '../../domain/entities';
import '../snapshot/snapshot.css';

/**
 * Operational History (ST-DEC-2026-015) — evidence of what happened. Explicitly NOT
 * performance scoring or competitive ranking.
 */
export function OperationalHistoryPage() {
  const history = useCollection<OperationalHistoryEntry>('operationalHistory');
  const agents = indexById(useCollection<AICollaborator>('aiCollaborators').data);
  const rows = [...(history.data ?? [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div>
      <PageHeader
        eyebrow="Operational History · ST-DEC-2026-015"
        title="Operational History"
        subtitle="Constitutional evidence — deliverables, reviews, activations. Only Product-Owner-approved entries are authoritative; pending entries are shown distinctly and never satisfy activation. This is evidence, not performance scoring."
      />
      <Card>
        <div className="scs-activity">
          {rows.map((e) => {
            const approved = e.authorityStatus === 'approved';
            return (
              <div className="scs-activity__item" key={e.id} style={approved ? undefined : { opacity: 0.85 }}>
                <span className="scs-activity__code">{e.evidenceType}</span>
                <span className="scs-activity__summary">
                  {e.summary}
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {e.agent ? `${agents.get(e.agent)?.name ?? e.agent} · ` : ''}{e.entryId}
                  </span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge label={approved ? 'Approved' : 'Pending — not authoritative'} tone={approved ? 'approved' : 'review'} />
                  <span className="scs-activity__date">{e.date || 'undated'}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
