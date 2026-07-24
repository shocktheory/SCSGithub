import type { WorkspaceBackup, CollectionName } from '../storage/StorageAdapter';
import { SCHEMA_VERSION } from '../domain/schemaVersion';
import type {
  OSSystem,
  Product,
  Publication,
  PublicationPhase,
  Gate,
  AICollaborator,
  Assignment,
  Artifact,
  CanonicalStatement,
  NextAction,
} from '../domain/entities';

/**
 * SEED / DEMO DATA — clearly labeled (isSeed: true).
 *
 * Contains ONLY what the SCS specification states. Nothing is invented to look
 * complete (Non-Negotiable Rule #11); unknown values are left empty and remain
 * visibly unresolved. Authority states reflect reality — mostly `reported`/
 * `proposed`, never `approved` unless the spec explicitly states approval.
 * The Product Owner reviews and corrects this data. See docs/seed-data.md.
 */

const osSystems: OSSystem[] = [
  {
    id: 'os-sapdos',
    name: 'ShockTheory AI Product Development Operating System',
    acronym: 'SAPDOS',
    purpose: 'Operating system for AI-driven product development within ShockTheory OS.',
    authority: 'ShockTheory OS',
    version: '—',
    status: 'Active',
    owner: 'ShockTheory OS',
    dependencies: [],
    relatedProducts: ['prod-kidlytics', 'prod-civicai'],
    changeHistory: [],
    authorityStatus: 'reported',
    confidence: 'medium',
    notes: 'Seed record — details to be confirmed by Product Owner.',
  },
  {
    id: 'os-stacl',
    name: 'ShockTheory AI Command Language',
    acronym: 'STACL',
    purpose: 'Command language governing AI collaboration and sync codes across ShockTheory OS.',
    authority: 'ShockTheory OS',
    version: '—',
    status: 'Active',
    owner: 'ShockTheory OS',
    dependencies: [],
    relatedProducts: [],
    changeHistory: [],
    authorityStatus: 'reported',
    confidence: 'medium',
    notes: 'Owns the adopted sync codes (ST-SYNC, ST-LOCK, ST-BENCHMARK, ST-REVIEW, ST-DIVERGENCE, ST-OS).',
  },
  {
    id: 'os-stp',
    name: 'ShockTheory Publication System',
    acronym: 'STP',
    purpose: 'Governs the three official publication families and their phase-gated progress.',
    authority: 'ShockTheory OS',
    version: '—',
    status: 'Active',
    owner: 'ShockTheory OS',
    dependencies: [],
    relatedProducts: [],
    changeHistory: [],
    authorityStatus: 'reported',
    confidence: 'medium',
  },
  {
    id: 'os-sos',
    name: '#SOS — Chief of Staff and Constitutional Guardian',
    acronym: '#SOS',
    purpose: 'Advises and governs within ShockTheory OS. Does not approve on the Product Owner’s behalf.',
    authority: 'ShockTheory OS',
    version: '—',
    status: 'Active',
    owner: 'ShockTheory OS',
    dependencies: [],
    relatedProducts: [],
    changeHistory: [],
    authorityStatus: 'reported',
    confidence: 'medium',
  },
  {
    id: 'os-scs',
    name: 'ShockTheory Constitutional System',
    acronym: 'SCS',
    purpose: 'The living constitutional command, awareness, and artifact-navigation system for ShockTheory OS.',
    authority: 'ShockTheory OS',
    version: 'v0.1 MVP',
    status: 'Initial Product Build',
    owner: 'Sonja Ross',
    dependencies: ['os-sapdos', 'os-stacl', 'os-stp', 'os-sos'],
    relatedProducts: ['prod-kidlytics', 'prod-civicai'],
    changeHistory: ['Phase 0 architecture approved', 'Phase 1 functional shell in progress'],
    authorityStatus: 'reported',
    confidence: 'high',
  },
];

const products: Product[] = [
  {
    id: 'prod-kidlytics',
    name: 'Kidlytics',
    ecosystem: 'ShockTheory',
    purpose: 'Kidlytics product within the ShockTheory ecosystem.',
    lifecycleStage: 'Active development',
    status: 'Active',
    owner: 'Sonja Ross',
    currentBenchmark: undefined,
    authorityStatus: 'reported',
    confidence: 'medium',
    notes: 'Seed record — purpose and stage to be confirmed.',
  },
  {
    id: 'prod-civicai',
    name: 'CivicAI',
    ecosystem: 'ShockTheory',
    purpose: 'CivicAI product within the ShockTheory ecosystem.',
    lifecycleStage: 'Early',
    status: 'Active',
    owner: 'Sonja Ross',
    authorityStatus: 'reported',
    confidence: 'low',
    notes: 'Seed record — details to be confirmed.',
  },
];

