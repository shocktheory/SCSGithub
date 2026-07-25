import type { AICollaborator, Assignment } from '../../domain/entities';
import { StatusBadge } from './Badges';

/**
 * AI coordination (not a participant list). Each agent is shown as work:
 * assignment, deliverable, waiting-on, status, dependencies, risks, last
 * constitutional synchronization, and authority scope. AI recommends; it never
 * approves (governed agent register / ST-LOCK).
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
  const risks = collaborator.conflictsDetected.length ? collaborator.conflictsDetected.join('; ') : 'None detected';
  const dependencies = collaborator.openQuestions.length ? collaborator.openQuestions.join('; ') : '—';

  const advising = /govern|advis|guardian/i.test(`${waitingRaw ?? ''} ${collaborator.role}`);
  const status: { label: string; tone: 'proposed' | 'verified' | 'neutral' } = !task
    ? { label: 'Available', tone: 'neutral' }
    : advising
      ? { label: 'Advising', tone: 'verified' }
      : { label: 'Working', tone: 'proposed' };
  const waitingOn = !task || advising ? '—' : (waitingRaw ?? '—');
  const sync = collaborator.syncState
    ? `${collaborator.syncState}${collaborator.lastSynced ? ` · ${collaborator.lastSynced}` : ''}`
    : (collaborator.lastSynced || 'Never synchronized');

  return (
    <div className="scs-coord">
      <div>
        <div className="scs-coord__name">{collaborator.name}</div>
        {collaborator.modelProvider && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{collaborator.modelProvider}</div>
        )}
        <div className="scs-coord__role">{collaborator.role}</div>
        {collaborator.standingResponsibility && (
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            <span className="scs-coord__field-k" style={{ display: 'block' }}>Standing responsibility</span>
            {collaborator.standingResponsibility}
          </div>
        )}
      </div>
      <div className="scs-coord__fields">
        <Field k={collaborator.standingResponsibility ? 'Current assigned review' : 'Current assignment'} v={task ?? <span style={{ color: 'var(--text-muted)' }}>No active assignment — standing role only.</span>} />
        {task && <Field k="Expected deliverable" v={deliverable ?? '—'} />}
        {task && <Field k="Waiting on" v={waitingOn} />}
        <Field k="Status" v={<StatusBadge label={status.label} tone={status.tone} />} />
        {task && <Field k="Dependencies" v={dependencies} />}
        {task && <Field k="Risks" v={risks} />}
        <Field k="Last constitutional sync" v={sync} />
        <Field k="Authority scope" v={collaborator.authorityScope ?? 'Advisory — cannot approve'} />
      </div>
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
