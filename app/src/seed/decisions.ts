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
const D = (d: Omit<Decision, 'authorityStatus' | 'demonstration'>): Decision => {
  const n = parseInt(d.id.replace('dec-', ''), 10);
  const nnn = String(n).padStart(3, '0');
  return {
    ...d,
    // Canonical constitutional identifier (Phase 2). Historical interim ID preserved.
    decisionId: `ST-DEC-2026-${nnn}`,
    historicalId: n <= 10 ? `DEC-${String(n).padStart(4, '0')}` : undefined,
    queue: d.queue ?? (/pending Product Owner confirmation/i.test(d.rationale ?? '') ? 'documentation' : 'owner-action'),
    approvingAuthority: d.approvingAuthority ?? 'Sonja (Product Owner)',
    sourceDirective: d.sourceDirective ?? 'ST-LOCK — Agent Naming, SCS Governance Corrections (2026-07-24)',
    // Decision Status (status) and Implementation Status are modeled independently.
    implementationStatus: d.implementationStatus ?? 'Reference only',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: d.confidence ?? 'high',
  };
};

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
    rationale: 'Recorded as an existing Product Owner ruling. RECONCILED (Product Owner directive, 2026-07-25): the review resolves — ProductOS is a legacy working name / predecessor concept, NOT a separate active product stream. Its relevant approved operating-system functions are now represented by ShockTheory OS and, where implemented in software, by the SCS Platform.',
    affectedArtifacts: ['ProductOS (legacy)', 'ShockTheory OS', 'SCS Platform'],
    dependencies: [], supersededAssumptions: 'Treating ProductOS as a competing current product or an active fourth product stream.',
    implementationConsequences: 'ProductOS no longer carries an active-review state as a competing product. Legacy references are preserved for traceability and marked historical/superseded; current portfolio surfaces use ShockTheory OS and SCS Platform. Original ruling text is retained unchanged.',
    reviewTrigger: 'Reconciled by the Product Owner Product Continuation & Architecture Directive (2026-07-25).',
    relatedDecisions: ['dec-0001', 'dec-scs-phase4'], confidence: 'high',
    notes: 'History preserved: the original ruling is unchanged. This reconciliation records the resolved outcome without rewriting the historical record or inventing broader constitutional meaning.',
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

  // ---- Phase 2 constitutional baseline (ST-DEC-2026-011 … 016) ----
  D({
    id: 'dec-0011', decisionId: 'ST-DEC-2026-011', title: 'Separation of constitutional objects',
    area: 'Operating System', decisionClass: 'Architecture', status: 'Approved', date: '2026-07-24',
    sourceDirective: 'Phase 2 — Constitutional Governance Implementation (2026-07-24)',
    authoritativeTextByProductOwner: true, implementationStatus: 'Verified and Accepted',
    question: 'How are Decision Records, Standing Directives, and Assignment Directives related?',
    ruling: 'Decision Records, Standing Directives, and Assignment Directives are independent constitutional objects. Each has its own identifier, lifecycle, interface, and traceability. Decision Records may not substitute for Standing Directives; Standing Directives may not substitute for Assignment Directives.',
    rationale: 'Prevents conflation of governance objects and enables faithful traceability.',
    affectedArtifacts: ['Decision Register', 'Standing Directive Library', 'Assignment Directives'],
    dependencies: [], implementationConsequences: 'SCS implements three separate object types and workspaces.',
    relatedDecisions: ['dec-0012', 'dec-0013', 'dec-0014'], queue: 'owner-action',
  }),
  D({
    id: 'dec-0012', decisionId: 'ST-DEC-2026-012', title: 'Constitutional Decision Register',
    area: 'SCS', decisionClass: 'Platform', status: 'Approved', date: '2026-07-24',
    sourceDirective: 'Phase 2 — Constitutional Governance Implementation (2026-07-24)',
    authoritativeTextByProductOwner: true, implementationStatus: 'Verified and Accepted',
    question: 'What is the authoritative interface for constitutional decisions?',
    ruling: 'The Constitutional Decision Register is the authoritative interface for constitutional decisions, using the approved constitutional baseline. Interim identifiers are replaced by canonical ST-DEC-2026-### identifiers with preserved historical traceability.',
    rationale: 'Establishes one authoritative decision surface.',
    affectedArtifacts: ['Decision Register'], dependencies: ['dec-0011'],
    implementationConsequences: 'Decisions carry canonical IDs; the Register is the authoritative view.',
    relatedDecisions: ['dec-0011'], queue: 'owner-action',
  }),
  D({
    id: 'dec-0013', decisionId: 'ST-DEC-2026-013', title: 'Standing Directive Library',
    area: 'Operating System', decisionClass: 'Operating System', status: 'Approved', date: '2026-07-24',
    sourceDirective: 'Phase 2 — Constitutional Governance Implementation (2026-07-24)',
    authoritativeTextByProductOwner: true, implementationStatus: 'Verified and Accepted',
    question: 'How are durable agent role authorities governed?',
    ruling: 'Each governed agent exposes a Standing Directive with its current directive, version, governing authority, and superseded history, maintained in the Standing Directive Library.',
    rationale: 'Durable role authority is distinct from specific assignments.',
    affectedArtifacts: ['Standing Directive Library'], dependencies: ['dec-0011'],
    implementationConsequences: 'A Standing Directive object and Library workspace are implemented.',
    relatedDecisions: ['dec-0011'], queue: 'owner-action',
  }),
  D({
    id: 'dec-0014', decisionId: 'ST-DEC-2026-014', title: 'Assignment Directive management',
    area: 'Operating System', decisionClass: 'Workflow', status: 'Approved', date: '2026-07-24',
    sourceDirective: 'Phase 2 — Constitutional Governance Implementation (2026-07-24)',
    authoritativeTextByProductOwner: true, implementationStatus: 'Verified and Accepted',
    question: 'How is specific assigned work governed and traced?',
    ruling: 'Assignment Directives are managed with the approved lifecycle and link to a Standing Directive, Deliverables, a Review Gate, and a Product Owner Decision.',
    rationale: 'Assigned work must be individually governed and traceable to authority.',
    affectedArtifacts: ['Assignment Directives'], dependencies: ['dec-0011', 'dec-0013'],
    implementationConsequences: 'An Assignment Directive object and workspace are implemented.',
    relatedDecisions: ['dec-0013'], queue: 'owner-action',
  }),
  D({
    id: 'dec-0015', decisionId: 'ST-DEC-2026-015', title: 'Artifact Registry, Deliverables, Review Gates, and Operational History',
    area: 'SCS', decisionClass: 'Platform', status: 'Approved', date: '2026-07-24',
    sourceDirective: 'Phase 2 — Constitutional Governance Implementation (2026-07-24)',
    authoritativeTextByProductOwner: true, implementationStatus: 'Verified and Accepted',
    question: 'How are artifacts, deliverables, review gates, and history governed?',
    ruling: 'The Artifact Registry, Deliverables, Review Gates, and Operational History are implemented as independent constitutional objects. Operational History is evidence, not performance scoring.',
    rationale: 'Each governance object has its own workspace and traceability.',
    affectedArtifacts: ['Artifact Registry', 'Deliverables', 'Review Gates', 'Operational History'],
    dependencies: ['dec-0011'], implementationConsequences: 'Four object workspaces are implemented from the approved baseline.',
    relatedDecisions: ['dec-0011'], queue: 'owner-action',
  }),
  D({
    id: 'dec-0016', decisionId: 'ST-DEC-2026-016', title: 'Canonical traceability, version separation, and architecture freeze',
    area: 'Operating System', decisionClass: 'Architecture', status: 'Approved', date: '2026-07-24',
    sourceDirective: 'Phase 2 — Constitutional Governance Implementation (2026-07-24)',
    authoritativeTextByProductOwner: true, implementationStatus: 'Verified and Accepted',
    question: 'What is the canonical traceability chain and what is frozen?',
    ruling: 'The canonical chain is Agent → Standing Directive → Assignment Directive → Artifact → Deliverable → Review Gate → Product Owner Decision → Operational History, with bidirectional navigation. ShockTheory OS Constitution v1.0 Baseline and SCS Functional Demonstration Phase 1 are independent version systems. Capability Registry and Organizational Maturity remain reserved, deferred, and roadmap-only. The Constitutional Architecture Freeze is governing: no new entities, layers, schemas, or concepts.',
    rationale: 'Locks the approved architecture and prevents constitutional expansion.',
    affectedArtifacts: ['SCS'], dependencies: ['dec-0011', 'dec-0012', 'dec-0013', 'dec-0014', 'dec-0015'],
    implementationConsequences: 'Traceability, version display, and reserved-concept handling are implemented; no expansion.',
    relatedDecisions: ['dec-0011'], queue: 'owner-action',
  }),
  // ST-DEC-2026-017 removed — it was originated by #SCS, not authorized by the
  // Product Owner. AGENT-005 activation authority now references the approved
  // Product Owner directive, the acceptance record, and Operational History
  // (ST-OPH-2026-004 / -005), not a self-created decision.

  // AGENT-006/#CKL-R activation authority — records the Product Owner's EXPRESS ruling
  // (2026-07-25). This is a real, Product-Owner-authorized decision (authorityStatus
  // 'approved'), not a self-originated one. The ruling did not assign a canonical ST-DEC
  // number, so the canonical identifier remains Product-Owner-pending; #SCS does not mint it.
  {
    id: 'dec-cklr-activation',
    decisionId: 'Pending Product Owner-authorized ST-DEC identifier',
    title: 'AGENT-006/#CKL-R onboarding & activation authority',
    area: 'Agent Governance', decisionClass: 'Activation', status: 'Approved', date: '2026-07-25',
    approvingAuthority: 'Sonja (Product Owner)',
    sourceDirective: 'Product Owner Acceptance, Constitutional Approval, and Implementation Directive — "Accept Phase 3 and Constitutionally Onboard AGENT-006/#CKL-R" (2026-07-25)',
    question: 'Are AGENT-006/#CKL-R onboarding records approved and is #CKL-R activated?',
    ruling: 'The Product Owner approves AGENT-006 (#CKL-R, Kidlytics Competitive Research Agent), Standing Directive ST-SD-006 (Current), Team Membership TM-009 (Active in TEAM-001), and the activation event ST-OPH-2026-012, and expressly activates #CKL-R to Available — Awaiting Assignment. No competitive-research Assignment Directive is approved; no research may begin.',
    rationale: 'Records the Product Owner exercise of authority already held under the accepted Constitution. Does not grant new authority.',
    affectedArtifacts: ['AGENT-006', 'ST-SD-006', 'TM-009', 'ST-OPH-2026-012'],
    implementationConsequences: 'AGENT-006/#CKL-R derives as Available — Awaiting Assignment. The proposed competitive-research Assignment Directive remains nonauthoritative (Proposed — Not Active).',
    implementationStatus: 'Verified and Accepted',
    authoritativeTextByProductOwner: true,
    queue: 'owner-action',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: 'high',
    notes: 'Canonical ST-DEC identifier is Product-Owner-pending. The engine requires an approved governing Decision for the Product Owner activation-authority evidence; this record supplies it without originating a canonical number.',
  },

  // #CKL-R competitive-research assignment authority — records the Product Owner ruling (2026-07-25)
  // approving and activating ST-ADR-2026-005. Stable noncanonical working reference; canonical ST-DEC
  // identifier remains Product-Owner-pending. #SCS does not originate a canonical ST-DEC identifier.
  {
    id: 'dec-cklr-research-assignment',
    decisionId: 'Pending Product Owner-authorized ST-DEC identifier',
    title: 'AGENT-006/#CKL-R competitive-research assignment authority (ST-ADR-2026-005)',
    area: 'Agent Governance', decisionClass: 'Assignment', status: 'Approved', date: '2026-07-25',
    approvingAuthority: 'Sonja (Product Owner)',
    sourceDirective: 'Product Owner Assignment Activation Directive — "Approve and Activate #CKL-R Kidlytics Competitive Research" (2026-07-25)',
    question: 'Is #CKL-R\'s competitive-research Assignment Directive approved and active?',
    ruling: 'The Product Owner assigns canonical identifier ST-ADR-2026-005 and approves & activates the Kidlytics Competitive Landscape Research Assignment Directive for AGENT-006/#CKL-R, with deliverable ST-DLV-2026-004 and the Competitive Research Review gate. Findings are advisory evidence and do not automatically modify Kidlytics or authorize implementation. ST-ADR-2026-004 remains reserved and unresolved.',
    rationale: 'Records the Product Owner exercise of authority already held. Assigns the next non-colliding ST-ADR identifier without disturbing the reserved ST-ADR-2026-004.',
    affectedArtifacts: ['ST-ADR-2026-005', 'ST-DLV-2026-004', 'AGENT-006', 'ST-SD-006'],
    implementationConsequences: 'AGENT-006/#CKL-R derives as Working; Active Assignments increases from 0 to 1. The reserved ST-ADR-2026-004 is untouched.',
    implementationStatus: 'Verified and Accepted',
    authoritativeTextByProductOwner: true,
    queue: 'owner-action',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: 'high',
    notes: 'Canonical ST-DEC identifier Product-Owner-pending; not originated by #SCS.',
  },

  // SCS Phase 4 authorization — records the Product Owner Product Continuation & Architecture
  // Directive (2026-07-25). Authorizes Phase 4 architecture PLANNING only. Canonical ST-DEC
  // identifier Product-Owner-pending; #SCS does not originate one.
  {
    id: 'dec-scs-phase4',
    decisionId: 'Pending Product Owner-authorized ST-DEC identifier',
    title: 'SCS product continuation & Phase 4 Production Architecture authorization',
    area: 'SCS', decisionClass: 'Platform', status: 'Approved', date: '2026-07-25',
    approvingAuthority: 'Sonja (Product Owner)',
    sourceDirective: 'Product Owner Product Continuation and Architecture Directive — "Establish the SCS Product Completion Path and Authorize Phase 4 Production Architecture" (2026-07-25)',
    question: 'Is SCS an active platform product and is Phase 4 Production Architecture planning authorized?',
    ruling: 'SCS is confirmed as an active internal software platform developed in parallel with Kidlytics (primary commercial). The Phase 1 functional-demonstration scope is complete and accepted for its demonstration scope (production readiness not established). #SCS is authorized to prepare the Phase 4 SCS Production Architecture & Authorization Package (ST-DLV-2026-005) for the SCS Production Architecture Review gate. Production backend implementation, migration, authentication implementation, integrations, hosting deployment, and go-live are NOT authorized and require acceptance of the architecture plus a separate production-implementation authorization.',
    rationale: 'Confirms parallel product execution; separates constitutional-capability status from software-product maturity; authorizes architecture planning only.',
    affectedArtifacts: ['prod-scs', 'ST-ADR-2026-006 (pending)', 'ST-DLV-2026-005', 'SCS Production Architecture Review'],
    implementationConsequences: 'SCS appears as an active product (prod-scs). The Phase 4 architecture (ST-DLV-2026-005) is accepted as the authoritative production-architecture planning baseline; the Phase 4 assignment is completed & accepted. SCS is architecturally ready for Phase 5, which remains unauthorized pending a separate Product Owner production-implementation directive.',
    implementationStatus: 'Verified and Accepted',
    authoritativeTextByProductOwner: true,
    queue: 'owner-action',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: 'high',
    notes: 'Canonical ST-DEC identifier Product-Owner-pending; not originated by #SCS.',
  },

  // SCS Phase 5 authorization — records the Product Owner Production Implementation Authorization
  // Directive (2026-07-25). Narrow: backend foundation & persistence only. Canonical ST-DEC id
  // Product-Owner-pending; #SCS does not originate one.
  {
    id: 'dec-scs-phase5',
    decisionId: 'Pending Product Owner-authorized ST-DEC identifier',
    title: 'SCS Phase 5 — Backend Foundation & Persistence authorization',
    area: 'SCS', decisionClass: 'Platform', status: 'Approved', date: '2026-07-25',
    approvingAuthority: 'Sonja (Product Owner)',
    sourceDirective: 'Product Owner Production Implementation Authorization Directive — "Phase 5 — Backend Foundation & Persistence Authorization" (2026-07-25)',
    question: 'Is the narrow Phase 5 backend foundation & persistence implementation authorized?',
    ruling: 'Authorizes ONLY: backend foundation, governed persistence, MySQL schema, migrations, RemoteAdapter implementation, and parity validation — dev/test with synthetic/demonstration/non-confidential data. Does NOT authorize production authentication, confidential-data hosting, integrations, email, Web Push, deployment, public access, cutover, launch, or OS-CAP-001 implementation. Each remains separately governed.',
    rationale: 'First bounded production-implementation phase; proves the production persistence foundation without changing accepted product/constitutional meaning.',
    affectedArtifacts: ['prod-scs', 'ST-ADR-2026-007 (pending)', 'ST-DLV-2026-006', 'SCS Backend Foundation & Persistence Review'],
    implementationConsequences: 'Phase 5 accepted by the Product Owner (2026-07-25) — runtime-verified. Assignment completed; deliverable ST-DLV-2026-006 accepted; review gate closed. SCS is eligible for Phase 6 authorization (Phase 6 NOT authorized). #SCS remains Pending activation. No production, auth, confidential data, or deployment.',
    implementationStatus: 'Verified and Accepted',
    authoritativeTextByProductOwner: true,
    queue: 'owner-action',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: 'high',
    notes: 'Canonical ST-DEC identifier Product-Owner-pending; not originated by #SCS.',
  },

  // SCS Production Baseline v1.0 authorization — records the Product Owner Baseline Establishment
  // Directive (2026-07-25). Documentation/traceability only. Canonical ST-DEC id Product-Owner-pending.
  {
    id: 'dec-scs-baseline',
    decisionId: 'Pending Product Owner-authorized ST-DEC identifier',
    title: 'SCS Production Baseline v1.0 establishment',
    area: 'SCS', decisionClass: 'Governance', status: 'Approved', date: '2026-07-25',
    approvingAuthority: 'Sonja (Product Owner)',
    sourceDirective: 'Product Owner Baseline Establishment Directive — "SCS Production Baseline v1.0" (2026-07-25)',
    question: 'Is #SCS authorized to establish the authoritative SCS Production Baseline v1.0 snapshot?',
    ruling: 'Authorizes #SCS to produce the authoritative SCS Production Baseline v1.0 — the official snapshot of the accepted state immediately following Phase 5 — for documentation, traceability, and governance. Does NOT authorize Phase 6, implementation changes, refactoring, authentication, authorization, deployment, production hosting, confidential data, new capabilities, or assignment of canonical identifiers.',
    rationale: 'Preserve the accepted architecture, implementation, governance, and product state as the reference point for every future Product Owner review.',
    affectedArtifacts: ['prod-scs', 'ST-DLV-2026-007', 'SCS Production Baseline v1.0'],
    implementationConsequences: 'SCS Production Baseline v1.0 accepted by the Product Owner (2026-07-25) as the authoritative implementation baseline and comparison point for every future review. Baseline assignment closed; ST-DLV-2026-007 accepted; review gate closed. New governance classification "Baseline" recorded (Baseline Identifier Product-Owner-pending). Baseline is immutable except through approved supersession. No implementation or accepted-record change.',
    implementationStatus: 'Verified and Accepted',
    authoritativeTextByProductOwner: true,
    queue: 'owner-action',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: 'high',
    notes: 'Canonical ST-DEC identifier Product-Owner-pending; not originated by #SCS.',
  },

  // SCS Platform Completion Mandate — records the binding Product Owner requirement (2026-07-25)
  // that SCS advance to a complete, secure, operational, production-ready platform via governed
  // phases. Authorizes PLANNING only. Canonical ST-DEC id Product-Owner-pending.
  {
    id: 'dec-scs-completion',
    decisionId: 'Pending Product Owner-authorized ST-DEC identifier',
    title: 'SCS Platform Completion Mandate',
    area: 'SCS', decisionClass: 'Platform', status: 'Approved', date: '2026-07-25',
    approvingAuthority: 'Sonja (Product Owner)',
    sourceDirective: 'Product Owner Platform Completion Mandate — "Complete the SCS Platform" (2026-07-25)',
    question: 'Is SCS required to be completed to a secure, operational, production-ready platform, and is the Completion Program authorized for planning?',
    ruling: 'Binding requirement: the SCS Platform shall be completed — advancing from the accepted Phase 5 baseline through all remaining governed phases needed to become secure, operational, and production-ready for authorized ShockTheory use. SCS shall not remain indefinitely in a baseline/partial state. The SCS Completion Program is authorized for PLANNING only. Phase governance is preserved (no phase self-approves; nothing begins automatically). This does NOT authorize Phase 6 implementation, authentication, deployment, confidential data, integrations, OS-CAP-001, or launch — each requires its own directive.',
    rationale: 'Completion is now required; phase progression remains governed. Technical readiness is not launch authority.',
    affectedArtifacts: ['prod-scs', 'ST-DLV-2026-008', 'SCS Platform Completion Program'],
    implementationConsequences: 'Completion Program planning package produced (SCS_PLATFORM_COMPLETION_PROGRAM.md) and submitted for review. Product record: Completion Program Status = Authorized for Planning. No implementation.',
    implementationStatus: 'In progress',
    authoritativeTextByProductOwner: true,
    queue: 'owner-action',
    authorityStatus: 'approved',
    demonstration: false,
    confidence: 'high',
    notes: 'Canonical ST-DEC identifier Product-Owner-pending; not originated by #SCS.',
  },
];