const publications: Publication[] = [
  {
    id: 'pub-cue',
    family: 'experience',
    volume: '01',
    title: 'Cue',
    product: 'prod-kidlytics',
    purpose: 'Kidlytics Experience Playbook · Volume 01 · Cue.',
    status: 'In progress',
    version: '—',
    currentPhase: 'phase-cue-5',
    currentGate: 'gate-cue-5',
    ownerAI: 'ai-claude',
    canonicalUsed: [],
    confidentiality: 'Confidential - Internal Use Only',
    authorityStatus: 'proposed',
    confidence: 'high',
    notes: 'Phase 5 authorized after Phase 4 approval.',
  },
  {
    id: 'pub-chipn',
    family: 'workflow',
    volume: '01',
    title: 'Chip’n',
    product: 'prod-kidlytics',
    purpose: 'Kidlytics Workflow Playbook · Volume 01 · Chip’n.',
    status: 'Discovery — decisions pending',
    version: '—',
    currentPhase: 'phase-chipn-1',
    currentGate: undefined,
    canonicalUsed: [],
    confidentiality: 'Confidential - Internal Use Only',
    authorityStatus: 'proposed',
    confidence: 'high',
    notes: 'Discovery and lifecycle decisions pending.',
  },
  {
    id: 'pub-approval',
    family: 'component',
    volume: '01',
    title: 'Approval',
    product: 'prod-kidlytics',
    purpose: 'Kidlytics Component Playbook · Volume 01 · Approval.',
    status: 'Planned — not yet started',
    version: '—',
    canonicalUsed: [],
    confidentiality: 'Confidential - Internal Use Only',
    authorityStatus: 'reported',
    confidence: 'high',
    notes: 'Planned, not yet started.',
  },
];

// Cue is at Phase 5, with Phases 1–4 approved. Faithful to “Phase 5 authorized after
// Phase 4 approval.” Phase labels follow the suggested STP sequence.
const cuePhaseNames = ['Discovery', 'Foundation', 'Direction', 'Core', 'Complexity', 'Final Assembly'];
const publicationPhases: PublicationPhase[] = [
  ...cuePhaseNames.map((name, i): PublicationPhase => ({
    id: `phase-cue-${i + 1}`,
    publication: 'pub-cue',
    name,
    order: i + 1,
    status: i + 1 < 5 ? 'Approved' : i + 1 === 5 ? 'In progress' : 'Pending',
    authorityStatus: i + 1 < 5 ? 'approved' : 'proposed',
    confidence: 'medium',
  })),
  {
    id: 'phase-chipn-1',
    publication: 'pub-chipn',
    name: 'Discovery',
    order: 1,
    status: 'In progress — decisions pending',
    authorityStatus: 'proposed',
    confidence: 'medium',
  },
];

const gates: Gate[] = [
  {
    id: 'gate-cue-4',
    publication: 'pub-cue',
    phase: 'phase-cue-4',
    name: 'Phase 4 approval',
    requiresOwnerApproval: true,
    status: 'Approved',
    authorityStatus: 'approved',
    confidence: 'high',
  },
  {
    id: 'gate-cue-5',
    publication: 'pub-cue',
    phase: 'phase-cue-5',
    name: 'Phase 5 gate',
    requiresOwnerApproval: true,
    status: 'Open',
    authorityStatus: 'proposed',
    confidence: 'medium',
  },
];

const aiCollaborators: AICollaborator[] = [
  {
    id: 'ai-sos',
    name: '#SOS',
    role: 'Chief of Staff and Constitutional Guardian operating within ShockTheory OS.',
    openQuestions: [],
    conflictsDetected: [],
    waitingState: 'Governing / advising',
    authorityStatus: 'reported',
    confidence: 'high',
  },
  {
    id: 'ai-chatgpt',
    name: 'ChatGPT',
    role: 'Product authority support, architecture, documentation, and review.',
    openQuestions: [],
    conflictsDetected: [],
    authorityStatus: 'reported',
    confidence: 'medium',
  },
  {
    id: 'ai-claude',
    name: 'Claude',
    role: 'Publication design, product writing, documentation, and assigned code projects.',
    assignedProduct: 'prod-kidlytics',
    currentTask: 'SCS build — Phase 1 functional shell.',
    waitingState: 'Working',
    openQuestions: [],
    conflictsDetected: [],
    authorityStatus: 'reported',
    confidence: 'high',
  },
  {
    id: 'ai-codex',
    name: 'Codex',
    role: 'Software engineering, repositories, implementation, testing, and deployment.',
    openQuestions: [],
    conflictsDetected: [],
    authorityStatus: 'reported',
    confidence: 'medium',
  },
  {
    id: 'ai-lovable',
    name: 'Lovable',
    role: 'Interactive product and application prototyping where assigned.',
    openQuestions: [],
    conflictsDetected: [],
    authorityStatus: 'reported',
    confidence: 'medium',
  },
];

