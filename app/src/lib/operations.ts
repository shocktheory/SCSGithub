import type { Deliverable, Gate, AssignmentDirective } from '../domain/entities';

/**
 * Constitutional Operational Awareness (Phase 9) — PRESENTATION-ONLY derivation for the internal
 * Operational Dashboard. The server (`Scs\Operations`) is the canonical authority; this client model
 * presents that state and is strictly READ-ONLY: it never mutates constitutional state, never
 * approves, and never becomes authority (Constitutional Observability Principles).
 *
 * WORKFLOW STATE IS DISTINCT FROM CONSTITUTIONAL STATE. This model reports workflow progress; the
 * constitutional state of every record continues to derive from its governed records (Phase 7).
 * This is a coordination surface, NOT the Governance Dashboard (which explains governance health).
 */

export type WorkflowState =
  | 'waiting' | 'ready' | 'assigned' | 'in-progress' | 'awaiting-review'
  | 'awaiting-approval' | 'blocked' | 'completed' | 'accepted' | 'archived';

export interface OpsNotification {
  type: string;
  subject: string;
  recipients: string;
  relatedRecord: string;
  reason: string;
  attention: string;
}

export interface OperationsModel {
  notifications: OpsNotification[];
  attention: { byState: Record<string, number> };
  assignmentAwareness: {
    assigned: number; inProgress: number; blocked: number; waiting: number;
    completed: number; awaitingReview: number; accepted: number;
  };
  reviewQueues: { productOwner: { kind: string; id: string; label: string }[]; evidence: unknown[] };
  escalation: { related: string; reason: string; escalation: string }[];
  workflowStates: { kind: string; id: string; workflowState: WorkflowState }[];
  readOnly: true;
}

const m = (s: string | undefined, re: RegExp) => re.test(s ?? '');

export function deliverableWorkflowState(d: Deliverable): WorkflowState {
  if (m(d.status, /accepted/i)) return 'accepted';
  if (m(d.status, /in review|proposed|pending/i)) return 'awaiting-review';
  if (m(d.status, /block/i)) return 'blocked';
  return 'in-progress';
}
export function directiveWorkflowState(a: AssignmentDirective): WorkflowState {
  if (m(a.status, /closed/i)) return 'completed';
  if (m(a.status, /block/i)) return 'blocked';
  if (m(a.status, /wait/i)) return 'waiting';
  if (m(a.status, /active/i)) return 'in-progress';
  return 'assigned';
}
export function gateWorkflowState(g: Gate): WorkflowState {
  return m(g.status, /closed|approved/i) ? 'completed' : 'awaiting-approval';
}

export function deriveOperations(input: {
  deliverables?: Deliverable[];
  gates?: Gate[];
  assignmentDirectives?: AssignmentDirective[];
}): OperationsModel {
  const { deliverables = [], gates = [], assignmentDirectives = [] } = input;

  const notifications: OpsNotification[] = [];
  const escalation: OperationsModel['escalation'] = [];
  const attentionByState: Record<string, number> = {};
  const workflowStates: OperationsModel['workflowStates'] = [];
  const bump = (a: string) => { attentionByState[a] = (attentionByState[a] ?? 0) + 1; };

  for (const d of deliverables) {
    const ws = deliverableWorkflowState(d);
    workflowStates.push({ kind: 'deliverable', id: d.id, workflowState: ws });
    if (ws === 'awaiting-review') {
      notifications.push({ type: 'review-request', subject: `Deliverable ${d.deliverableId} awaiting review`, recipients: 'product_owner', relatedRecord: `deliverables/${d.id}`, reason: 'deliverable is in review', attention: 'attention-required' });
      bump('attention-required');
      escalation.push({ related: `deliverables/${d.id}`, reason: 'awaiting Product Owner review', escalation: 'reminder' });
    } else if (ws === 'blocked') { bump('blocker'); escalation.push({ related: `deliverables/${d.id}`, reason: 'deliverable blocked', escalation: 'blocker' }); }
  }
  for (const g of gates) {
    const ws = gateWorkflowState(g);
    workflowStates.push({ kind: 'gate', id: g.id, workflowState: ws });
    if (ws === 'awaiting-approval') {
      notifications.push({ type: 'approval', subject: `${g.name} awaiting Product Owner approval`, recipients: 'product_owner', relatedRecord: `gates/${g.id}`, reason: 'review gate is open', attention: 'attention-required' });
      bump('attention-required');
    }
  }
  for (const a of assignmentDirectives) {
    const ws = directiveWorkflowState(a);
    workflowStates.push({ kind: 'directive', id: a.id, workflowState: ws });
    const agent = a.agent ?? 'unassigned';
    if (ws === 'in-progress') notifications.push({ type: 'assignment', subject: `Assignment ${a.directiveId} in progress`, recipients: agent, relatedRecord: `assignmentDirectives/${a.id}`, reason: 'active assignment', attention: 'informational' });
    else if (ws === 'blocked') { notifications.push({ type: 'blocker', subject: `Assignment ${a.directiveId} blocked`, recipients: agent, relatedRecord: `assignmentDirectives/${a.id}`, reason: 'assignment blocked', attention: 'blocker' }); bump('blocker'); escalation.push({ related: `assignmentDirectives/${a.id}`, reason: 'assignment blocked', escalation: 'blocker' }); }
  }

  const dirStates = assignmentDirectives.map(directiveWorkflowState);
  const dlvStates = deliverables.map(deliverableWorkflowState);
  const count = (arr: WorkflowState[], s: WorkflowState) => arr.filter((x) => x === s).length;

  return {
    notifications,
    attention: { byState: attentionByState },
    assignmentAwareness: {
      assigned: count(dirStates, 'assigned'),
      inProgress: count(dirStates, 'in-progress'),
      blocked: count(dirStates, 'blocked') + count(dlvStates, 'blocked'),
      waiting: count(dirStates, 'waiting'),
      completed: count(dirStates, 'completed'),
      awaitingReview: count(dlvStates, 'awaiting-review'),
      accepted: count(dlvStates, 'accepted'),
    },
    reviewQueues: {
      productOwner: [
        ...gates.filter((g) => gateWorkflowState(g) === 'awaiting-approval').map((g) => ({ kind: 'gate', id: g.id, label: g.name })),
        ...deliverables.filter((d) => deliverableWorkflowState(d) === 'awaiting-review').map((d) => ({ kind: 'deliverable', id: d.id, label: d.deliverableId })),
      ],
      evidence: [],
    },
    escalation,
    workflowStates,
    readOnly: true,
  };
}
