import type { Deliverable, Gate, Decision, AssignmentDirective, OperationalHistoryEntry } from '../domain/entities';

/**
 * Governance Visibility (Phase 8) — PRESENTATION-ONLY derivation of governance status for the
 * internal Governance Dashboard. The server (`Scs\Derivation::deriveGovernance`) is the canonical
 * authority; this client model presents that state and is strictly READ-ONLY: it never mutates
 * constitutional state (Constitutional Observability Principles). It is not a production monitoring
 * console — it is a constitutional governance workspace.
 */

export interface GovernanceModel {
  reviewQueue: { open: number; closed: number; openGates: string[] };
  approvalQueue: { deliverablesInReview: number; items: string[] };
  deliverables: { total: number; inReview: number; accepted: number };
  decisions: { total: number; approved: number };
  directives: { total: number; active: number; closed: number };
  operationalHistory: { entries: number };
  constitutionalHealth: { pendingApprovals: number; openReviewGates: number; healthy: boolean };
  readOnly: true;
}

const re = (s: string | undefined, rx: RegExp) => rx.test(s ?? '');

export function deriveGovernance(input: {
  gates?: Gate[];
  deliverables?: Deliverable[];
  decisions?: Decision[];
  assignmentDirectives?: AssignmentDirective[];
  operationalHistory?: OperationalHistoryEntry[];
}): GovernanceModel {
  const { gates = [], deliverables = [], decisions = [], assignmentDirectives = [], operationalHistory = [] } = input;

  const gatesOpen = gates.filter((g) => re(g.status, /open|pending/i));
  const gatesClosed = gates.filter((g) => re(g.status, /closed|approved/i));
  const dlvInReview = deliverables.filter((d) => re(d.status, /in review|proposed|pending/i));
  const dlvAccepted = deliverables.filter((d) => re(d.status, /accepted/i));
  const decApproved = decisions.filter((d) => d.authorityStatus === 'approved' || re(d.status, /approved/i));
  const dirActive = assignmentDirectives.filter((d) => re(d.status, /active/i));
  const dirClosed = assignmentDirectives.filter((d) => re(d.status, /closed/i));

  return {
    reviewQueue: { open: gatesOpen.length, closed: gatesClosed.length, openGates: gatesOpen.map((g) => g.name) },
    approvalQueue: { deliverablesInReview: dlvInReview.length, items: dlvInReview.map((d) => d.deliverableId) },
    deliverables: { total: deliverables.length, inReview: dlvInReview.length, accepted: dlvAccepted.length },
    decisions: { total: decisions.length, approved: decApproved.length },
    directives: { total: assignmentDirectives.length, active: dirActive.length, closed: dirClosed.length },
    operationalHistory: { entries: operationalHistory.length },
    constitutionalHealth: {
      pendingApprovals: dlvInReview.length,
      openReviewGates: gatesOpen.length,
      healthy: true,
    },
    readOnly: true,
  };
}
