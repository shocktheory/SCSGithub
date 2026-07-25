import { ShieldCheck } from 'lucide-react';
import { useCollection } from '../../lib/data';
import { PageHeader, Card, AICoordinationRow } from '../../design-system/components';
import type { AICollaborator, Assignment } from '../../domain/entities';

/**
 * AI Work — the full participant roster and role descriptions (relocated from
 * SCS Home, which shows only active work). Coordination-first, not a description
 * list. AI recommends; it never approves.
 */
export function AIWorkPage() {
  const ai = useCollection<AICollaborator>('aiCollaborators');
  const assignments = useCollection<Assignment>('assignments');

  return (
    <div>
      <PageHeader
        eyebrow="Agent & authority register"
        title="AI Work"
        subtitle="The governed agent register. Every agent's assignment, deliverable, status, dependencies, risks, last constitutional synchronization, and authority scope."
      />
      <div className="scs-demo-banner" style={{ borderColor: 'var(--border)', background: 'rgba(65,143,255,0.06)', marginBottom: 20 }}>
        <ShieldCheck size={18} style={{ color: 'var(--color-soft-sky)', flex: 'none', marginTop: 1 }} />
        <div>
          <div className="scs-demo-banner__title" style={{ color: 'var(--text-primary)' }}>No agent may approve its own proposals</div>
          <div className="scs-demo-banner__body">
            <strong>Sonja</strong> is the Product Owner and final approval authority. <code>#</code> identifies an agent
            or governed role; names without <code>#</code> identify products, platforms, methodologies, or artifacts.
            Governing record: <a className="scs-section-link" href="#/decisions">DEC-0007 / DEC-0008</a>.
          </div>
        </div>
      </div>
      <Card>
        {(ai.data ?? []).map((c) => (
          <AICoordinationRow
            key={c.id}
            collaborator={c}
            assignment={(assignments.data ?? []).find((a) => a.collaborator === c.id)}
          />
        ))}
      </Card>
    </div>
  );
}
