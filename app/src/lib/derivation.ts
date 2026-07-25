import type {
  AICollaborator, StandingDirective, Assignment, AssignmentDirective,
  OperationalHistoryEntry, Decision,
} from '../domain/entities';

/**
 * Constitutional State Derivation Engine.
 *
 * Operational status is the RESULT of approved constitutional records — never a
 * manually maintained value. Where a governing record is absent, the derived state
 * reflects that absence honestly (it never manufactures an activated state).
 *
 * Governing sources: Standing Directive · Assignment Directive · Operational History ·
 * Product Owner Decision · Team Membership. See DERIVATION.md for the full rule set.
 */

export type Alignment = 'Aligned' | 'Warning' | 'Not applicable';

export interface DerivedAgentState {
  activated: boolean;
  status: string;
  standingDirectiveStatus: string;
  currentAssignment: string;
  synchronization: string;
  currentGate: string;
  directiveCoverage: 'Full' | 'Partial' | 'Not Active';
  operationalReadiness: string;
  teamMembership: string;
  alignment: Alignment;
  missingLinks: string[];
  /** Source records → derivation logic → displayed state, for traceability. */
  trace: { sourceRecords: string[]; logic: string };
}

export interface DeriveInput {
  agent: AICollaborator;
  standing?: StandingDirective;
  assignment?: Assignment;
  assignmentDirective?: AssignmentDirective;
  opHistory: OperationalHistoryEntry[];
  activationDecision?: Decision;
}

export function deriveAgentState(input: DeriveInput): DerivedAgentState {
  const { agent, standing, assignment, assignmentDirective, opHistory, activationDecision } = input;

  // Activation is DERIVED: a Standing Directive is "Current" only after Product Owner
  // activation. This replaces the former hard-coded onboarding flag.
  const sdCurrent = (standing?.status ?? '').toLowerCase() === 'current';
  const activated = sdCurrent;

  const advising = /govern|advis|guardian/i.test(`${assignment?.waitingState ?? ''} ${agent.role}`);
  const hasAssignment = Boolean(assignment?.task ?? agent.currentTask);
  const activationEvents = opHistory.filter((h) => /activat|onboard/i.test(`${h.summary} ${h.evidenceType}`));

  const sourceRecords = [
    standing ? `${standing.directiveId} ${standing.version} — ${standing.status}` : 'No Standing Directive on record',
    ...activationEvents.map((h) => `${h.entryId} (${h.evidenceType})`),
    activationDecision ? `${activationDecision.decisionId} — ${activationDecision.title}` : undefined,
    agent.teamMembership ? `Team membership: ${agent.teamMembership}` : undefined,
    assignmentDirective ? `${assignmentDirective.directiveId} — ${assignmentDirective.status}` : undefined,
  ].filter(Boolean) as string[];

  const sdStatus = standing ? `${standing.directiveId} ${standing.version} — ${standing.status}` : 'None on record';
  const currentAssignment = assignment?.task ?? agent.currentTask ?? 'None';
  const teamMembership = agent.teamMembership ?? 'Not recorded';
  const missingLinks: string[] = [];

  let status: string, synchronization: string, currentGate: string;
  let directiveCoverage: DerivedAgentState['directiveCoverage'];
  let operationalReadiness: string, alignment: Alignment, logic: string;

  if (!activated) {
    // No active governed obligation → no divergence/stale/warning may be derived.
    status = 'Pending Onboarding';
    synchronization = 'Not Yet Applicable';
    currentGate = 'Constitutional Onboarding';
    directiveCoverage = 'Not Active';
    operationalReadiness = 'Onboarding — awaiting activation';
    alignment = 'Not applicable';
    logic = 'Standing Directive is not Current (or absent) ⇒ not yet constitutionally activated ⇒ Pending Onboarding. Synchronization Not Yet Applicable; no warning is derived.';
  } else if (!hasAssignment) {
    // An activated agent with no assignment is Available, regardless of role wording.
    status = 'Available';
    synchronization = 'Not Required';
    currentGate = 'Awaiting Assignment';
    directiveCoverage = 'Full';
    operationalReadiness = 'Operational — Awaiting First Assignment';
    alignment = 'Aligned';
    logic = 'Standing Directive Current + activation recorded ⇒ Operational. No Assignment Directive ⇒ Available, Awaiting Assignment, synchronization Not Required.';
  } else {
    status = advising ? 'Advising' : 'Working';
    const synced = /synchroniz|aligned/i.test(agent.syncState ?? '');
    synchronization = synced ? 'Synchronized' : 'Synchronization required';
    currentGate = assignment?.reviewGate ?? 'In progress';
    directiveCoverage = assignmentDirective ? 'Full' : 'Partial';
    operationalReadiness = 'Operational — Assigned';
    alignment = synced ? 'Aligned' : 'Warning';
    if (!assignmentDirective) missingLinks.push('Assignment has no governing Assignment Directive');
    if (!synced) missingLinks.push('Workstream is not synchronized');
    logic = 'Standing Directive Current + active Assignment ⇒ Working. Synchronization evaluated against the assignment; gate = review gate; coverage Full when an Assignment Directive governs the work.';
  }

  return {
    activated, status, standingDirectiveStatus: sdStatus, currentAssignment, synchronization,
    currentGate, directiveCoverage, operationalReadiness, teamMembership, alignment, missingLinks,
    trace: { sourceRecords, logic },
  };
}
