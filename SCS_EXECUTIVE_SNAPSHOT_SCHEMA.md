# SCS Executive Snapshot — Schema

The Executive Snapshot / SCS Home is a defining experience (§8, §18): it must answer the Product
Owner's core questions **in under one minute, without navigation**. It is a **generated view over
live data** — never a stored or separately maintained document.

## Questions it must answer

Where are we? · What changed? · What needs me? · What is blocked? · What happens next?

## Composition

The snapshot is assembled from these blocks, each linking directly to the authoritative record and,
where relevant, its source artifact/folder.

```
ExecutiveSnapshot {
  generatedAt: ISODate

  currentOperatingState {
    osVersion: string
    overallStatus: string
    lastReconciled: ISODate
    constitutionalBaseline: string
    sosSyncStatus: string
  }

  needsYourReview: ReviewItem[]        // ONLY genuine Product-Owner gates —
                                       // approval gates, unresolved constitutional
                                       // decisions, publication reviews, conflicts,
                                       // proposed elevations, high-impact changes.
                                       // NOT every unread update.

  activeProducts: ProductSummary[] {
    product · currentPhase · status · latestUpdate · currentArtifact ·
    currentAIOwner · openOwnerDecisions · nextAction
  }

  currentPublications: PublicationSummary[] {
    family · volume · subject · phase · version · currentGate · status · owner ·
    lastUpdate · nextAction
  }

  aiWork: AISummary[] {
    collaborator · currentAssignment · product · artifact · phase ·
    waitingState · lastUpdate · expectedNextOutput
  }

  recentConstitutionalChanges: ChangeFeedItem[]  // locks, approvals, benchmarks,
                                                 // OS updates, canonical-language
                                                 // changes, supersessions, major
                                                 // product decisions.

  currentRisks: RiskSummary[]          // only meaningful, material risks

  recommendedNextAction: {             // exactly ONE
    recommendation · why · affectedScope · requiresOwnerApproval
  }

  quickLinks: ArtifactLink[]           // direct links to active governing
                                       // documents and folders
}
```

## Generation rules

1. **Derived, not stored.** Recomputed from the live workspace each view. No duplicate record.
2. **Signal over noise.** "Needs Your Review" surfaces true gates only; do not promote every unread
   update.
3. **Authority is explicit.** Proposed items are visually distinct from approved ones.
4. **One next action.** Exactly one primary recommendation, with its rationale and whether Owner
   approval is required.
5. **Deep-linkable.** Every item links to its exact SCS record; notifications reuse these links.
6. **Exportable.** The Snapshot and the Cheatsheet share this data; both export to Markdown/PDF later.

## Relationship to the Cheatsheet

The Living Cheatsheet (§20) is a compact, printable projection of much of the same data. Both are
generated from one source; neither is maintained by hand (Rule #14).
