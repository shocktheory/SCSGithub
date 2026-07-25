import Dexie, { type Table } from 'dexie';
import type { CollectionName } from './StorageAdapter';

/**
 * SCS local database (IndexedDB via Dexie). Durable local-first persistence for
 * v0.1. Every collection is keyed by `id`. The same collection names are used by
 * the future httpAdapter, so migrating to hosted MySQL requires no UI/domain change.
 */
export class SCSDatabase extends Dexie {
  osSystems!: Table<Record<string, unknown>, string>;
  products!: Table<Record<string, unknown>, string>;
  publications!: Table<Record<string, unknown>, string>;
  publicationPhases!: Table<Record<string, unknown>, string>;
  gates!: Table<Record<string, unknown>, string>;
  decisions!: Table<Record<string, unknown>, string>;
  canonicalStatements!: Table<Record<string, unknown>, string>;
  canonicalConcepts!: Table<Record<string, unknown>, string>;
  aiCollaborators!: Table<Record<string, unknown>, string>;
  assignments!: Table<Record<string, unknown>, string>;
  benchmarks!: Table<Record<string, unknown>, string>;
  risks!: Table<Record<string, unknown>, string>;
  updates!: Table<Record<string, unknown>, string>;
  artifacts!: Table<Record<string, unknown>, string>;
  reviewItems!: Table<Record<string, unknown>, string>;
  nextActions!: Table<Record<string, unknown>, string>;
  relationships!: Table<Record<string, unknown>, string>;
  standingDirectives!: Table<Record<string, unknown>, string>;
  assignmentDirectives!: Table<Record<string, unknown>, string>;
  deliverables!: Table<Record<string, unknown>, string>;
  operationalHistory!: Table<Record<string, unknown>, string>;
  teams!: Table<Record<string, unknown>, string>;
  teamMemberships!: Table<Record<string, unknown>, string>;
  meta!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('scs');
    this.version(1).stores({
      osSystems: 'id',
      products: 'id',
      publications: 'id, product',
      publicationPhases: 'id, publication',
      gates: 'id, publication',
      decisions: 'id',
      canonicalStatements: 'id, classification',
      canonicalConcepts: 'id',
      aiCollaborators: 'id',
      assignments: 'id, collaborator',
      benchmarks: 'id',
      risks: 'id, severity',
      updates: 'id, code',
      artifacts: 'id',
      reviewItems: 'id',
      nextActions: 'id',
      relationships: 'id',
      meta: 'key',
    });
    // v2 (Phase 2): independent constitutional objects.
    this.version(2).stores({
      standingDirectives: 'id, agent',
      assignmentDirectives: 'id, agent',
      deliverables: 'id',
      operationalHistory: 'id',
    });
    // v3 (Reconciliation): Team + Team Membership as first-class objects.
    this.version(3).stores({
      teams: 'id',
      teamMemberships: 'id, agent, team',
    });
  }
}

export const COLLECTIONS: CollectionName[] = [
  'osSystems',
  'products',
  'publications',
  'publicationPhases',
  'gates',
  'decisions',
  'canonicalStatements',
  'canonicalConcepts',
  'aiCollaborators',
  'assignments',
  'benchmarks',
  'risks',
  'updates',
  'artifacts',
  'reviewItems',
  'nextActions',
  'relationships',
  'standingDirectives',
  'assignmentDirectives',
  'deliverables',
  'operationalHistory',
  'teams',
  'teamMemberships',
];

export const db = new SCSDatabase();
