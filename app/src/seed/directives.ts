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
  // AGENT-006/#CKL-R — approved and Current by the Product Owner ruling (2026-07-25).
  { id: 'sdr-006', directiveId: 'ST-SD-006', agent: 'ai-cklr', title: 'Kidlytics competitive research authority', version: 'v1', governingAuthority: 'Sonja (Product Owner)', governingDecision: 'dec-cklr-activation', text: 'Kidlytics Competitive Research Agent — evidence-based competitive and market research supporting Kidlytics, performed ONLY when authorized through an approved Assignment Directive: identify direct and adjacent competitors; examine market positioning; compare capabilities and pricing; evaluate trust/safety, AI, financial, and court-related/child-support/co-parenting positioning; identify gaps and strategic opportunities; collect and cite verifiable evidence; distinguish verified fact, inference, open question, and recommendation; prepare findings for Product Owner review. Advisory only — holds no product-decision or approval authority and may not begin research without an approved Assignment Directive.', supersededHistory: ['Reconciled from proposed PROPOSED-ST-SD-CKL-R upon Product Owner approval (2026-07-25).'], status: 'Current', authorityStatus: 'approved', demonstration: false },
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
    status: 'Closed — accepted (reconciled baseline, Product Owner acceptance of commit a773bd6)',
    standingDirective: 'sdr-002', deliverable: 'dlv-002', reviewGate: 'rgate-002', productOwnerDecision: 'dec-0011',
    authorityStatus: 'approved', demonstration: false,
  },
  {
    id: 'adr-003', directiveId: 'ST-ADR-2026-003', agent: 'ai-sos', title: 'Constitutional review of Phase 2 implementation',
    status: 'Closed — accepted (constitutional review concluded; reconciliation accepted)',
    standingDirective: 'sdr-001', reviewGate: 'rgate-002', productOwnerDecision: 'dec-0007',
    authorityStatus: 'approved', demonstration: false,
  },
  {
    id: 'adr-004', directiveId: 'Pending Product Owner-authorized ST-ADR identifier', agent: 'ai-scs',
    title: 'Phase 2 Constitutional Reconciliation',
    status: 'Closed — accepted (Product Owner acceptance of commit a773bd6)',
    standingDirective: 'sdr-002', deliverable: 'dlv-003', reviewGate: 'rgate-003',
    authorityStatus: 'approved', demonstration: false,
    notes: 'Governed by the Product Owner Directive "Phase 2 Constitutional Reconciliation" (2026-07-24) and closed by the Product Owner Acceptance Ruling (2026-07-25) accepting commit a773bd6. The canonical Assignment Directive identifier remains Product-Owner-pending — #SCS does not originate or assign it, and this acceptance does NOT assign it. Expected to occupy ST-ADR-2026-004; that number stays RESERVED and unresolved.',
  },
  // AGENT-006/#CKL-R competitive-research assignment — approved & activated by the Product Owner
  // ruling (2026-07-25). Canonical identifier ST-ADR-2026-005 (skips the reserved ST-ADR-2026-004).
  {
    id: 'adr-005', directiveId: 'ST-ADR-2026-005', agent: 'ai-cklr', title: 'Kidlytics Competitive Landscape Research',
    status: 'Active',
    standingDirective: 'sdr-006', deliverable: 'dlv-004', reviewGate: 'rgate-004', productOwnerDecision: 'dec-cklr-research-assignment',
    authorityStatus: 'approved', demonstration: false,
    notes: 'Reconciled from proposed PROPOSED-ST-ADR-CKL-R upon Product Owner approval. Authorizes evidence-based competitive research only; findings are advisory and do not automatically modify Kidlytics or authorize implementation.',
  },
  // Phase 4 — SCS Production Architecture. Authorized (planning only) by the Product Owner
  // Product Continuation & Architecture Directive (2026-07-25). Canonical ST-ADR identifier is
  // Product-Owner-pending (recommended ST-ADR-2026-006, which skips the reserved ST-ADR-2026-004);
  // #SCS does not originate it. Valid independently of #SCS activation.
  {
    id: 'adr-006', directiveId: 'Pending Product Owner-authorized ST-ADR identifier (recommended: ST-ADR-2026-006)', agent: 'ai-scs',
    title: 'Prepare the SCS Production Architecture & Authorization Package (Phase 4)',
    status: 'Closed — completed & accepted (Phase 4 Production Architecture approved as the authoritative planning baseline; canonical ST-ADR identifier remains Product-Owner-pending)',
    standingDirective: 'sdr-002', deliverable: 'dlv-005', reviewGate: 'rgate-005', productOwnerDecision: 'dec-scs-phase4',
    authorityStatus: 'approved', demonstration: false,
    notes: 'Phase 4 (architecture & planning) complete and accepted. This did NOT authorize production backend implementation, migration, authentication, integrations, hosting deployment, or go-live — Phase 5 requires a separate Product Owner production-implementation directive.',
  },
];

