import type { AICollaborator, Assignment } from '../../domain/entities';
import { StatusBadge } from './Badges';

/**
 * AI coordination (not a participant list). Each collaborator is shown as work:
 * current assignment, expected deliverable, what they're waiting on, status,
 * dependencies, and risks — so coordination reads at a glance.
 */
export function AICoordinationRow({
  collaborator,
  assignment,
}: {
  collaborator: AICollaborator;
  assignment?: Assignment;
}) {
  const task = assignment?.task ?? collaborator.currentTask;
  const deliverable = assignment?.expectedOutput ?? collaborator.expectedNextAction;
  const waitingRaw = assignment?.waitingState ?? collaborator.waitingState;
  const risks = collaborator.conflictsDetected.length
    ? collaborator.conflictsDetected.join('; ')
    : 'None detected';
  const dependencies = collaborator.openQuestions.length ? collaborator.openQuestions.join('; ') : '—';

  // Status is a short state; "Waiting on" is the blocker. Advising collaborators
  // (e.g. #SOS) are not blocked on anything.
  const advising = /govern|advis|guardian/i.test(`${waitingRaw ?? ''} ${collaborator.role}`);
  const status: { label: string; tone: 'proposed' | 'verified' | 'neutral' } = !task
    ? { label: 'Available', tone: 'neutral' }
    : advising
      ? { label: 'Advising', tone: 'verified' }
      : { label: 'Working', tone: 'proposed' };
  const waitingOn = !task || advising ? '—' : (waitingRaw ?? '—');

  return (
    <div className="scs-coord">
      <div>
        <div className="scs-coord__name">{collaborator.name}</div>
        <div className="scs-coord__role">{collaborator.role}</div>
      </div>
      {task ? (
        <div className="scs-coord__fields">
          <Field k="Current assignment" v={task} />
          <Field k="Expected deliverable" v={deliverable ?? '—'} />
          <Field k="Waiting on" v={waitingOn} />
          <Field k="Status" v={<StatusBadge label={status.label} tone={status.tone} />} />
          <Field k="Dependencies" v={dependencies} />
          <Field k="Risks" v={risks} />
          <Field k="Last constitutional sync" v={collaborator.lastSynced ? collaborator.lastSynced : 'Never synchronized'} />
          <Field k="Authority scope" v={collaborator.authorityScope ?? 'Advisory — cannot approve'} />
        </div>
      ) : (
        <div className="scs-coord__fields">
          <Field k="Current assignment" v={<span style={{ color: 'var(--text-muted)' }}>No active assignment — available.</span>} />
          <Field k="Status" v={<StatusBadge label="Available" tone="neutral" />} />
          <Field k="Last constitutional sync" v={collaborator.lastSynced ? collaborator.lastSynced : 'Never synchronized'} />
          <Field k="Authority scope" v={collaborator.authorityScope ?? 'Advisory — cannot approve'} />
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="scs-coord__field-k">{k}</div>
      <div className="scs-coord__field-v">{v}</div>
    </div>
  );
}
