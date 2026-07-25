import type {
  StandingDirective, AssignmentDirective, Deliverable, OperationalHistoryEntry, Gate,
} from '../domain/entities';

/**
 * Phase 2 constitutional objects (governed, not demonstration where they record
 * real Product Owner actions). Standing Directives = durable role authority;
 * Assignment Directives = specific governed work; Deliverables and Review Gates =
 * independent objects; Operational History = evidence (never performance scoring).
 */

export const standingDirectives: StandingDirective[] = [
  { id: 'sdr-001', directiveId: 'ST-SDR-2026-001', agent: 'ai-sos', title: 'Constitutional guardianship', version: 'v1.0', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0007', text: 'Constitutional guardian, reconciliation, divergence detection, dependency analysis, and governance advice. Protects and advises Product Owner authority; does not exercise it.', supersededHistory: [], status: 'Active', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-002', directiveId: 'ST-SDR-2026-002', agent: 'ai-scs', title: 'SCS build authority', version: 'v1.0', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0007', text: 'SCS architecture, design, implementation, testing, repository delivery, and technical documentation. Is not SCS and holds no constitutional authority.', supersededHistory: [], status: 'Active', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-003', directiveId: 'ST-SDR-2026-003', agent: 'ai-ckl', title: 'Kidlytics advisory authority', version: 'v1.0', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0008', text: 'ChatGPT Kidlytics — advisory support, product architecture, specifications, challenge, review, and cross-artifact reconciliation. Does not replace Product Owner approval.', supersededHistory: [], status: 'Active', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-004', directiveId: 'ST-SDR-2026-004', agent: 'ai-ckp', title: 'Kidlytics prototype authority', version: 'v1.0', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0009', text: 'Claude Kidlytics Prototype — prototype design, implementation, testing, synchronization, and repository delivery. Does not replace Product Owner approval.', supersededHistory: [], status: 'Active', authorityStatus: 'approved', demonstration: false },
  { id: 'sdr-005', directiveId: 'ST-SDR-2026-005', agent: 'ai-cia', title: 'Kidlytics invitation authority', version: 'v1.0 (draft)', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-0008', text: 'Claude Kidlytics Invitation AI Agent — invitation-site evaluation, app evaluation, reviewer-perspective simulation, and feedback synthesis. May not change architecture, canonical language, or product decisions.', supersededHistory: [], status: 'Pending Product Owner-approved onboarding activation', authorityStatus: 'proposed', demonstration: false },
];

export const assignmentDirectives: AssignmentDirective[] = [
  {
    id: 'adr-001', directiveId: 'ST-ADR-2026-001', agent: 'ai-scs', title: 'Deliver the Team Command Center',
    status: 'Closed — accepted (Phase 1 Functional Demonstration Complete)',
    standingDirective: 'sdr-002', deliverable: 'dlv-001', reviewGate: 'rgate-001', productOwnerDecision: 'dec-0014',
    authorityStatus: 'approved', demonstration: false,
  },
  {
    id: 'adr-002', directiveId: 'ST-ADR-2026-002', agent: 'ai-scs', title: 'Implement Phase 2 — Constitutional Governance',
    status: 'Active — awaiting Product Owner review',
    standingDirective: 'sdr-002', deliverable: 'dlv-002', reviewGate: 'rgate-002', productOwnerDecision: 'dec-0011',
    authorityStatus: 'reported', demonstration: false,
  },
  {
    id: 'adr-003', directiveId: 'ST-ADR-2026-003', agent: 'ai-sos', title: 'Constitutional review of Phase 2 implementation',
    status: 'Active',
    standingDirective: 'sdr-001', reviewGate: 'rgate-002', productOwnerDecision: 'dec-0007',
    authorityStatus: 'reported', demonstration: false,
  },
];

export const deliverables: Deliverable[] = [
  { id: 'dlv-001', deliverableId: 'ST-DLV-2026-001', title: 'Team Command Center (Phase 1 Functional Demonstration)', assignmentDirective: 'adr-001', reviewGate: 'rgate-001', status: 'Accepted', authorityStatus: 'approved', demonstration: false },
  { id: 'dlv-002', deliverableId: 'ST-DLV-2026-002', title: 'Phase 2 — Constitutional Governance Implementation', assignmentDirective: 'adr-002', reviewGate: 'rgate-002', status: 'In review', authorityStatus: 'reported', demonstration: false },
];

// Review gates as independent objects (added to the gates collection).
export const reviewGates: Gate[] = [
  { id: 'rgate-001', name: 'Team Command Center review', requiresOwnerApproval: true, status: 'Approved', decisionRef: 'dec-0014', authorityStatus: 'approved', demonstration: false },
  { id: 'rgate-002', name: 'Phase 2 review', requiresOwnerApproval: true, status: 'Open', authorityStatus: 'proposed', demonstration: false },
];

export const operationalHistory: OperationalHistoryEntry[] = [
  { id: 'oh-001', entryId: 'ST-OPH-2026-001', date: '2026-07-24', agent: 'ai-scs', summary: 'Team Command Center delivered and accepted as Phase 1 Functional Demonstration Complete.', evidenceType: 'Deliverable accepted', relatedObject: 'dlv-001', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-002', entryId: 'ST-OPH-2026-002', date: '2026-07-24', agent: 'ai-scs', summary: 'Phase 2 — Constitutional Governance Implementation submitted for Product Owner review.', evidenceType: 'Deliverable submitted', relatedObject: 'dlv-002', authorityStatus: 'reported', demonstration: false },
  { id: 'oh-003', entryId: 'ST-OPH-2026-003', date: '2026-07-24', agent: 'ai-sos', summary: 'Constitutional review of Phase 2 implementation in progress.', evidenceType: 'Governance review', relatedObject: 'adr-003', authorityStatus: 'reported', demonstration: false },
];
