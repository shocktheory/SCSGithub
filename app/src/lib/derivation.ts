/**
 * Constitutional State Derivation Engine (reconciled to the approved baseline).
 *
 * Constitutional activation derives from the EXACT approved evidence set:
 *   Agent Identity · Current Standing Directive · Product Owner activation authority ·
 *   Operational History activation event · active Team Membership.
 * Absent evidence is reported honestly; activation is never manufactured.
 *
 * Governed assignment derives ONLY from approved Assignment Directives — never from
 * currentTask, implementation task fields, repository activity, or UI state.
 * See DERIVATION.md.
 */

export type Alignment = 'Aligned' | 'Warning' | 'Not applicable';
export type Coverage = 'Full' | 'Partial' | 'Not Active';

export interface DeriveInput {
  agentName: string;
  standingDirective?: { id: string; version: string; status: string };
  productOwnerAuthority?: { id: string; approved: boolean };
  activationEventIds: string[];
  teamMembership?: { label: string; active: boolean };
  activeAssignmentDirective?: {
    directiveId: string; title: string; status: string; deliverable?: string; reviewGate?: string;
  };
}

export interface DerivedAgentState {
  activated: boolean;
  missingEvidence: string[];
  status: string;
  standingDirectiveStatus: string;
  currentAssignment: string;
  assignmentDirectiveStatus: string;
  synchronization: string;
  currentGate: string;
  directiveCoverage: Coverage;
  operationalReadiness: string;
  teamMembership: string;
  alignment: Alignment;
  missingLinks: string[];
  trace: { sourceRecords: string[]; logic: string };
}

const NA_AWAITING = 'Not Applicable — Awaiting Assignment';

export function deriveAgentState(input: DeriveInput): DerivedAgentState {
  const { agentName, standingDirective, productOwnerAuthority, activationEventIds, teamMembership, activeAssignmentDirective } = input;

  // ---- Constitutional activation evidence set ----
  const evidence = {
    identity: Boolean(agentName),
    standingCurrent: Boolean(standingDirective && standingDirective.status.toLowerCase() === 'current'),
    poAuthority: Boolean(productOwnerAuthority && productOwnerAuthority.approved),
    activationEvent: activationEventIds.length > 0,
    teamActive: Boolean(teamMembership && teamMembership.active),
  };
  const missingEvidence: string[] = [];
  if (!evidence.identity) missingEvidence.push('Agent Identity');
  if (!evidence.standingCurrent) missingEvidence.push('Current Standing Directive');
  if (!evidence.poAuthority) missingEvidence.push('Product Owner activation authority');
  if (!evidence.activationEvent) missingEvidence.push('Operational History activation event');
  if (!evidence.teamActive) missingEvidence.push('active Team Membership');
  const activated = missingEvidence.length === 0;

  const hasADR = Boolean(activeAssignmentDirective);
  const sdStatus = standingDirective
    ? `${standingDirective.id} ${standingDirective.version} — ${standingDirective.status}`
    : 'None on record';
  const teamMembershipDisplay = teamMembership?.label ?? 'Not recorded';

  const sourceRecords = [
    standingDirective ? `${standingDirective.id} ${standingDirective.version} — ${standingDirective.status}` : 'No Standing Directive',
    productOwnerAuthority ? `Product Owner authority: ${productOwnerAuthority.id}` : 'No Product Owner authority',
    ...activationEventIds.map((e) => `${e} (Operational History)`),
    teamMembership ? `Team membership: ${teamMembership.label}` : 'No Team Membership',
    activeAssignmentDirective ? `${activeAssignmentDirective.directiveId} — ${activeAssignmentDirective.status}` : undefined,
  ].filter(Boolean) as string[];

  const missingLinks: string[] = [];
  let status: string, synchronization: string, currentGate: string, coverage: Coverage;
  let operationalReadiness: string, alignment: Alignment, assignmentDirectiveStatus: string, currentAssignment: string, logic: string;

  if (!activated) {
    status = 'Pending Onboarding';
    synchronization = 'Not Yet Applicable';
    currentGate = 'Constitutional Onboarding';
    coverage = 'Not Active';
    operationalReadiness = 'Onboarding — awaiting activation';
    alignment = 'Not applicable';
    assignmentDirectiveStatus = 'Not Applicable — Pending Onboarding';
    currentAssignment = 'None';
    logic = `Activation evidence incomplete (missing: ${missingEvidence.join(', ')}) ⇒ not constitutionally activated ⇒ Pending Onboarding. No warning is derived.`;
  } else if (!hasADR) {
    // Activated, no Assignment Directive: a valid constitutional chain through activation
    // and availability. Downstream links are Not Applicable — not a deficiency.
    status = 'Available';
    synchronization = 'Not Required';
    currentGate = 'Awaiting Assignment';
    coverage = 'Full';
    operationalReadiness = 'Operational — Awaiting First Assignment';
    alignment = 'Aligned';
    assignmentDirectiveStatus = NA_AWAITING;
    currentAssignment = 'None';
    logic = 'Full activation evidence set present ⇒ Operational. No Assignment Directive ⇒ Available; Assignment Directive and downstream records are Not Applicable — Awaiting Assignment (an expected absence, not a deficiency).';
  } else {
    const adr = activeAssignmentDirective!;
    const st = adr.status.toLowerCase();
    const isBlocked = /block/.test(st);
    const isWaiting = /wait/.test(st);
    status = isBlocked ? 'Blocked' : isWaiting ? 'Waiting on dependency' : 'Working';
    synchronization = 'Synchronized';
    currentGate = adr.reviewGate ?? 'In review';
    operationalReadiness = isBlocked ? 'Operational — Blocked' : 'Operational — Assigned';
    alignment = isBlocked ? 'Warning' : 'Aligned';
    assignmentDirectiveStatus = `${adr.directiveId} — ${adr.status}`;
    currentAssignment = adr.title;
    if (!adr.deliverable) missingLinks.push('Assignment Directive has no linked Deliverable');
    if (!adr.reviewGate) missingLinks.push('Assignment Directive has no Review Gate');
    coverage = missingLinks.length ? 'Partial' : 'Full';
    logic = `Full activation evidence set + an Assignment Directive (${adr.status}) ⇒ ${status}. Assignment status derives only from the Assignment Directive; gate from its Review Gate.`;
  }

  return {
    activated, missingEvidence, status, standingDirectiveStatus: sdStatus, currentAssignment,
    assignmentDirectiveStatus, synchronization, currentGate, directiveCoverage: coverage,
    operationalReadiness, teamMembership: teamMembershipDisplay, alignment, missingLinks,
    trace: { sourceRecords, logic },
  };
}
