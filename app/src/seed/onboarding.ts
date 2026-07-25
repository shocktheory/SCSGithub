/**
 * Phase 3 — Governed Agent Onboarding.
 *
 * The constitutional onboarding package for the Kidlytics Competitive Research Agent
 * (AGENT-006 / #CKL-R). As of the Product Owner ruling of 2026-07-25 the onboarding
 * records are APPROVED and #CKL-R is activated to Available — Awaiting Assignment.
 *
 * What is approved (authoritative — also present in the real constitutional collections):
 *   AGENT-006 · ST-SD-006 (Current) · TM-009 (Active, TEAM-001) · ST-OPH-2026-012 (approved).
 *
 * What remains PROPOSED / nonauthoritative:
 *   the competitive-research Assignment Directive (Proposed — Not Active). No research
 *   may begin and no canonical ST-ADR identifier is assigned.
 *
 * Each converted record preserves its proposal → approval provenance (the original
 * nonauthoritative working reference is retained for audit).
 */
import type { AuthorityState } from '../domain/authority';

export interface ProposedIdentifier {
  /** Original nonauthoritative working reference, retained for audit provenance. */
  tempRef: string;
  /** The identifier recommended at proposal time. */
  recommendedId: string;
  /** The approved canonical identifier once the Product Owner rules (undefined while still proposed). */
  approvedId?: string;
  /** The decision that authorized / must authorize the canonical identifier. */
  authorizingDecision: string;
}

export interface OnboardingCandidate {
  agentKey: string;
  handle: string;
  name: string;
  /** True once the Product Owner has approved the onboarding records (identity/SD/authority/activation/membership). */
  onboardingApproved: boolean;
  identity: ProposedIdentifier;
  intendedTeam: { teamId: string; name: string };
  intendedFunction: string;

  standingDirective: {
    ref: ProposedIdentifier;
    title: string;
    version: string;
    governingAuthority: string;
    /** 'Current' once approved; 'Proposed' before. */
    status: 'Proposed' | 'Current';
    text: string;
  };

  activationAuthority: {
    /** The approved Decision that authorizes activation (this Product Owner ruling). */
    decision: string;
    approved: boolean;
  };

  teamMembership: {
    ref: ProposedIdentifier;
    teamId: string;
    /** 'Active' once approved; 'Proposed' before. */
    status: 'Proposed' | 'Active';
  };

  activationEvent: {
    ref: ProposedIdentifier;
    evidenceType: string;
    summary: string;
    /** 'approved' once the Product Owner approves it. */
    authorityStatus: AuthorityState;
  };

  /** Competitive-research Assignment Directive — remains proposed / not active. No research may begin. */
  assignmentDirective: {
    ref: ProposedIdentifier;
    title: string;
    status: 'Proposed — not active';
    deliverable: string;
    reviewGate: string;
  };

  responsibilities: string[];
  limitations: string[];
  /** Product Owner decisions still required (post-activation: only the research assignment). */
  requiredDecisions: string[];
  audit: { initiatedBy: string; dateProposed: string; approvedBy?: string; dateApproved?: string; provenance: string };
}