export const deliverables: Deliverable[] = [
  { id: 'dlv-001', deliverableId: 'ST-DLV-2026-001', title: 'Team Command Center (Phase 1 Functional Demonstration)', assignmentDirective: 'adr-001', reviewGate: 'rgate-001', status: 'Accepted', authorityStatus: 'approved', demonstration: false },
  { id: 'dlv-002', deliverableId: 'ST-DLV-2026-002', title: 'Phase 2 — Constitutional Governance Implementation', assignmentDirective: 'adr-002', reviewGate: 'rgate-002', status: 'Accepted (Product Owner acceptance of commit a773bd6)', authorityStatus: 'approved', demonstration: false },
  { id: 'dlv-003', deliverableId: 'ST-DLV-2026-003', title: 'Phase 2 Constitutional Reconciliation', assignmentDirective: 'adr-004', reviewGate: 'rgate-003', status: 'Accepted (Product Owner acceptance of commit a773bd6)', authorityStatus: 'approved', demonstration: false },
  // Required deliverable for ST-ADR-2026-005. Pending #CKL-R's research; NOT yet in review.
  { id: 'dlv-004', deliverableId: 'ST-DLV-2026-004', title: 'Kidlytics Competitive Landscape Report', assignmentDirective: 'adr-005', reviewGate: 'rgate-004', status: 'Pending — awaiting #CKL-R research', authorityStatus: 'approved', demonstration: false, notes: 'Must separate verified facts, reasonable inferences, unresolved questions, research limitations, and recommendations requiring Product Owner or #CKL review. Includes a complete source register.' },
  // Phase 4 deliverable — submitted for Product Owner review at the SCS Production Architecture Review gate.
  { id: 'dlv-005', deliverableId: 'ST-DLV-2026-005', title: 'SCS Production Architecture & Authorization Package (Rev 2 — corrected)', assignmentDirective: 'adr-006', reviewGate: 'rgate-005', status: 'Accepted (Product Owner) — authoritative production-architecture planning baseline', authorityStatus: 'approved', demonstration: false, notes: 'Accepted 2026-07-25 as the authoritative production-architecture planning baseline (PHASE_4_PRODUCTION_ARCHITECTURE.md + PHASE_4_CORRECTIONS_REV2.md). Acceptance of the architecture does NOT authorize production implementation; Phase 5 requires a separate Product Owner directive.' },
];

export const reviewGates: Gate[] = [
  { id: 'rgate-001', name: 'Team Command Center review', requiresOwnerApproval: true, status: 'Approved', decisionRef: 'dec-0014', authorityStatus: 'approved', demonstration: false },
  { id: 'rgate-002', name: 'Phase 2 review', requiresOwnerApproval: true, status: 'Approved', authorityStatus: 'approved', demonstration: false },
  { id: 'rgate-003', name: 'Reconciliation review', requiresOwnerApproval: true, status: 'Approved', authorityStatus: 'approved', demonstration: false },
  // Review gate for ST-DLV-2026-004. Product Owner is primary authority; #CKL is a product-review participant.
  { id: 'rgate-004', name: 'Competitive Research Review', requiresOwnerApproval: true, status: 'Open — pending deliverable', authorityStatus: 'approved', demonstration: false },
  // Phase 4 review gate. Product Owner is primary authority. Acceptance of the architecture does
  // NOT automatically authorize production implementation (separate ruling required).
  { id: 'rgate-005', name: 'SCS Production Architecture Review', requiresOwnerApproval: true, status: 'Approved — Phase 4 Production Architecture accepted (gate closed). Architecturally ready for Phase 5; Phase 5 implementation NOT authorized by this approval.', authorityStatus: 'approved', demonstration: false },
];

