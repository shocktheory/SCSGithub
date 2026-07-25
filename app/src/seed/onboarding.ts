/**
 * Phase 3 — Governed Agent Onboarding.
 *
 * The PROPOSED constitutional onboarding package for the Kidlytics Competitive
 * Research Agent (#CKL-R). Everything here is NONAUTHORITATIVE:
 *
 *   - Every record is `proposed`. None is approved, Current, or Active.
 *   - No canonical identifier is originated. Each record carries a temporary,
 *     nonauthoritative working reference and a SEPARATE recommended canonical id
 *     that only a Product Owner ruling can confirm.
 *   - This package is deliberately NOT merged into the authoritative collections
 *     that feed the Constitutional State Derivation Engine for the five existing
 *     agents. It is consumed only by the Onboarding Workspace and its derivation
 *     preview, so it cannot alter any existing derived state.
 *
 * Preparing these records is implementation work. It is NOT approval, and it does
 * NOT activate #CKL-R. Only an explicit Product Owner ruling can do that.
 */
import type { AuthorityState } from '../domain/authority';

/** A proposed identifier: a temporary working reference plus the recommended canonical id. */
export interface ProposedIdentifier {
  /** Nonauthoritative working reference used until the Product Owner assigns the canonical id. */
  tempRef: string;
  /** The canonical identifier #SCS RECOMMENDS — not authoritative until a Product Owner ruling. */
  recommendedId: string;
  /** The constitutional decision that must authorize the canonical identifier. */
  authorizingDecisionNeeded: string;
}

export interface OnboardingCandidate {
  /** Internal application key (not a constitutional identifier). */
  agentKey: string;
  handle: string;
  name: string;
  identity: ProposedIdentifier;
  intendedTeam: { teamId: string; name: string };
  intendedFunction: string;

  standingDirective: {
    ref: ProposedIdentifier;
    title: string;
    version: string;
    governingAuthority: string;
    /** PROPOSED — NOT 'Current'. A proposed Standing Directive does not govern. */
    status: 'Proposed';
    text: string;
  };

  /** The approved Product Owner authority that activation would require (not yet granted). */
  activationAuthority: {
    /** The decision that must exist & be approved to authorize activation. */
    authorizingDecisionNeeded: string;
    approved: false;
  };

  teamMembership: {
    ref: ProposedIdentifier;
    teamId: string;
    /** PROPOSED — NOT 'Active'. A proposed membership is not counted in derivation. */
    status: 'Proposed';
  };

  activationEvent: {
    ref: ProposedIdentifier;
    evidenceType: string;
    summary: string;
    /** proposed — nonauthoritative; must not satisfy activation. */
    authorityStatus: AuthorityState;
  };

  /** Competitive-research Assignment Directive — prepared, but NOT active. No research may begin. */
  assignmentDirective: {
    ref: ProposedIdentifier;
    title: string;
    /** PROPOSED — NOT 'Active'. */
    status: 'Proposed — not active';
    deliverable: string;
    reviewGate: string;
  };

  responsibilities: string[];
  limitations: string[];
  /** Exact Product Owner decisions required to complete onboarding. */
  requiredDecisions: string[];
  audit: { initiatedBy: string; dateProposed: string; provenance: string };
}