const assignments: Assignment[] = [
  {
    id: 'assign-claude-scs',
    collaborator: 'ai-claude',
    product: 'prod-kidlytics',
    task: 'SCS build — Phase 1 functional shell.',
    waitingState: 'Working',
    expectedOutput: 'Functional shell for Product Owner review.',
    authorityStatus: 'reported',
    confidence: 'high',
  },
];

const artifacts: Artifact[] = [
  {
    id: 'art-drive',
    name: 'SCS — Google Drive folder',
    type: 'Folder',
    area: 'SCS',
    version: '—',
    storageProvider: 'google-drive',
    openLink:
      'https://drive.google.com/drive/folders/1-6YATDDHFaZ_Ema3v7_UgqYW9LQPZ9Pe?usp=drive_link',
    linkHealth: 'unverified',
    confidentiality: 'Confidential - Internal Use Only',
    authorityStatus: 'reported',
    confidence: 'high',
  },
  {
    id: 'art-github',
    name: 'SCS — GitHub repository',
    type: 'Repository',
    area: 'SCS',
    version: '—',
    storageProvider: 'github',
    repoURL: 'https://github.com/shocktheory/SCSGithub',
    linkHealth: 'ok',
    confidentiality: 'Confidential - Internal Use Only',
    authorityStatus: 'verified',
    confidence: 'high',
  },
  {
    id: 'art-production',
    name: 'ShockTheory OS — production site',
    type: 'Production URL',
    area: 'SCS',
    version: '—',
    storageProvider: 'production',
    productionURL: 'https://shocktheoryos.com',
    linkHealth: 'unverified',
    confidentiality: 'Confidential - Internal Use Only',
    authorityStatus: 'reported',
    confidence: 'high',
  },
];

// Class I canonical statements are named in the spec, but their exact wording is
// NOT provided here — so it is left blank rather than invented (Rule #11).
const canonicalStatements: CanonicalStatement[] = [
  {
    id: 'canon-creed',
    statement: '',
    classification: 'I',
    stableName: 'The Creed',
    reclassificationHistory: [],
    authorityStatus: 'reported',
    confidence: 'low',
    notes: 'Canonical wording to be entered by Product Owner — not invented.',
  },
  {
    id: 'canon-promise',
    statement: '',
    classification: 'I',
    stableName: 'The Promise',
    reclassificationHistory: [],
    authorityStatus: 'reported',
    confidence: 'low',
    notes: 'Canonical wording to be entered by Product Owner — not invented.',
  },
  {
    id: 'canon-approval-boundary',
    statement: '',
    classification: 'I',
    stableName: 'The Approval Boundary',
    reclassificationHistory: [],
    authorityStatus: 'reported',
    confidence: 'low',
    notes: 'Canonical wording to be entered by Product Owner — not invented.',
  },
];

const nextActions: NextAction[] = [
  {
    id: 'next-chipn',
    recommendation: 'Resolve the Chip’n Workflow Playbook discovery and lifecycle decisions.',
    why: 'Chip’n is blocked in Discovery pending these decisions; resolving them unblocks its next phase.',
    affectedScope: 'pub-chipn',
    requiresOwnerApproval: true,
    authorityStatus: 'proposed',
    confidence: 'medium',
    notes: 'Seed recommendation — confirm or replace.',
  },
];

const empty: CollectionName[] = [
  'decisions',
  'canonicalConcepts',
  'benchmarks',
  'risks',
  'updates',
  'reviewItems',
  'relationships',
];

export const seedWorkspace: WorkspaceBackup = {
  schemaVersion: SCHEMA_VERSION,
  exportedAt: '2026-07-24T00:00:00.000Z',
  isSeed: true,
  collections: {
    osSystems,
    products,
    publications,
    publicationPhases,
    gates,
    decisions: [],
    canonicalStatements,
    canonicalConcepts: [],
    aiCollaborators,
    assignments,
    benchmarks: [],
    risks: [],
    updates: [],
    artifacts,
    reviewItems: [],
    nextActions,
    relationships: [],
    ...Object.fromEntries(empty.map((k) => [k, []])),
  } as WorkspaceBackup['collections'],
};
