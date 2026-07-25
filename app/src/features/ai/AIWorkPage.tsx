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
        eyebrow="Coordination"
        title="AI Work"
        subtitle="Every collaborator's current assignment, expected deliverable, status, dependencies, risks, last constitutional synchronization, and authority scope. AI participants recommend; they never approve."
      />
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
