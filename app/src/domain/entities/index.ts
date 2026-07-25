/**
 * SCS typed domain model — entity shapes (§24 of the specification).
 *
 * These are Phase-0 TYPE DEFINITIONS only: the contract Phase 1 builds against.
 * Zod runtime validators (schemas/) and persistence are added in later phases.
 * The product model is explicit and relational — never hidden in JSON blobs.
 */
import type { AuthorityState } from '../authority';

export type ID = string;
export type ISODate = string; // YYYY-MM-DD or full ISO timestamp

/** Source-integrity envelope carried by every governed record (§23). */
export interface SourceIntegrity {
  sourceType?: string;
  sourceTitle?: string;
  sourceLocation?: string;
  sourceVersion?: string;
  dateObserved?: ISODate;
  dateRecorded?: ISODate;
  /** The authority-lifecycle state. Every object is in exactly one. */
  authorityStatus: AuthorityState;
  /**
   * Governance overlay — an object may additionally be under active Product Owner
   * constitutional review. This does NOT replace authorityStatus (Revision 02).
   */
  constitutionalReview?: boolean;
  /**
   * True = simulated demonstration record (constitutionally isolated: never real
   * metrics, provenance, approval history, or exported truth). When omitted, the
   * workspace-level demonstration flag applies. Real governed records set false.
   */
  demonstration?: boolean;
  confidence?: 'low' | 'medium' | 'high';
  notes?: string;
}

interface Base extends SourceIntegrity {
  id: ID;
}

export type PublicationFamily = 'experience' | 'workflow' | 'component';
export type SyncCode =
  | 'ST-SYNC'
  | 'ST-LOCK'
  | 'ST-BENCHMARK'
  | 'ST-REVIEW'
  | 'ST-DIVERGENCE'
  | 'ST-OS';
export type CanonicalClass = 'I' | 'II' | 'III';

/**
 * Methodology Maturity — an INDEPENDENT dimension for reusable SAPDOS artifacts.
 * Never merged with authority, governance, work state, product maturity, or gate.
 */
export const METHODOLOGY_MATURITY = [
  'Draft',
  'Validated in Kidlytics',
  'Validated in Additional Products',
  'Reusable Standard',
  'Constitutional Standard',
] as const;
export type MethodologyMaturity = (typeof METHODOLOGY_MATURITY)[number];

export interface OSSystem extends Base {
  name: string;
  acronym: string;
  purpose: string;
  authority: string;
  version: string;
  status: string;
  owner: string;
  effectiveDate?: ISODate;
  governingDoc?: ID;
  dependencies: ID[];
  relatedProducts: ID[];
  lastReview?: ISODate;
  nextReview?: ISODate;
  changeHistory: string[];
  /** Independent Methodology Maturity for reusable SAPDOS artifacts. */
  methodologyMaturity?: MethodologyMaturity;
}

export interface Product extends Base {
  name: string;
  ecosystem: string;
  purpose: string;
  lifecycleStage: string;
  status: string;
  owner: string;
  currentBenchmark?: ID;
}

export interface Publication extends Base {
  family: PublicationFamily;
  volume: string;
  title: string;
  product: ID;
  purpose: string;
  status: string;
  version: string;
  currentPhase?: ID;
  currentGate?: ID;
  ownerAI?: ID;
  canonicalUsed: ID[];
  supersededVersion?: string;
  confidentiality: string;
}

export interface PublicationPhase extends Base {
  publication: ID;
  name: string;
  order: number;
  gateCriteria?: string;
  status: string;
}

export interface Gate extends Base {
  publication?: ID;
  phase?: ID;
  name: string;
  requiresOwnerApproval: boolean;
  status: string;
  decisionRef?: ID;
}

export interface Decision extends Base {
  decisionId: string;
  title: string;
  area: string;
  decisionClass: string;
  question: string;
  status: string;
  ruling?: string; // the decision text
  rationale?: string;
  approvingAuthority?: string; // Product Owner
  date?: ISODate;
  affectedArtifacts: ID[]; // affected products & artifacts (ids or names)
  downstreamImpact?: string;
  supersededDecision?: ID;
  reviewTrigger?: string;
  // Extended for the interim constitutional decision source (ST-LOCK):
  dependencies?: string[];
  supersededAssumptions?: string;
  sourceDirective?: string; // source conversation or directive
  implementationConsequences?: string;
  relatedDecisions?: ID[];
}

