# SCS Data Model

Typed, relational, explicit. The product model is **never** hidden inside unstructured JSON blobs
(§24). Entity type definitions live in `app/src/domain/entities/`; this document is their
specification and the migration contract.

## Cross-cutting: authority & source integrity

Every governed record carries a **`SourceIntegrity`** envelope (§23):

`sourceType · sourceTitle · sourceLocation · sourceVersion · dateObserved · dateRecorded ·
authorityStatus · confidence · notes`

**Authority states** (constitutional invariant): `reported → verified → proposed → approved →
superseded`. The UI must render these distinctly so *proposed* never *looks* approved (Rule #4).
Distinguish reported / verified / proposed / approved / superseded — a pasted update does not
automatically become authoritative.

## Entities (18)

| Entity | Purpose | Key relationships |
|---|---|---|
| **OSSystem** | SAPDOS, STACL, STP, #SOS, future OS components | → dependencies (OSSystem[]), relatedProducts, governingDoc (Artifact) |
| **Product** | Kidlytics, CivicAI, future | → Publications, Decisions, Assignments, Risks, currentBenchmark |
| **Publication** | Experience / Workflow / Component playbooks | → Product, PublicationPhase[], Gate, canonicalUsed[], ownerAI |
| **PublicationPhase** | Phase-gated progress steps | → Publication, Gate |
| **Gate** | Approval checkpoint | → Publication/Phase, decisionRef (Decision) |
| **Decision** | Governed decision register | → affectedArtifacts, supersededDecision |
| **CanonicalStatement** | Class I/II/III language | → approvingDecision, relatedConcept |
| **CanonicalConcept** | Named canonical concepts | → relatedStatements, relatedPublications |
| **AICollaborator** | #SOS, ChatGPT, Claude, Codex, Lovable | → assignedProduct, Assignment[] |
| **Assignment** | A collaborator's current work | → collaborator, product, artifact |
| **Benchmark** | Governing quality standard | → artifact, establishingDecision, replacementBenchmark |
| **Risk** | Governed risk / divergence | → relatedDivergence (Update), affected entities |
| **Update** | Sync-code operating log entry | → decisionsCreated, documentsUpdated, affectedSystems |
| **Artifact** | Where a governing document lives + how to open it | → related Publication/Decision/Benchmark/Assignment |
| **ReviewItem** | Feeds "Needs Your Review" | → entityRef (any), deepLink |
| **NextAction** | The one recommended next action | → affectedScope |
| **SourceReference** | Provenance envelope (embedded on records) | polymorphic |
| **Relationship** | Generic typed edge for the Relationship Viewer | fromEntity → toEntity |

Field-level definitions are the authoritative TypeScript in `app/src/domain/entities/index.ts`.
Enumerations already fixed:

- **PublicationFamily:** `experience · workflow · component`
- **SyncCode:** `ST-SYNC · ST-LOCK · ST-BENCHMARK · ST-REVIEW · ST-DIVERGENCE · ST-OS`
  (reserve `ST-ELEVATE`, do **not** activate it as constitutional behavior)
- **CanonicalClass:** `I` (Canonical) · `II` (Enduring) · `III` (Narrative)
- **Artifact.linkHealth:** `ok · broken · moved · restricted · unverified`
- **Artifact.storageProvider:** `google-drive · icloud · github · production · other`

## Decision classes & statuses (§12)

- **Statuses:** Proposed · Under Review · Approved · Approved with Conditions · Deferred · Rejected · Superseded · Retired
- **Classes:** Local · Product · Platform · Methodology · Operating System · Publication · Canonical Language · Architecture · Design · Workflow · Component

## Notification event model (Phase 3)

Added when notifications are built (§24) — `Notification` with: id · eventType · recipient ·
relatedEntity(+id) · scope · priority · title · privacy-safe preview · full message · CTA · deepLink ·
channelsRequested · channelsDelivered · scheduledTime · sentTime · deliveryState · read · acknowledged ·
dismissed · groupingKey · dedupKey · retryCount · sourceUpdate · correlationId · auditHistory.

## Persistence & migration

- **Collections** (`StorageAdapter.CollectionName`) map 1:1 to the entities above.
- **v0.1:** IndexedDB (Dexie) via `localAdapter`. Durable; survives reloads.
- **Backup format** (`WorkspaceBackup`): `{ schemaVersion, exportedAt, isSeed, collections }` — portable
  JSON, Zod-validated and sanitized on import. `SCHEMA_VERSION` = `0.1.0`.
- **Reset** is guarded (`resetWorkspace(confirmationToken)`) — no accidental destructive reset.
- **Migration to production:** implement `httpAdapter` against the PHP/MySQL API; MySQL migrations in
  `server/migrations/` mirror these entities; import the JSON backup to seed the hosted DB. No UI rewrite.

## Data rules

1. Clear IDs and explicit relationships; no blob-hidden models.
2. Reported ≠ approved; every record states its authority.
3. Unresolved information stays visible — never invented to look complete (Rule #11).
4. Change history is preserved (Rule #13).
5. Seed/demo data is flagged and labeled (§33).
