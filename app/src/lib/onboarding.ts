import { deriveAgentState, type DerivedAgentState } from './derivation';
import type { OnboardingCandidate } from '../seed/onboarding';

/**
 * Governed-agent onboarding derivation (Phase 3).
 *
 * ADDITIVE: it does not modify the Constitutional State Derivation Engine. It REUSES
 * `deriveAgentState` to show the CURRENT derived state from the evidence that is actually
 * approved, plus an illustrative preview of what an approved research assignment WOULD
 * produce — so the effect of a future approval is visible before any authority is created.
 *
 * When the onboarding is approved, the current state derives from approved evidence
 * (Available — Awaiting Assignment). The research Assignment Directive stays proposed, so
 * the agent never derives as Working through this workspace.
 */

export type ReadinessStatus =
  | 'present-approved'
  | 'present-proposed'
  | 'pending-approval'
  | 'missing'
  | 'superseded'
  | 'contradictory'
  | 'not-applicable';

export const READINESS_LABEL: Record<ReadinessStatus, string> = {
  'present-approved': 'Present & approved',
  'present-proposed': 'Present but proposed',
  'pending-approval': 'Pending Product Owner approval',
  missing: 'Missing',
  superseded: 'Superseded',
  contradictory: 'Contradictory',
  'not-applicable': 'Not applicable',
};

export interface ChecklistItem {
  label: string;
  status: ReadinessStatus;
  detail: string;
  /** Does this record, as it currently stands, count toward constitutional activation? */
  satisfiesActivationNow: boolean;
  note: string;
}

export interface OnboardingStage {
  index: number;
  name: string;
  status: 'complete' | 'current' | 'pending';
}

export interface ProvenanceRow { record: string; from: string; to: string }

export interface OnboardingModel {
  handle: string;
  name: string;
  approved: boolean;
  statusLabel: string;
  stages: OnboardingStage[];
  checklist: ChecklistItem[];
  /** Current derived state from APPROVED evidence (Available — Awaiting Assignment when approved). */
  current: DerivedAgentState;
  /** Illustrative preview: if a research Assignment Directive were approved AND active → Working. */
  withAssignment: DerivedAgentState;
  activated: boolean;
  isAvailableAwaitingAssignment: boolean;
  /** Research is blocked until a separate Assignment Directive is approved and activated. */
  researchBlocked: boolean;
  provenance: ProvenanceRow[];
  requiredDecisions: string[];
  contradictions: string[];
}

const STAGE_NAMES = [
  'Proposed identity',
  'Constitutional record preparation',
  'Product Owner review',
  'Approved governing records',
  'Activation readiness',
  'Approved activation',
  'Assignment readiness',
  'Operational availability',
] as const;

