import { deriveAgentState, type DerivedAgentState } from './derivation';
import type { OnboardingCandidate } from '../seed/onboarding';

/**
 * Governed-agent onboarding derivation (Phase 3).
 *
 * This is ADDITIVE: it does not modify the Constitutional State Derivation Engine.
 * It REUSES `deriveAgentState` to show, honestly, both the CURRENT derived state
 * (with nothing approved) and a PREVIEW of what the proposed approvals WOULD produce —
 * before any authority is actually created.
 *
 * The current state uses only approved evidence, so a proposed package can never
 * satisfy activation here. The preview never mutates records; it only shows effect.
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
  /** What the record becomes once the Product Owner approves it. */
  afterApproval: string;
}

export interface OnboardingStage {
  index: number;
  name: string;
  status: 'complete' | 'current' | 'pending';
}

export interface OnboardingModel {
  handle: string;
  name: string;
  /** #CKL-R is proposed until the Product Owner approves the package. */
  statusLabel: string;
  stages: OnboardingStage[];
  checklist: ChecklistItem[];
  /** Current derived state — nothing approved, so never activated. */
  before: DerivedAgentState;
  /** Preview: onboarding records approved (identity, SD, authority, activation, membership) — no research assignment yet. */
  afterActivation: DerivedAgentState;
  /** Preview: additionally the competitive-research Assignment Directive approved AND activated. */
  afterAssignment: DerivedAgentState;
  wouldActivate: boolean;
  wouldBecomeAssignmentReady: boolean;
  /** True whenever the current, unapproved package must not be treated as active. */
  researchBlocked: boolean;
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
  // CURRENT state — only APPROVED evidence governs. The proposed activation event is
  // passed as a PENDING event so it is traced but never counted toward activation.
  const before = deriveAgentState({
    agentName: c.name,
    standingDirective: { id: c.standingDirective.ref.recommendedId, version: c.standingDirective.version, status: c.standingDirective.status },
    productOwnerAuthority: { id: c.activationAuthority.authorizingDecisionNeeded, approved: c.activationAuthority.approved },
    activationEventIds: [],
    pendingActivationEventIds: [c.activationEvent.ref.recommendedId],
    teamMembership: undefined, // proposed membership is not Active → not counted
  });

  // PREVIEW A — the onboarding records approved (no research assignment yet).
  const afterActivation = deriveAgentState({
    agentName: c.name,
    standingDirective: { id: c.standingDirective.ref.recommendedId, version: 'v1', status: 'Current' },
    productOwnerAuthority: { id: c.activationEvent.ref.recommendedId, approved: true },
    activationEventIds: [c.activationEvent.ref.recommendedId],
    teamMembership: { label: `${c.teamMembership.teamId} — Active`, active: true },
  });

  // PREVIEW B — additionally the competitive-research Assignment Directive approved & activated.
  const afterAssignment = deriveAgentState({
    agentName: c.name,
    standingDirective: { id: c.standingDirective.ref.recommendedId, version: 'v1', status: 'Current' },
    productOwnerAuthority: { id: c.activationEvent.ref.recommendedId, approved: true },
    activationEventIds: [c.activationEvent.ref.recommendedId],
    teamMembership: { label: `${c.teamMembership.teamId} — Active`, active: true },
    activeAssignmentDirective: {
      directiveId: c.assignmentDirective.ref.recommendedId,
      title: c.assignmentDirective.title,
      status: 'Active',
      deliverable: c.assignmentDirective.deliverable,
      reviewGate: c.assignmentDirective.reviewGate,
    },
  });

  const checklist: ChecklistItem[] = [
    {
      label: 'Agent Identity',
      status: 'present-proposed',
      detail: `Proposed identity ${c.identity.tempRef}; recommended canonical ${c.identity.recommendedId}. ${c.identity.authorizingDecisionNeeded}`,
      satisfiesActivationNow: false,
      afterApproval: `Canonical AGENT identifier confirmed (recommended ${c.identity.recommendedId}).`,
    },
    {
      label: 'Standing Directive (Current)',
      status: 'present-proposed',
      detail: `${c.standingDirective.ref.tempRef} is Proposed, not Current; recommended ${c.standingDirective.ref.recommendedId}. A proposed Standing Directive does not govern.`,
      satisfiesActivationNow: false,
      afterApproval: `Standing Directive recorded Current (recommended ${c.standingDirective.ref.recommendedId}).`,
    },
    {
      label: 'Product Owner activation authority',
      status: 'pending-approval',
      detail: c.activationAuthority.authorizingDecisionNeeded,
      satisfiesActivationNow: false,
      afterApproval: 'Approved Product Owner activation authority on record.',
    },
    {
      label: 'Operational History activation event',
      status: 'present-proposed',
      detail: `${c.activationEvent.ref.tempRef} is proposed / nonauthoritative; recommended ${c.activationEvent.ref.recommendedId}. It must not satisfy activation until expressly approved.`,
      satisfiesActivationNow: false,
      afterApproval: `Approved activation event (recommended ${c.activationEvent.ref.recommendedId}) — valid activation evidence.`,
    },
    {
      label: 'Team Membership (TEAM-001, Active)',
      status: 'present-proposed',
      detail: `${c.teamMembership.ref.tempRef} is Proposed, not Active; recommended ${c.teamMembership.ref.recommendedId}. Derived independently of activation.`,
      satisfiesActivationNow: false,
      afterApproval: `TEAM-001 membership recorded Active (recommended ${c.teamMembership.ref.recommendedId}).`,
    },
    {
      label: 'Competitive-research Assignment Directive',
      status: 'present-proposed',
      detail: `${c.assignmentDirective.ref.tempRef} is Proposed — not active. Prepared for review; research may not begin until it is separately approved and activated.`,
      satisfiesActivationNow: false,
      afterApproval: 'Active Assignment Directive — research may then begin under Product Owner authority.',
    },
  ];

  // Records are prepared and proposed, awaiting Product Owner review.
  const stages: OnboardingStage[] = STAGE_NAMES.map((name, i) => ({
    index: i + 1,
    name,
    status: i + 1 <= 2 ? 'complete' : i + 1 === 3 ? 'current' : 'pending',
  }));

  return {
    handle: c.handle,
    name: c.name,
    statusLabel: 'Proposed / Pending constitutional onboarding',
    stages,
    checklist,
    before,
    afterActivation,
    afterAssignment,
    wouldActivate: afterActivation.activated,
    wouldBecomeAssignmentReady: afterActivation.activated && afterActivation.status === 'Available',
    researchBlocked: true,
    requiredDecisions: c.requiredDecisions,
    contradictions: before.contradictions,
  };
}
