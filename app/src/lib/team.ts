import type {
  AICollaborator, Decision, Product, StandingDirective, AssignmentDirective,
  OperationalHistoryEntry, Team, TeamMembership, Deliverable, Gate,
} from '../domain/entities';
import { deriveAgentState, type DerivedAgentState } from './derivation';

/**
 * Team Command Center model. Operational state is DERIVED from governing records
 * via the Constitutional State Derivation Engine. Assignment derives only from
 * Assignment Directives; team membership from Team Membership records.
 */

export interface AgentCard extends DerivedAgentState {
  id: string;
  name: string;
  role: string;
  modelProvider?: string;
  standingResponsibility?: string;
  assigned: boolean;
  onboarding: boolean;
  deliverable?: string;
  waitingOn?: string;
  blocker?: string;
  affected?: string;
  roleDirectiveId?: string;
  assignmentDirectiveId?: string;
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
  decisions: Decision[];
  products: Product[];
  standingDirectives?: StandingDirective[];
  assignmentDirectives?: AssignmentDirective[];
  operationalHistory?: OperationalHistoryEntry[];
  teams?: Team[];
  teamMemberships?: TeamMembership[];
  deliverables?: Deliverable[];
  gates?: Gate[];
  isSeed: boolean;
}): TeamModel {
  const {
    agents, decisions, products, standingDirectives = [], assignmentDirectives = [],
    operationalHistory = [], teams = [], teamMemberships = [], deliverables = [], gates = [], isSeed,
  } = input;
  const productName = (id?: string) => (id ? products.find((p) => p.id === id)?.name ?? id : undefined);

  const cards: AgentCard[] = agents.map((a) => {
    const standing = standingDirectives.find((s) => s.agent === a.id);
    const governing = standing?.governingDecision ? decisions.find((d) => d.id === standing.governingDecision) : undefined;
    const activationEvents = operationalHistory.filter((h) => h.agent === a.id && /activation/i.test(h.evidenceType));
    // Only APPROVED activation events are valid evidence; pending ones are traced, not counted.
    const activationEventIds = activationEvents.filter((h) => h.authorityStatus === 'approved').map((h) => h.entryId);
    const pendingActivationEventIds = activationEvents.filter((h) => h.authorityStatus !== 'approved').map((h) => h.entryId);
    // Do NOT first-match: gather ALL active memberships and detect contradiction.
    const activeMemberships = teamMemberships.filter((tm) => tm.agent === a.id && /^active$/i.test(tm.status.trim()));
    const membershipConflict = activeMemberships.length > 1;
    const membership = activeMemberships.length === 1 ? activeMemberships[0] : undefined;
    const team = membership ? teams.find((t) => t.id === membership.team) : undefined;
    const conflictingMemberships = membershipConflict
      ? activeMemberships.map((tm) => `${tm.membershipId} → ${teams.find((t) => t.id === tm.team)?.teamId ?? tm.team}`)
      : [];
    // Current governing Assignment Directive: a non-closed directive, preferring an active one.
    const openADRs = assignmentDirectives.filter((d) => d.agent === a.id && !/closed/i.test(d.status));
    const activeADR = openADRs.find((d) => /active/i.test(d.status)) ?? openADRs[0];
    const adrDeliverable = activeADR?.deliverable ? deliverables.find((x) => x.id === activeADR.deliverable) : undefined;
    const adrGate = activeADR?.reviewGate ? gates.find((g) => g.id === activeADR.reviewGate) : undefined;

    const derived = deriveAgentState({
      agentName: a.name,
      standingDirective: standing ? { id: standing.directiveId, version: standing.version, status: standing.status } : undefined,
      productOwnerAuthority: governing ? { id: governing.decisionId, approved: governing.authorityStatus === 'approved' } : undefined,
      activationEventIds,
      pendingActivationEventIds,
      teamMembership: membership && team ? { label: `${team.teamId} — ${membership.status}`, active: /active/i.test(membership.status) } : undefined,
      membershipConflict,
      conflictingMemberships,
      activeAssignmentDirective: activeADR ? {
        directiveId: activeADR.directiveId, title: activeADR.title, status: activeADR.status,
        deliverable: adrDeliverable?.title, reviewGate: adrGate?.name,
      } : undefined,
    });

    const agentDeliverableInReview = deliverables.find((d) => d.assignmentDirective === activeADR?.id && /review/i.test(d.status));
    return {
      ...derived,
      id: a.id, name: a.name, role: a.role, modelProvider: a.modelProvider,
      standingResponsibility: a.standingResponsibility,
      assigned: Boolean(activeADR),
      onboarding: !derived.activated,
      deliverable: adrDeliverable?.title,
      waitingOn: agentDeliverableInReview ? 'Product Owner review' : undefined,
      blocker: a.conflictsDetected.length ? a.conflictsDetected.join('; ') : undefined,
      affected: productName(a.assignedProduct),
      roleDirectiveId: standing?.id,
      assignmentDirectiveId: activeADR?.id,
      isDemonstration: a.demonstration ?? isSeed,
    };
  });

  const activated = cards.filter((c) => c.activated);
  const assigned = cards.filter((c) => c.assigned);
  const waitingPO = cards.filter((c) => c.waitingOn);
  const deliverablesInReview = deliverables.filter((d) => /review/i.test(d.status));
  const blocked = cards.filter((c) => c.blocker || c.status === 'Blocked');
  const warnings = activated.filter((c) => c.alignment === 'Warning');
  const stale = activated.filter((c) => c.synchronization === 'Synchronization required');
  const directivesNoWork = activated.filter((c) => !c.assigned);
  const pendingOnboarding = cards.filter((c) => c.onboarding);

  const m = (key: string, label: string, ids: string[], value?: number): TeamMetric => ({
    key, label, value: value ?? ids.length, ids,
  });

  const metrics: Record<string, TeamMetric> = {
    activeAgents: m('activeAgents', 'Active Governed Agents', activated.map((c) => c.id)),
    activeAssignments: m('activeAssignments', 'Active Assignments', assigned.map((c) => c.id)),
    waitingPO: m('waitingPO', 'Waiting on Product Owner', waitingPO.map((c) => c.id)),
    deliverables: m('deliverables', 'Deliverables Awaiting Review', waitingPO.map((c) => c.id), deliverablesInReview.length),
    blocked: m('blocked', 'Blocked Work', blocked.map((c) => c.id)),
    warnings: m('warnings', 'Alignment Warnings', warnings.map((c) => c.id)),
    directivesNoWork: m('directivesNoWork', 'Available — Awaiting Assignment', directivesNoWork.map((c) => c.id)),
    pendingOnboarding: m('pendingOnboarding', 'Pending Activation', pendingOnboarding.map((c) => c.id)),
    stale: m('stale', 'Stale Synchronizations', stale.map((c) => c.id)),
  };

  const overlaps: string[] = [];
  if (waitingPO.length && deliverablesInReview.length) {
    overlaps.push(`The ${deliverablesInReview.length} deliverables awaiting review belong to the ${waitingPO.length} agent(s) counted under “Waiting on Product Owner.”`);
  }

  const signals: TeamSignal[] = [];
  const contradicted = cards.filter((c) => c.contradictions.length);
  if (contradicted.length) signals.push({
    what: `${contradicted.length} agent(s) have contradictory governing evidence (${contradicted.map((c) => c.name).join(', ')})`,
    why: 'Ambiguous governing evidence must not be silently resolved; it blocks a reliable derived state.',
    next: 'Resolve to a single approved record per governing dimension (Product Owner determination).',
  });
  if (stale.length) signals.push({
    what: `${stale.length} agent workstream(s) require synchronization (${stale.map((c) => c.name).join(', ')})`,
    why: 'Assigned workstreams must stay synchronized with the current constitutional state.',
    next: 'Record a synchronization event and its governing reconciliation.',
  });

  return { agents: cards, metrics, overlaps, signals, lastFullSync: '2026-07-24' };
}