// ---- Operational History — activation events preserved independently ----
export const operationalHistory: OperationalHistoryEntry[] = [
  { id: 'oh-001', entryId: 'ST-OPH-2026-001', date: '2026-07-24', agent: 'ai-scs', summary: 'Team Command Center delivered and accepted as Phase 1 Functional Demonstration Complete.', evidenceType: 'Deliverable accepted', relatedObject: 'dlv-001', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-002', entryId: 'ST-OPH-2026-002', date: '2026-07-24', agent: 'ai-scs', summary: 'Phase 2 — Constitutional Governance Implementation submitted for Product Owner review.', evidenceType: 'Deliverable submitted', relatedObject: 'dlv-002', authorityStatus: 'reported', demonstration: false },
  { id: 'oh-003', entryId: 'ST-OPH-2026-003', date: '2026-07-24', agent: 'ai-sos', summary: 'Constitutional review of Phase 2 implementation in progress.', evidenceType: 'Governance review', relatedObject: 'adr-003', authorityStatus: 'reported', demonstration: false },
  // AGENT-005 — two distinct activation events, preserved independently.
  { id: 'oh-004', entryId: 'ST-OPH-2026-004', date: '2026-07-24', agent: 'ai-cia', summary: 'AGENT-005 (#CIA) Standing Directive ST-SD-005 v1 recorded Current.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-005', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-005', entryId: 'ST-OPH-2026-005', date: '2026-07-24', agent: 'ai-cia', summary: 'AGENT-005 (#CIA) Product Owner acceptance, verification, closure, and organizational readiness (TEAM-001 membership Active).', evidenceType: 'Product Owner acceptance & organizational readiness', relatedObject: 'tm-005', authorityStatus: 'approved', demonstration: false },
  // Activation events for the previously-governed agents.
  { id: 'oh-006', entryId: 'ST-OPH-2026-006', date: '2026-07-24', agent: 'ai-sos', summary: 'AGENT-001 (#SOS) Standing Directive ST-SD-001 v1 Current; TEAM-002 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-001', authorityStatus: 'proposed', demonstration: false, notes: 'Pending Product Owner approval — NOT authoritative activation evidence; retained for Product Owner review.' },
  { id: 'oh-007', entryId: 'ST-OPH-2026-007', date: '2026-07-24', agent: 'ai-scs', summary: 'AGENT-002 (#SCS) Standing Directive ST-SD-002 v1 Current; TEAM-002 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-002', authorityStatus: 'proposed', demonstration: false, notes: 'Pending Product Owner approval — NOT authoritative activation evidence; retained for Product Owner review.' },
  { id: 'oh-008', entryId: 'ST-OPH-2026-008', date: '2026-07-24', agent: 'ai-ckl', summary: 'AGENT-003 (#CKL) Standing Directive ST-SD-003 v1 Current; TEAM-001 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-003', authorityStatus: 'proposed', demonstration: false, notes: 'Pending Product Owner approval — NOT authoritative activation evidence; retained for Product Owner review.' },
  { id: 'oh-009', entryId: 'ST-OPH-2026-009', date: '2026-07-24', agent: 'ai-ckp', summary: 'AGENT-004 (#CKP) Standing Directive ST-SD-004 v1 Current; TEAM-001 membership Active.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-004', authorityStatus: 'proposed', demonstration: false, notes: 'Pending Product Owner approval — NOT authoritative activation evidence; retained for Product Owner review.' },
  // Product Owner Acceptance Ruling (2026-07-25) — records acceptance & closure only.
  // Deliberately NOT a "Constitutional activation" event and tied to no single agent, so it
  // activates no agent. It does not approve ST-OPH-2026-006..009 and does not assign the ST-ADR identifier.
  { id: 'oh-010', entryId: 'ST-OPH-2026-010', date: '2026-07-25', summary: 'Product Owner accepted commit a773bd6 as the Phase 2 reconciliation baseline; the Phase 2 implementation-reconciliation cycle is closed and the Constitutional State Derivation Engine implementation is Verified and Accepted. This acceptance does NOT approve ST-OPH-2026-006 through ST-OPH-2026-009, activates no agent (AGENT-001..004 remain Pending activation), and does not assign the reconciliation ST-ADR identifier.', evidenceType: 'Product Owner acceptance & closure', relatedObject: 'dlv-003', authorityStatus: 'approved', demonstration: false },
  // Milestone: Transition from Constitutional Foundation to Product Execution (Approved).
  // Records the strategic transition only — activates no agent and reopens nothing.
  // AGENT-006/#CKL-R authoritative activation event — approved by the Product Owner ruling (2026-07-25).
  { id: 'oh-012', entryId: 'ST-OPH-2026-012', date: '2026-07-25', agent: 'ai-cklr', summary: 'AGENT-006 (#CKL-R) constitutionally activated by express Product Owner ruling: AGENT-006 identity approved; Standing Directive ST-SD-006 recorded Current; Team Membership TM-009 recorded Active in TEAM-001; Product Owner activation decision recorded. #CKL-R transitions from Proposed / Pending Onboarding to Activated — Available — Awaiting Assignment. No approved active Assignment Directive exists; competitive research remains prohibited until a separate Assignment Directive is approved. Reconciled from proposed PROPOSED-ST-OPH-CKL-R; does not determine the disposition of ST-OPH-2026-006..009.', evidenceType: 'Constitutional activation', relatedObject: 'sdr-006', authorityStatus: 'approved', demonstration: false },
  { id: 'oh-011', entryId: 'ST-OPH-2026-011', date: '2026-07-25', summary: 'Milestone — Transition from Constitutional Foundation to Product Execution (Approved). The Constitutional State Derivation implementation initiative is complete (architecture → implementation → reconciliation → constitutional review → Product Owner acceptance → verification → recording → operational closure). The Constitutional State Derivation Engine and the SCS constitutional models are now accepted OPERATIONAL INFRASTRUCTURE, not an active implementation initiative. Kidlytics is restored as the primary governed product initiative; the Constitution now supports the product. Reserved and unaffected: authorized activation history for AGENT-001..004; disposition of ST-OPH-2026-006..009; assignment of the reconciliation ST-ADR identifier; future organizational evidence review for AGENT-003/#CKL and AGENT-004/#CKP — these remain separate Product Owner governance work and do not delay Kidlytics.', evidenceType: 'Product Owner milestone — strategic transition', authorityStatus: 'approved', demonstration: false },
];

// ---- Team and Team Membership (first-class objects) ----
export const teams: Team[] = [
  { id: 'team-001', teamId: 'TEAM-001', name: 'ShockTheory Agent Team', status: 'Active', authorityStatus: 'approved', demonstration: false },
  { id: 'team-002', teamId: 'TEAM-002', name: 'SCS Team', status: 'Active', authorityStatus: 'approved', demonstration: false },
];

export const teamMemberships: TeamMembership[] = [
  // Displaced implementation records — #SOS/#SCS approved membership is TEAM-002 (SCS Team).
  // Retained for traceability; NOT current governing membership; excluded from derivation.
  { id: 'tm-001', membershipId: 'TM-001', agent: 'ai-sos', team: 'team-001', status: 'Superseded — reconciled to TEAM-002', effectiveDate: '2026-07-24', authorityStatus: 'superseded', demonstration: false, notes: 'Displaced implementation record; #SOS approved membership is TEAM-002.' },
  { id: 'tm-002', membershipId: 'TM-002', agent: 'ai-scs', team: 'team-001', status: 'Superseded — reconciled to TEAM-002', effectiveDate: '2026-07-24', authorityStatus: 'superseded', demonstration: false, notes: 'Displaced implementation record; #SCS approved membership is TEAM-002.' },
  { id: 'tm-003', membershipId: 'TM-003', agent: 'ai-ckl', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-004', membershipId: 'TM-004', agent: 'ai-ckp', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-005', membershipId: 'TM-005', agent: 'ai-cia', team: 'team-001', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  // TEAM-002 (SCS Team) — approved memberships. Membership records only: they do not
  // merge identities, transfer authority, alter Standing Directives, or create powers.
  { id: 'tm-006', membershipId: 'TM-006', agent: 'po-sonja', team: 'team-002', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false, notes: 'Product Owner — Sonja Ross (not an agent).' },
  { id: 'tm-007', membershipId: 'TM-007', agent: 'ai-sos', team: 'team-002', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  { id: 'tm-008', membershipId: 'TM-008', agent: 'ai-scs', team: 'team-002', status: 'Active', effectiveDate: '2026-07-24', authorityStatus: 'approved', demonstration: false },
  // AGENT-006/#CKL-R — approved TEAM-001 membership by the Product Owner ruling (2026-07-25).
  { id: 'tm-009', membershipId: 'TM-009', agent: 'ai-cklr', team: 'team-001', status: 'Active', effectiveDate: '2026-07-25', authorityStatus: 'approved', demonstration: false, notes: 'Reconciled from proposed PROPOSED-TM-CKL-R upon Product Owner approval. Active membership does not, by itself, authorize research.' },
];