export const cklrCandidate: OnboardingCandidate = {
  agentKey: 'ai-cklr',
  handle: '#CKL-R',
  name: 'Kidlytics Competitive Research Agent',
  identity: {
    tempRef: 'PROPOSED-AGENT-CKL-R',
    recommendedId: 'AGENT-006',
    authorizingDecisionNeeded:
      'Product Owner decision confirming the canonical AGENT identifier (no authoritative auto-numbering rule is on record; AGENT-006 is a recommendation only).',
  },
  intendedTeam: { teamId: 'TEAM-001', name: 'Kidlytics Team (ShockTheory Agent Team)' },
  intendedFunction: 'Evidence-based competitive and market research supporting Kidlytics.',

  standingDirective: {
    ref: {
      tempRef: 'PROPOSED-ST-SD-CKL-R',
      recommendedId: 'ST-SD-006',
      authorizingDecisionNeeded:
        'Product Owner decision approving the #CKL-R Standing Directive and its canonical ST-SD identifier.',
    },
    title: 'Kidlytics competitive research authority',
    version: 'v1 (proposed)',
    governingAuthority: 'Sonja (Product Owner)',
    status: 'Proposed',
    text:
      'Kidlytics Competitive Research Agent — evidence-based competitive and market research supporting Kidlytics: ' +
      'identify direct and adjacent competitors; examine market positioning; compare capabilities and pricing; ' +
      'evaluate trust, financial, AI, and court-related positioning; identify competitive gaps and strategic opportunities; ' +
      'collect and cite verifiable evidence; distinguish fact, inference, and recommendation; submit findings for Product Owner review. ' +
      'Advisory only — holds no product-decision or approval authority.',
  },

  activationAuthority: {
    authorizingDecisionNeeded:
      'Product Owner activation authority (an approved Decision) authorizing #CKL-R constitutional activation.',
    approved: false,
  },

  teamMembership: {
    ref: {
      tempRef: 'PROPOSED-TM-CKL-R',
      recommendedId: 'TM-009',
      authorizingDecisionNeeded:
        'Product Owner decision approving #CKL-R membership in TEAM-001 and its canonical TM identifier.',
    },
    teamId: 'TEAM-001',
    status: 'Proposed',
  },

  activationEvent: {
    ref: {
      tempRef: 'PROPOSED-ST-OPH-CKL-R',
      recommendedId: 'ST-OPH-2026-012',
      authorizingDecisionNeeded:
        'Product Owner approval converting the proposed Operational History activation event into approved activation evidence.',
    },
    evidenceType: 'Constitutional activation',
    summary:
      '#CKL-R Standing Directive (proposed ST-SD-006) recorded Current and TEAM-001 membership Active upon Product Owner approval. ' +
      'PROPOSED — nonauthoritative; does not satisfy activation until the Product Owner expressly approves it.',
    authorityStatus: 'proposed',
  },

  assignmentDirective: {
    ref: {
      tempRef: 'PROPOSED-ST-ADR-CKL-R',
      recommendedId:
        'next available ST-ADR-2026 identifier — contingent, as the reserved reconciliation Assignment Directive is expected to take ST-ADR-2026-004; #SCS assigns neither',
      authorizingDecisionNeeded:
        'Product Owner decision approving the competitive-research Assignment Directive, its canonical ST-ADR identifier, and its activation.',
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
    'Evaluate trust, financial, AI, and court-related positioning',
    'Identify competitive gaps and strategic opportunities',
    'Collect and cite verifiable evidence',
    'Distinguish fact, inference, and recommendation',
    'Submit findings for Product Owner review',
  ],
  limitations: [
    'May not change Kidlytics product architecture',
    'May not modify the prototype',
    'May not implement product features',
    'May not make final product decisions',
    'May not approve its own recommendations',
    'May not convert competitor behavior into Kidlytics requirements',
    'May not direct #CKL, #CIA, #CKP, or any other governed agent',
    'May not begin competitive research before onboarding and assignment are approved',
  ],
  requiredDecisions: [
    'Approve the canonical AGENT identifier for #CKL-R (recommended AGENT-006).',
    'Approve the #CKL-R Standing Directive and its canonical ST-SD identifier (recommended ST-SD-006), recording it Current.',
    'Grant Product Owner activation authority for #CKL-R (an approved Decision).',
    'Approve TEAM-001 membership for #CKL-R and its canonical TM identifier (recommended TM-009), recording it Active.',
    'Approve the Operational History activation event and its canonical ST-OPH identifier (recommended ST-OPH-2026-012), making it authoritative activation evidence.',
    'Separately approve and activate the competitive-research Assignment Directive (and assign its canonical ST-ADR identifier) before any research begins.',
  ],
  audit: {
    initiatedBy: '#SCS (implementation — no constitutional authority)',
    dateProposed: '2026-07-25',
    provenance:
      'Product Owner Implementation Authorization — "Advance the Constitutional Command Center to Phase 3 — Operational Governance and Agent Onboarding" (2026-07-25). Accepted baseline: commit a773bd6.',
  },
};
