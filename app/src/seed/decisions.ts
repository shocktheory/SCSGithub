import type { Decision } from '../domain/entities';

/**
 * INTERIM CONSTITUTIONAL DECISION SOURCE (ST-LOCK, 2026-07-24).
 *
 * These are REAL governed Product Owner rulings — NOT demonstration data
 * (demonstration: false). They are version-controlled here and mirrored to
 * /constitution/decisions.json + /constitution/DECISION_REGISTER.md. The future
 * Phase 2 Decision Register must ingest these records unchanged.
 *
 * Where a ruling's full rationale or consequences were not specified in the
 * governing directive, the text says so rather than inventing detail.
 */
const D = (d: Omit<Decision, 'authorityStatus' | 'demonstration'>): Decision => ({
  ...d,
  approvingAuthority: d.approvingAuthority ?? 'Sonja (Product Owner)',
  sourceDirective: d.sourceDirective ?? 'ST-LOCK — Agent Naming, SCS Governance Corrections (2026-07-24)',
  authorityStatus: 'approved',
  demonstration: false,
  confidence: d.confidence ?? 'high',
});

export const interimDecisions: Decision[] = [
  D({
    id: 'dec-0001', decisionId: 'DEC-0001', title: 'ShockBoard supersession',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved',
    date: '2026-07-24', question: 'Is ShockBoard superseded?',
    ruling: 'ShockBoard is superseded.',
    rationale: 'Recorded as an existing Product Owner ruling. Superseding artifact and full rationale pending Product Owner confirmation.',
    affectedArtifacts: ['ShockBoard'],
    dependencies: [], supersededAssumptions: 'Any prior reliance on ShockBoard as an active surface.',
    implementationConsequences: 'References to ShockBoard must be treated as superseded pending confirmation of the replacement.',
    relatedDecisions: ['dec-0003'], reviewTrigger: 'Product Owner confirmation of superseding artifact.',
    confidence: 'medium',
  }),
  D({
    id: 'dec-0002', decisionId: 'DEC-0002', title: 'SCS naming and scope',
    area: 'SCS', decisionClass: 'Platform', status: 'Approved',
    date: '2026-07-24', question: 'What is SCS and what is its scope?',
    ruling: 'SCS is the ShockTheory Constitutional System product — the governed index, awareness, and artifact-navigation system for ShockTheory OS. It displays authority; it does not manufacture it.',
    rationale: 'Establishes the product identity and boundary so SCS is not confused with an agent or a competing source of truth.',
    affectedArtifacts: ['SCS'],
    dependencies: [], supersededAssumptions: 'Treating SCS as a dashboard or as an authority-bearing system.',
    implementationConsequences: 'All copy distinguishes the SCS product from the #SCS build agent.',
    relatedDecisions: ['dec-0007'],
  }),
  D({
    id: 'dec-0003', decisionId: 'DEC-0003', title: 'ProductOS under constitutional review',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved',
    date: '2026-07-24', question: 'What is the governance state of ProductOS?',
    ruling: 'ProductOS is placed under constitutional review.',
    rationale: 'Recorded as an existing Product Owner ruling. Scope and outcome of the review pending Product Owner confirmation.',
    affectedArtifacts: ['ProductOS'],
    dependencies: [], supersededAssumptions: 'Treating ProductOS as settled or authoritative during review.',
    implementationConsequences: 'ProductOS carries a Constitutional Review governance state until the review concludes.',
    relatedDecisions: ['dec-0001'], confidence: 'medium',
  }),
  D({
    id: 'dec-0004', decisionId: 'DEC-0004', title: 'SCS Home versus Executive Snapshot',
    area: 'SCS', decisionClass: 'Design', status: 'Approved',
    date: '2026-07-24', question: 'How are SCS Home and Executive Snapshot distinguished?',
    ruling: 'SCS Home is the interactive constitutional command center. Executive Snapshot is the concise, generated operational briefing produced from SCS state.',
    rationale: 'Resolves an architectural conflation before further screens are built.',
    affectedArtifacts: ['SCS Home', 'Executive Snapshot'],
    dependencies: ['dec-0002'], supersededAssumptions: 'The single-screen “Executive Snapshot” performing the role of Home.',
    implementationConsequences: 'Home and the briefing are separate routes; the briefing stays concise.',
    relatedDecisions: ['dec-0002'],
  }),
  D({
    id: 'dec-0005', decisionId: 'DEC-0005', title: 'Coupled SAPDOS–Kidlytics workstreams',
    area: 'Methodology', decisionClass: 'Methodology', status: 'Approved',
    date: '2026-07-24', question: 'How do SAPDOS and Kidlytics workstreams relate?',
    ruling: 'SAPDOS and Kidlytics workstreams are coupled.',
    rationale: 'Recorded as an existing Product Owner ruling. Coupling mechanics pending Product Owner confirmation.',
    affectedArtifacts: ['SAPDOS', 'Kidlytics'],
    dependencies: [], supersededAssumptions: 'Treating SAPDOS methodology and Kidlytics product work as independent.',
    implementationConsequences: 'Methodology maturity of SAPDOS artifacts is validated through Kidlytics first.',
    relatedDecisions: ['dec-0006'], confidence: 'medium',
  }),
  D({
    id: 'dec-0006', decisionId: 'DEC-0006', title: 'Methodology Maturity',
    area: 'Methodology', decisionClass: 'Methodology', status: 'Approved',
    date: '2026-07-24', question: 'How is the maturity of reusable SAPDOS methodology tracked?',
    ruling: 'Methodology Maturity is an independent field for reusable SAPDOS artifacts: Draft, Validated in Kidlytics, Validated in Additional Products, Reusable Standard, Constitutional Standard. It is never merged with authority, governance status, work state, product maturity, or publication gate.',
    rationale: 'Keeps methodology reusability distinct from other record dimensions.',
    affectedArtifacts: ['SAPDOS'],
    dependencies: ['dec-0005'], supersededAssumptions: 'Conflating methodology maturity with product or publication maturity.',
    implementationConsequences: 'A distinct Methodology Maturity dimension is added to the data model and UI.',
    relatedDecisions: ['dec-0005'],
  }),
  D({
    id: 'dec-0007', decisionId: 'DEC-0007', title: '#SOS and #SCS authority boundaries',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved',
    date: '2026-07-24', question: 'What authority do #SOS and #SCS hold?',
    ruling: 'No agent may approve its own proposals. #SOS protects and advises Product Owner authority but does not exercise it. #SCS designs and builds SCS but is not SCS and holds no constitutional authority.',
    rationale: 'Prevents any agent from manufacturing constitutional authority.',
    affectedArtifacts: ['#SOS', '#SCS', 'SCS'],
    dependencies: ['dec-0002'], supersededAssumptions: 'Any implication that an AI agent can approve constitutional decisions.',
    implementationConsequences: 'Authority scope is shown per agent; AI recommends, never approves.',
    relatedDecisions: ['dec-0002', 'dec-0008'],
  }),
  D({
    id: 'dec-0009', decisionId: 'DEC-0009', title: '#CKP naming and authority boundary',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved',
    date: '2026-07-24', question: 'What is #CKP, and what authority does it hold?',
    ruling: '#CKP (Claude Kidlytics Prototype) performs prototype design, implementation, testing, synchronization, and repository delivery for Kidlytics. It does not replace Product Owner approval and holds no constitutional authority.',
    rationale: 'Names the Kidlytics prototype agent and bounds its authority.',
    affectedArtifacts: ['#CKP', 'Kidlytics'],
    dependencies: ['dec-0007'], supersededAssumptions: 'Undefined naming for the Kidlytics prototype agent.',
    implementationConsequences: 'The agent register lists #CKP with an explicit authority boundary.',
    relatedDecisions: ['dec-0007', 'dec-0008'],
  }),
  D({
    id: 'dec-0010', decisionId: 'DEC-0010', title: 'Product Owner authority',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved',
    date: '2026-07-24', question: 'Where does final approval authority rest?',
    ruling: 'Sonja is the Product Owner and holds final approval authority for all constitutional decisions. No agent may approve on the Product Owner’s behalf or approve its own proposals.',
    rationale: 'Anchors the authority lifecycle: authority is displayed by SCS, exercised only by the Product Owner.',
    affectedArtifacts: ['Sonja', 'SCS'],
    dependencies: [], supersededAssumptions: 'Any implication that authority can be exercised by an agent.',
    implementationConsequences: 'The Product Owner is shown separately from agents; agents recommend, never approve.',
    relatedDecisions: ['dec-0007'],
  }),
  D({
    id: 'dec-0008', decisionId: 'DEC-0008', title: '#CKL and #CIA naming and authority boundaries',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved',
    date: '2026-07-24', question: 'What are #CKL and #CIA, and what authority do they hold?',
    ruling: '#CKL (ChatGPT Kidlytics) provides Product Owner advisory support, product architecture, specification drafting, product challenge, review, and cross-artifact reconciliation for Kidlytics but does not replace Product Owner approval. #CIA (Claude Kidlytics Invitation AI Agent) evaluates and synthesizes the Kidlytics invitation experience but may not change architecture, canonical language, or product decisions.',
    rationale: 'Names the Kidlytics advisory and invitation agents and bounds their authority.',
    affectedArtifacts: ['#CKL', '#CIA', 'Kidlytics'],
    dependencies: ['dec-0007'], supersededAssumptions: 'Undefined naming for the Kidlytics advisory and invitation agents.',
    implementationConsequences: 'The agent register lists #CKL and #CIA with explicit authority boundaries.',
    relatedDecisions: ['dec-0007'],
  }),
];