export function deriveOnboarding(c: OnboardingCandidate): OnboardingModel {
  const approved = c.onboardingApproved;

  // CURRENT state — from the evidence that is actually approved. Only approved evidence
  // governs, so a still-proposed package can never activate here.
  const current = deriveAgentState({
    agentName: c.name,
    standingDirective: {
      id: c.standingDirective.ref.approvedId ?? c.standingDirective.ref.recommendedId,
      version: c.standingDirective.version,
      status: c.standingDirective.status, // 'Current' once approved
    },
    productOwnerAuthority: { id: c.activationAuthority.decision, approved: c.activationAuthority.approved },
    activationEventIds: c.activationEvent.authorityStatus === 'approved' ? [c.activationEvent.ref.approvedId ?? c.activationEvent.ref.recommendedId] : [],
    pendingActivationEventIds: c.activationEvent.authorityStatus === 'approved' ? [] : [c.activationEvent.ref.recommendedId],
    teamMembership: c.teamMembership.status === 'Active'
      ? { label: `${c.teamMembership.teamId} — Active`, active: true }
      : undefined,
    // The competitive-research Assignment Directive is intentionally NOT supplied: it is
    // proposed/not-active, so the agent must derive as Available — Awaiting Assignment.
  });

  // Illustrative preview only — the research ADR is NOT active; this shows what a future,
  // separate approval WOULD produce (Working), reinforcing that research is a distinct decision.
  const withAssignment = deriveAgentState({
    agentName: c.name,
    standingDirective: { id: c.standingDirective.ref.approvedId ?? 'ST-SD-006', version: c.standingDirective.version, status: 'Current' },
    productOwnerAuthority: { id: c.activationAuthority.decision, approved: true },
    activationEventIds: [c.activationEvent.ref.approvedId ?? 'ST-OPH-2026-012'],
    teamMembership: { label: `${c.teamMembership.teamId} — Active`, active: true },
    activeAssignmentDirective: {
      directiveId: 'ST-ADR (proposed — illustrative only)',
      title: c.assignmentDirective.title,
      status: 'Active',
      deliverable: c.assignmentDirective.deliverable,
      reviewGate: c.assignmentDirective.reviewGate,
    },
  });

  const approvedRecord = (approvedId: string | undefined, tempRef: string): { status: ReadinessStatus; note: string } =>
    approvedId
      ? { status: 'present-approved', note: `Approved as ${approvedId} (reconciled from ${tempRef}).` }
      : { status: 'present-proposed', note: `Proposed (${tempRef}) — not governing until approved.` };

  const idR = approvedRecord(c.identity.approvedId, c.identity.tempRef);
  const sdR = approvedRecord(c.standingDirective.ref.approvedId, c.standingDirective.ref.tempRef);
  const tmR = approvedRecord(c.teamMembership.ref.approvedId, c.teamMembership.ref.tempRef);
  const ophR = approvedRecord(c.activationEvent.ref.approvedId, c.activationEvent.ref.tempRef);

  const checklist: ChecklistItem[] = [
    { label: 'Agent Identity', status: idR.status, detail: `Canonical identity ${c.identity.approvedId ?? c.identity.recommendedId}.`, satisfiesActivationNow: approved, note: idR.note },
    { label: 'Standing Directive (Current)', status: sdR.status, detail: `${c.standingDirective.ref.approvedId ?? c.standingDirective.ref.recommendedId} — ${c.standingDirective.status}.`, satisfiesActivationNow: c.standingDirective.status === 'Current', note: sdR.note },
    { label: 'Product Owner activation authority', status: c.activationAuthority.approved ? 'present-approved' : 'pending-approval', detail: c.activationAuthority.decision, satisfiesActivationNow: c.activationAuthority.approved, note: c.activationAuthority.approved ? 'Approved Product Owner activation authority on record.' : 'Awaiting Product Owner activation authority.' },
    { label: 'Operational History activation event', status: ophR.status, detail: `${c.activationEvent.ref.approvedId ?? c.activationEvent.ref.recommendedId} — authority: ${c.activationEvent.authorityStatus}.`, satisfiesActivationNow: c.activationEvent.authorityStatus === 'approved', note: ophR.note },
    { label: 'Team Membership (TEAM-001, Active)', status: tmR.status, detail: `${c.teamMembership.ref.approvedId ?? c.teamMembership.ref.recommendedId} → ${c.teamMembership.teamId}, ${c.teamMembership.status}. Derived independently of activation.`, satisfiesActivationNow: c.teamMembership.status === 'Active', note: tmR.note },
    { label: 'Competitive-research Assignment Directive', status: 'present-proposed', detail: `${c.assignmentDirective.ref.tempRef} — ${c.assignmentDirective.status}. Prepared for a future, separate Product Owner approval.`, satisfiesActivationNow: false, note: 'Not active. Research may not begin until this is separately approved and activated. No canonical ST-ADR identifier is assigned.' },
  ];

  // With onboarding approved, stages 1–7 are complete and the agent is at operational
  // availability (stage 8) — Available, awaiting its first assignment.
  const completeThrough = approved ? 7 : 2;
  const stages: OnboardingStage[] = STAGE_NAMES.map((name, i) => ({
    index: i + 1,
    name,
    status: i + 1 <= completeThrough ? 'complete' : i + 1 === completeThrough + 1 ? 'current' : 'pending',
  }));

  const provenance: ProvenanceRow[] = [
    { record: 'Agent identity', from: c.identity.tempRef, to: c.identity.approvedId ?? '(pending)' },
    { record: 'Standing Directive', from: c.standingDirective.ref.tempRef, to: c.standingDirective.ref.approvedId ?? '(pending)' },
    { record: 'Team Membership', from: c.teamMembership.ref.tempRef, to: c.teamMembership.ref.approvedId ?? '(pending)' },
    { record: 'Activation event', from: c.activationEvent.ref.tempRef, to: c.activationEvent.ref.approvedId ?? '(pending)' },
    { record: 'Research Assignment Directive', from: c.assignmentDirective.ref.tempRef, to: 'remains proposed — not active' },
  ];

  return {
    handle: c.handle,
    name: c.name,
    approved,
    statusLabel: approved
      ? `Activated — ${current.status}${current.status === 'Available' ? ' — Awaiting Assignment' : ''}`
      : 'Proposed / Pending constitutional onboarding',
    stages,
    checklist,
    current,
    withAssignment,
    activated: current.activated,
    isAvailableAwaitingAssignment: current.activated && current.status === 'Available',
    researchBlocked: true,
    provenance,
    requiredDecisions: c.requiredDecisions,
    contradictions: current.contradictions,
  };
}