export interface CanonicalStatement extends Base {
  statement: string;
  classification: CanonicalClass;
  stableName: string;
  primaryVoice?: string;
  secondaryVoice?: string;
  firstAppearance?: string;
  approvingDecision?: ID;
  scope?: string;
  paraphrasingRule?: string;
  relatedConcept?: ID;
  provenance?: string;
  reclassificationHistory: string[];
}

export interface CanonicalConcept extends Base {
  name: string;
  canonicalDefinition: string;
  scope?: string;
  originatingProduct?: ID;
  authority?: string;
  relatedStatements: ID[];
  relatedPublications: ID[];
}

export interface AICollaborator extends Base {
  name: string;
  role: string;
  assignedProduct?: ID;
  currentPhase?: string;
  currentTask?: string;
  latestOutput?: string;
  waitingState?: string;
  lastSynced?: ISODate;
  sourceRef?: string;
  openQuestions: string[];
  expectedNextAction?: string;
  conflictsDetected: string[];
  /** Constitutional authority scope / boundary. AI recommends; it never approves (Rule #10). */
  authorityScope?: string;
  /** Secondary model-provider metadata (e.g. "Claude (Anthropic)"). Not the agent name. */
  modelProvider?: string;
  /** Constitutional synchronization state — SEPARATE from role (e.g. "Synchronized"). */
  syncState?: string;
  /** Governing reconciliation/decision record this agent's sync traces to. */
  governingRecord?: ID;
  /** Standing constitutional responsibility (distinct from any current assignment). */
  standingResponsibility?: string;
}

export interface Assignment extends Base {
  collaborator: ID;
  product?: ID;
  artifact?: ID;
  phase?: string;
  task: string;
  waitingState?: string;
  expectedOutput?: string;
  /** Governing directive/decision record for this assignment (traceability). */
  directive?: ID;
  /** Review gate the deliverable must pass. */
  reviewGate?: string;
}

export interface Benchmark extends Base {
  name: string;
  artifact?: ID;
  type: string;
  product?: ID;
  version: string;
  dateEstablished?: ISODate;
  establishingDecision?: ID;
  governs: string;
  doesNotGovern?: string;
  replacementBenchmark?: ID;
}

export interface Risk extends Base {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: string;
  evidence?: string;
  whyItMatters: string;
  recommendedCorrection?: string;
  owner?: string;
  relatedDivergence?: ID;
}

export interface Update extends Base {
  code: SyncCode;
  date: ISODate;
  summary: string;
  source?: string;
  scope?: string;
  affectedSystems: ID[];
  downstreamEffects?: string;
  decisionsCreated: ID[];
  documentsUpdated: ID[];
  followUp?: string;
  syncStatus: string;
}

export interface Artifact extends Base {
  name: string;
  type: string;
  area: string;
  version: string;
  owner?: string;
  storageProvider?: 'google-drive' | 'icloud' | 'github' | 'production' | 'other';
  folderPath?: string;
  openLink?: string;
  repoURL?: string;
  localPath?: string;
  productionURL?: string;
  relatedPublication?: ID;
  relatedDecision?: ID;
  relatedBenchmark?: ID;
  relatedAssignment?: ID;
  lastVerified?: ISODate;
  linkHealth?: 'ok' | 'broken' | 'moved' | 'restricted' | 'unverified';
  accessNotes?: string;
  confidentiality: string;
}

export interface ReviewItem extends Base {
  title: string;
  kind: string;
  priority: 'critical' | 'high' | 'normal' | 'informational';
  entityRef: ID;
  deepLink: string;
  status: string;
}

export interface NextAction extends Base {
  recommendation: string;
  why: string;
  affectedScope?: ID;
  requiresOwnerApproval: boolean;
}

export interface Relationship {
  id: ID;
  fromEntity: ID;
  toEntity: ID;
  type: string;
}
