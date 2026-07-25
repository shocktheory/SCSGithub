/**
 * StorageAdapter — the seam that keeps SCS from being locked into browser-only
 * storage (§25). The SAME interface is implemented by:
 *
 *   - localAdapter  (IndexedDB / Dexie)  → v0.1, local-first, no server
 *   - httpAdapter   (PHP + MySQL API)    → Phase 3+, hosted private workspace
 *
 * UI and domain code depend only on this interface, so migrating to the hosted
 * database requires no UI rewrite. Backups are portable JSON stamped with the
 * schema version (see DATA_MODEL.md).
 */
import type { SCHEMA_VERSION } from '../domain/schemaVersion';

/** Names of the top-level collections SCS persists. Mirrors the domain model. */
export type CollectionName =
  | 'osSystems'
  | 'products'
  | 'publications'
  | 'publicationPhases'
  | 'gates'
  | 'decisions'
  | 'canonicalStatements'
  | 'canonicalConcepts'
  | 'aiCollaborators'
  | 'assignments'
  | 'benchmarks'
  | 'risks'
  | 'updates'
  | 'artifacts'
  | 'reviewItems'
  | 'nextActions'
  | 'relationships'
  | 'standingDirectives'
  | 'assignmentDirectives'
  | 'deliverables'
  | 'operationalHistory'
  | 'teams'
  | 'teamMemberships';

export interface WorkspaceBackup {
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: string;
  /** Clearly flags demo/seed content so it can be reviewed and corrected (§33). */
  isSeed: boolean;
  collections: Record<CollectionName, unknown[]>;
}

export interface StorageAdapter {
  list<T>(collection: CollectionName): Promise<T[]>;
  get<T>(collection: CollectionName, id: string): Promise<T | undefined>;
  put<T extends { id: string }>(collection: CollectionName, record: T): Promise<T>;
  remove(collection: CollectionName, id: string): Promise<void>;

  /** Full workspace export/import for backup & restore. Import validates + sanitizes. */
  exportWorkspace(): Promise<WorkspaceBackup>;
  importWorkspace(backup: WorkspaceBackup): Promise<void>;

  /** Guarded reset — must never fire without explicit confirmation upstream. */
  resetWorkspace(confirmationToken: string): Promise<void>;
}
