import type {
  AICollaborator, Assignment, Decision, Product, StandingDirective, AssignmentDirective,
  OperationalHistoryEntry,
} from '../domain/entities';
import { deriveAgentState, type DerivedAgentState } from './derivation';

/**
 * Team Command Center model. Operational state is DERIVED from governing records
 * via the Constitutional State Derivation Engine — not manually maintained.
 * Not a personnel directory and not competitive scoring.
 */

export interface AgentCard extends DerivedAgentState {
  id: string;
  name: string;
  role: string;
  modelProvider?: string;
  standingResponsibility?: string;
  assigned: boolean;
  deliverable?: string;
  waitingOn?: string;
  blocker?: string;
  affected?: string;
  roleDirectiveId?: string; // standing directive id (link)
  assignmentDirectiveId?: string; // assignment directive id (link)
  onboarding: boolean; // = !activated
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

export function deriveTeam(input: {
  agents: AICollaborator[];
  assignments: Assignment[];
  decisions: Decision[];
  products: Product[];
  standingDirectives?: StandingDirective[];
  assignmentDirectives?: AssignmentDirective[];
  operationalHistory?: OperationalHistoryEntry[];
  isSeed: boolean;
}): TeamModel {
  const {
    agents, assignments, decisions, products,
    standingDirectives = [], assignmentDirectives = [], operationalHistory = [], isSeed,
  } = input;
  const productName = (id?: string) => (id ? products.find((p) => p.id === id)?.name ?? id : undefined);

  const cards: AgentCard[] = agents.map((a) => {
    const assignment = assignments.find((x) => x.collaborator === a.id);
    const standing = standingDirectives.find((s) => s.agent === a.id);
    const assignmentDirective = assignment?.directive
      ? assignmentDirectives.find((d) => d.id === assignment.directive)
      : assignmentDirectives.find((d) => d.agent === a.id && /active/i.test(d.status));
    const opHistory = operationalHistory.filter((h) => h.agent === a.id);
    // A Product Owner decision that constitutionally activates this agent.
    const activationDecision = decisions.find(
      (d) => /activation|onboard/i.test(d.title) && d.affectedArtifacts.some((x) => x === a.name),
    );

    const derived = deriveAgentState({ agent: a, standing, assignment, assignmentDirective, opHistory, activationDecision });

    return {
      ...derived,
      id: a.id, name: a.name, role: a.role, modelProvider: a.modelProvider,
      standingResponsibility: a.standingResponsibility,
      assigned: Boolean(assignment),
      deliverable: assignment?.expectedOutput ?? a.expectedNextAction,
      waitingOn: derived.status === 'Working' ? (assignment?.waitingState ?? a.waitingState) : undefined,
      blocker: a.conflictsDetected.length ? a.conflictsDetected.join('; ') : undefined,
      affected: productName(a.assignedProduct),
      roleDirectiveId: standing?.id,
      assignmentDirectiveId: assignmentDirective?.id,
      onboarding: !derived.activated,
      isDemonstration: a.demonstration ?? isSeed,
    };
  });

  const activated = cards.filter((c) => c.activated);
  const assigned = cards.filter((c) => c.assigned);
  const waitingPO = assigned.filter((c) => /product owner|review/i.test(c.waitingOn ?? ''));
  const deliverablesAwaiting = assigned.filter((c) => c.deliverable && /product owner|review/i.test(c.waitingOn ?? ''));
  const blocked = cards.filter((c) => c.blocker);
  const warnings = activated.filter((c) => c.alignment === 'Warning');
  const stale = activated.filter((c) => c.synchronization === 'Synchronization required');
  const directivesNoWork = activated.filter((c) => !c.assigned);
  const workNoDirective = assigned.filter((c) => !c.assignmentDirectiveId);

  const m = (key: string, label: string, list: AgentCard[]): TeamMetric => ({
    key, label, value: list.length, ids: list.map((c) => c.id),
  });

  const metrics: Record<string, TeamMetric> = {
    activeAgents: m('activeAgents', 'Active Governed Agents', activated),
    activeAssignments: m('activeAssignments', 'Active Assignments', assigned),
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
  if (stale.length) signals.push({
    what: `${stale.length} agent workstream(s) require synchronization (${stale.map((c) => c.name).join(', ')})`,
    why: 'Assigned workstreams must stay synchronized with the current constitutional state.',
    next: 'Record a synchronization event and its governing reconciliation.',
  });
  if (workNoDirective.length) signals.push({
    what: `${workNoDirective.length} active assignments have no governing Assignment Directive`,
    why: 'Work without a governing directive is untraceable to Product Owner authority.',
    next: 'Link each assignment to an approved Assignment Directive.',
  });

  return { agents: cards, metrics, overlaps, signals, lastFullSync: '2026-07-24' };
}
