import type {
  StandingDirective, AssignmentDirective, Deliverable, OperationalHistoryEntry, Gate,
  Team, TeamMembership,
} from '../domain/entities';

/**
 * Phase 2 constitutional objects, reconciled to the approved baseline.
 * Standing Directives carry canonical ST-SD-00X identifiers. Team and Team Membership
 * are first-class objects (TEAM-001, TEAM-002). Operational History activation events
 * are preserved independently. Nothing here originates constitutional authority.
 */

// ---- Standing Directives (canonical ST-SD-00X v1) ----
export const standingDirectives: StandingDirective[] = [
  { id: 'sdr-001', directiveId: 'ST-SD-001', agent: 'ai-sos', title: 'Constitutional guardianship', version: 'v1', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0007', text: 'Constitutional guardian, reconciliation, divergence detection, dependency analysis, and governance advice. Protects and advises Product Owner authority; does not exercise it.', supersededHistory: [], status: 'Current', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-002', directiveId: 'ST-SD-002', agent: 'ai-scs', title: 'SCS build authority', version: 'v1', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0007', text: 'SCS architecture, design, implementation, testing, repository delivery, and technical documentation. Is not SCS and holds no constitutional authority.', supersededHistory: [], status: 'Current', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-003', directiveId: 'ST-SD-003', agent: 'ai-ckl', title: 'Kidlytics advisory authority', version: 'v1', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0008', text: 'ChatGPT Kidlytics — advisory support, product architecture, specifications, challenge, review, and cross-artifact reconciliation. Does not replace Product Owner approval.', supersededHistory: [], status: 'Current', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-004', directiveId: 'ST-SD-004', agent: 'ai-ckp', title: 'Kidlytics prototype authority', version: 'v1', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0009', text: 'Claude Kidlytics Prototype — prototype design, implementation, testing, synchronization, and repository delivery. Does not replace Product Owner approval.', supersededHistory: [], status: 'Current', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-005', directiveId: 'ST-SD-005', agent: 'ai-cia', title: 'Kidlytics invitation authority', version: 'v1', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0008', text: 'Claude Kidlytics Invitation AI Agent — invitation-site evaluation, app evaluation, reviewer-perspective simulation, and feedback synthesis. May not change architecture, canonical language, or product decisions.', supersededHistory: [], status: 'Current', authorityStatus: 'approved', demonstration: false },
];

// ---- Assignment Directives (ST-ADR). The reconciliation directive's canonical
// identifier is Product-Owner-pending and is NOT originated by #SCS. ----
export const assignmentDirectives: AssignmentDirective[] = [
  {
    id: 'adr-001', directiveId: 'ST-ADR-2026-001', agent: 'ai-scs', title: 'Deliver the Team Command Center',
    status: 'Closed — accepted (Phase 1 Functional Demonstration Complete)',
    standingDirective: 'sdr-002', deliverable: 'dlv-001', reviewGate: 'rgate-001', productOwnerDecision: 'dec-0014',
    authorityStatus: 'approved', demonstration: false,
  },
  {
    id: 'adr-002', directiveId: 'ST-ADR-2026-002', agent: 'ai-scs', title: 'Implement Phase 2 — Constitutional Governance',
    status: 'Under Product Owner review',
    standingDirective: 'sdr-002', deliverable: 'dlv-002', reviewGate: 'rgate-002', productOwnerDecision: 'dec-0011',
    authorityStatus: 'reported', demonstration: false,
  },
  {
    id: 'adr-003', directiveId: 'ST-ADR-2026-003', agent: 'ai-sos', title: 'Constitutional review of Phase 2 implementation',
    status: 'Active',
    standingDirective: 'sdr-001', reviewGate: 'rgate-002', productOwnerDecision: 'dec-0007',
    authorityStatus: 'reported', demonstration: false,
  },
  {
    id: 'adr-004', directiveId: 'Pending Product Owner-authorized ST-ADR identifier', agent: 'ai-scs',
    title: 'Phase 2 Constitutional Reconciliation',
    status: 'Active',
    standingDirective: 'sdr-002', deliverable: 'dlv-003', reviewGate: 'rgate-003',
    authorityStatus: 'reported', demonstration: false,
    notes: 'Governed by the Product Owner Directive "Phase 2 Constitutional Reconciliation" (2026-07-24). Canonical Assignment Directive identifier is Product-Owner-authorized; #SCS does not originate it.',
  },
];

export const deliverables: Deliverable[] = [
  { id: 'dlv-001', deliverableId: 'ST-DLV-2026-001', title: 'Team Command Center (Phase 1 Functional Demonstration)', assignmentDirective: 'adr-001', reviewGate: 'rgate-001', status: 'Accepted', authorityStatus: 'approved', demonstration: false },
  { id: 'dlv-002', deliverableId: 'ST-DLV-2026-002', title: 'Phase 2 — Constitutional Governance Implementation', assignmentDirective: 'adr-002', reviewGate: 'rgate-002', status: 'Under review', authorityStatus: 'reported', demonstration: false },
  { id: 'dlv-003', deliverableId: 'ST-DLV-2026-003', title: 'Phase 2 Constitutional Reconciliation', assignmentDirective: 'adr-004', reviewGate: 'rgate-003', status: 'In review', authorityStatus: 'reported', demonstration: false },
];

export const reviewGates: Gate[] = [
  { id: 'rgate-001', name: 'Team Command Center review', requiresOwnerApproval: true, status: 'Approved', decisionRef: 'dec-0014', authorityStatus: 'approved', demonstration: false },
  { id: 'rgate-002', name: 'Phase 2 review', requiresOwnerApproval: true, status: 'Open', authorityStatus: 'proposed', demonstration: false },
  { id: 'rgate-003', name: 'Reconciliation review', requiresOwnerApproval: true, status: 'Open', authorityStatus: 'proposed', demonstration: false },
];

// ---- Operational History — activation events preserved independently ----
export const operationalHistory: OperationalHistoryEntry[] = [
  { id: 'oh-001', entryId: 'ST-OPH-2026-001', date: '2026-07-24', agent: 'ai-scs', summary: 'Team Command Center delivered and accepted as Phase 1 Functional Demonstration Complete.', evidenceType: 'Deliverable accepted', relatedObject: 'dlv-001', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-002', entryId: 'ST-OPH-2026-002', date: '2026-07-24', agent: 'ai-scs', summary: 'Phase 2 — Constitutional Governance Implementation submitted for Product Owner review.', evidenceType: 'Deliverable submitted', relatedObject: 'dlv-002', authorityStatus: 'reported', demonstration: false },
  { id: 'oh-003', entryId: 'ST-OPH-2026-003', date: '2026-07-24', agent: 'ai-sos', summary: 'Constitutional review of Phase 2 implementation in progress.', evidenceType: 'Governance review', relatedObject: 'adr-003', authorityStatus: 'reported', demonstration: false },
  // AGENT-005 — two distinct activation events, preserved independently.
  { id: 'oh-004', entryId: 'ST-OPH-2026-004', date: '2026-07-24', agent: 'ai-cia', summary: 'AGENT-005 (#CIA) Standing Directive ST-SD-005 v1 recorded Current.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-005', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-005', entryId: 'ST-OPH-2026-005', date: '2026-07-24', agent: 'ai-cia', summary: 'AGENT-005 (#CIA) TEAM-001 membership Active; Operational — Awaiting First Assignment.', evidenceType: 'Operational availability', relatedObject: 'tm-005', authorityStatus: 'approved', demonstration: false },
  // Activation events for the previously-governed agents.
  { id: 'oh-006', entryId: 'ST-OPH-2026-006', date: '2026-07-24', agent: 'ai-sos', summary: 'AGENT-001 (#SOS) Standing Directive ST-SD-001 v1 Current; TEAM-001 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-001', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-007', entryId: 'ST-OPH-2026-007', date: '2026-07-24', agent: 'ai-scs', summary: 'AGENT-002 (#SCS) Standing Directive ST-SD-002 v1 Current; TEAM-001 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-002', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-008', entryId: 'ST-OPH-2026-008', date: '2026-07-24', agent: 'ai-ckl', summary: 'AGENT-003 (#CKL) Standing Directive ST-SD-003 v1 Current; TEAM-001 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-003', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-009', entryId: 'ST-OPH-2026-009', date: '2026-07-24', agent: 'ai-ckp', summary: 'AGENT-004 (#CKP) Standing Directive ST-SD-004 v1 Current; TEAM-001 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-004', authorityStatus: 'approved', demonstration: false },
];

// ---- Team and Team Membership (first-class objects) ----
export const teams: Team[] = [
  { id: 'team-001', teamId: 'TEAM-001', name: 'ShockTheory Agent Team', status: 'Active', authorityStatus: 'approved', demonstration: false },
  { id: 'team-002', teamId: 'TEAM-002', name: 'TEAM-002', status: 'Active', authorityStatus: 'approved', demonstration: false, notes: 'Approved team; composition governed separately and not modified in this reconciliation.' },
];

export const teamMemberships: TeamMembership[] = [
  { id: 'tm-001', membershipId: 'TM-001', agent: 'ai-sos', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-002', membershipId: 'TM-002', agent: 'ai-scs', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-003', membershipId: 'TM-003', agent: 'ai-ckl', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-004', membershipId: 'TM-004', agent: 'ai-ckp', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-005', membershipId: 'TM-005', agent: 'ai-cia', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
];