export const cklrCandidate: OnboardingCandidate = {
  agentKey: 'ai-cklr',
  handle: '#CKL-R',
  name: 'Kidlytics Competitive Research Agent',
  onboardingApproved: true,
  identity: {
    tempRef: 'PROPOSED-AGENT-CKL-R',
    recommendedId: 'AGENT-006',
    approvedId: 'AGENT-006',
    authorizingDecision: 'Product Owner ruling (2026-07-25) — approves AGENT-006 as the canonical identity.',
  },
  intendedTeam: { teamId: 'TEAM-001', name: 'Kidlytics Team (ShockTheory Agent Team)' },
  intendedFunction: 'Evidence-based competitive and market research supporting Kidlytics.',

  standingDirective: {
    ref: {
      tempRef: 'PROPOSED-ST-SD-CKL-R',
      recommendedId: 'ST-SD-006',
      approvedId: 'ST-SD-006',
      authorizingDecision: 'Product Owner ruling (2026-07-25) — approves ST-SD-006 and records it Current.',
    },
    title: 'Kidlytics competitive research authority',
    version: 'v1',
    governingAuthority: 'Sonja (Product Owner)',
    status: 'Current',
    text:
      'Kidlytics Competitive Research Agent — evidence-based competitive and market research supporting Kidlytics, ' +
      'performed only when authorized through an approved Assignment Directive: identify direct and adjacent competitors; ' +
      'examine market positioning; compare capabilities and pricing; evaluate trust/safety, AI, financial, and ' +
      'court-related/child-support/co-parenting positioning; identify gaps and strategic opportunities; collect and cite ' +
      'verifiable evidence; distinguish verified fact, inference, open question, and recommendation; prepare findings for ' +
      'Product Owner review. Advisory only — holds no product-decision or approval authority and may not begin research ' +
      'without an approved Assignment Directive.',
  },

  activationAuthority: {
    decision: 'Product Owner activation ruling (2026-07-25) — recorded as an approved governing Decision (canonical ST-DEC identifier Product-Owner-pending).',
    approved: true,
  },

  teamMembership: {
    ref: {
      tempRef: 'PROPOSED-TM-CKL-R',
      recommendedId: 'TM-009',
      approvedId: 'TM-009',
      authorizingDecision: 'Product Owner ruling (2026-07-25) — approves TM-009 Active in TEAM-001.',
    },
    teamId: 'TEAM-001',
    status: 'Active',
  },

  activationEvent: {
    ref: {
      tempRef: 'PROPOSED-ST-OPH-CKL-R',
      recommendedId: 'ST-OPH-2026-012',
      approvedId: 'ST-OPH-2026-012',
      authorizingDecision: 'Product Owner ruling (2026-07-25) — approves ST-OPH-2026-012 as authoritative activation evidence.',
    },
    evidenceType: 'Constitutional activation',
    summary:
      'AGENT-006 (#CKL-R) constitutionally activated: ST-SD-006 Current, TM-009 Active in TEAM-001, Product Owner activation ' +
      'decision recorded. Transitioned from Proposed / Pending Onboarding to Available — Awaiting Assignment. No approved active ' +
      'Assignment Directive; competitive research remains prohibited.',
    authorityStatus: 'approved',
  },

  assignmentDirective: {
    ref: {
      tempRef: 'PROPOSED-ST-ADR-CKL-R',
      recommendedId:
        'not assigned — a canonical ST-ADR identifier is assigned only by a separate Product Owner directive approving the research assignment',
      authorizingDecision: 'A SEPARATE future Product Owner directive — not this ruling.',
    },
    title: 'Kidlytics competitive landscape research',
    status: 'Proposed — not active',
    deliverable: 'Kidlytics Competitive Landscape Report (proposed)',
    reviewGate: 'Competitive Research review (proposed)',
  },

  responsibilities: [
    'Identify direct and adjacent competitors',
    'Examine market positioning',
    'Compare capabilities and pricing',
    'Evaluate trust/safety, AI, financial, and court-related positioning',
    'Identify competitive gaps and strategic opportunities',
    'Collect and cite verifiable evidence',
    'Distinguish verified fact, inference, open question, and recommendation',
    'Prepare structured findings for Product Owner review',
  ],
  limitations: [
    'May not change Kidlytics product architecture',
    'May not modify the prototype',
    'May not implement product features',
    'May not make final product decisions',
    'May not approve its own recommendations',
    'May not convert competitor behavior into Kidlytics requirements',
    'May not direct #CKL, #CIA, #CKP, or any other governed agent',
    'May not begin research without an approved Assignment Directive',
    'May not treat onboarding or activation as permission to begin competitive research',
  ],
  requiredDecisions: [
    'Separately approve and activate a competitive-research Assignment Directive (assigning its canonical ST-ADR identifier, scope, and return requirements) before any research begins.',
  ],
  audit: {
    initiatedBy: '#SCS (implementation — no constitutional authority)',
    dateProposed: '2026-07-25',
    approvedBy: 'Sonja (Product Owner)',
    dateApproved: '2026-07-25',
    provenance:
      'Proposed under the Phase 3 Implementation Authorization (commit 0ecbf2a); approved and activated by the Product Owner ' +
      'ruling "Accept Phase 3 and Constitutionally Onboard AGENT-006/#CKL-R" (2026-07-25). Accepted baseline: commit a773bd6.',
  },
};
