import type { AICollaborator, Assignment, Decision, Product } from '../domain/entities';

/**
 * Team Command Center derivations. Operational + constitutional coordination —
 * NOT a personnel directory and NOT competitive performance scoring. Every agent
 * role and assignment must link to its governing directive; SCS flags missing links.
 */

export type AlignmentState = 'Aligned' | 'Warning' | 'Not synchronized';

export interface AgentCard {
  id: string;
  name: string;
  role: string;
  modelProvider?: string;
  standingResponsibility?: string;
  assignment?: string;
  deliverable?: string;
  status: string;
  waitingOn?: string;
  blocker?: string;
  alignment: AlignmentState;
  lastSync: string;
  affected?: string;
  gate?: string;
  roleDirectiveId?: string; // decision id
  assignmentDirectiveId?: string; // decision id
  reviewGate?: string;
  directiveCoverage: 'Full' | 'Partial' | 'None';
  missingLinks: string[];
  isDemonstration: boolean;
}

export interface TeamSignal { what: string; why: string; next: string }

export interface TeamMetric { key: string; label: string; value: number; ids: string[] }

export interface TeamModel {
  agents: AgentCard[];
  metrics: Record<string, TeamMetric>;
  overlaps: string[];
  signals: TeamSignal[];
  lastFullSync: string;
}

const isStale = (lastSync: string, syncState?: string) =>
  !lastSync || /not yet|never/i.test(syncState ?? '');

export function deriveTeam(input: {
  agents: AICollaborator[];
  assignments: Assignment[];
  decisions: Decision[];
  products: Product[];
  isSeed: boolean;
}): TeamModel {
  const { agents, assignments, decisions, products, isSeed } = input;
  const productName = (id?: string) => (id ? products.find((p) => p.id === id)?.name ?? id : undefined);
  const decExists = (id?: string) => Boolean(id && decisions.some((d) => d.id === id));

  const cards: AgentCard[] = agents.map((a) => {
    const assignment = assignments.find((x) => x.collaborator === a.id);
    const advising = /govern|advis|guardian/i.test(`${assignment?.waitingState ?? ''} ${a.role}`);
    const active = Boolean(assignment || a.currentTask);
    const stale = isStale(a.lastSynced ?? '', a.syncState);
    const alignment: AlignmentState = stale ? 'Not synchronized' : 'Aligned';
    const missing: string[] = [];
    if (!decExists(a.governingRecord)) missing.push('No approved role directive');
    if (assignment && !decExists(assignment.directive)) missing.push('Assignment has no governing directive');
    if (assignment && !assignment.expectedOutput) missing.push('Directive has no expected deliverable');
    if (assignment && assignment.expectedOutput && !assignment.reviewGate) missing.push('Deliverable has no review gate');
    if (stale) missing.push('Workstream is not synchronized');
    const coverage: AgentCard['directiveCoverage'] =
      missing.length === 0 ? 'Full' : decExists(a.governingRecord) ? 'Partial' : 'None';

    return {
      id: a.id, name: a.name, role: a.role, modelProvider: a.modelProvider,
      standingResponsibility: a.standingResponsibility,
      assignment: assignment?.task ?? a.currentTask,
      deliverable: assignment?.expectedOutput ?? a.expectedNextAction,
      status: !active ? 'Available' : advising ? 'Advising' : 'Working',
      waitingOn: active && !advising ? (assignment?.waitingState ?? a.waitingState) : undefined,
      blocker: a.conflictsDetected.length ? a.conflictsDetected.join('; ') : undefined,
      alignment,
      lastSync: a.lastSynced || 'Never',
      affected: productName(a.assignedProduct),
      gate: assignment?.reviewGate,
      roleDirectiveId: a.governingRecord,
      assignmentDirectiveId: assignment?.directive,
      reviewGate: assignment?.reviewGate,
      directiveCoverage: coverage,
      missingLinks: missing,
      isDemonstration: a.demonstration ?? isSeed,
    };
  });

  const activeCards = cards.filter((c) => c.assignment);
  const waitingPO = activeCards.filter((c) => /product owner|review/i.test(c.waitingOn ?? ''));
  const deliverablesAwaiting = activeCards.filter((c) => c.deliverable && /product owner|review/i.test(c.waitingOn ?? ''));
  const blocked = cards.filter((c) => c.blocker);
  const warnings = cards.filter((c) => c.alignment !== 'Aligned');
  const stale = cards.filter((c) => c.lastSync === 'Never' || c.alignment === 'Not synchronized');
  const directivesNoWork = cards.filter((c) => c.roleDirectiveId && !c.assignment);
  const workNoDirective = activeCards.filter((c) => !c.assignmentDirectiveId);

  const m = (key: string, label: string, list: AgentCard[]): TeamMetric => ({
    key, label, value: list.length, ids: list.map((c) => c.id),
  });

  const metrics: Record<string, TeamMetric> = {
    activeAgents: m('activeAgents', 'Active Agents', activeCards),
    activeAssignments: m('activeAssignments', 'Active Assignments', activeCards),
    waitingPO: m('waitingPO', 'Waiting on Product Owner', waitingPO),
    blocked: m('blocked', 'Blocked Work', blocked),
    warnings: m('warnings', 'Alignment Warnings', warnings),
    deliverables: m('deliverables', 'Deliverables Awaiting Review', deliverablesAwaiting),
    directivesNoWork: m('directivesNoWork', 'Directives Without Linked Work', directivesNoWork),
    workNoDirective: m('workNoDirective', 'Work Without an Approved Directive', workNoDirective),
    stale: m('stale', 'Stale Synchronizations', stale),
  };

  const overlaps: string[] = [];
  if (waitingPO.length && deliverablesAwaiting.length) {
    overlaps.push('“Waiting on Product Owner” and “Deliverables Awaiting Review” overlap — the same #SCS deliverable is counted in both.');
  }

  const signals: TeamSignal[] = [];
  const staleNames = stale.map((c) => c.name).join(', ');
  if (stale.length) signals.push({
    what: `${stale.length} agent workstream(s) are not synchronized (${staleNames})`,
    why: 'Unsynchronized agents can diverge from the current constitutional state.',
    next: 'Run a constitutional synchronization and record the governing reconciliation.',
  });
  if (directivesNoWork.length) signals.push({
    what: `${directivesNoWork.length} agents have an approved role directive but no active assignment`,
    why: 'Governed roles without work may indicate unstarted or unrecorded assignments.',
    next: 'Record a current assignment directive, or confirm the agent is intentionally idle.',
  });
  if (workNoDirective.length) signals.push({
    what: `${workNoDirective.length} active assignments have no approved governing directive`,
    why: 'Work without a governing directive is untraceable to Product Owner authority.',
    next: 'Link each assignment to an approved directive or decision record.',
  });

  return { agents: cards, metrics, overlaps, signals, lastFullSync: '2026-07-24' };
}
