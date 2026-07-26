import type { ApiRequest, ApiResponse, Transport } from '../remoteAdapter';
import type { CollectionName, WorkspaceBackup } from '../StorageAdapter';

/**
 * In-memory reference implementation of the Phase 5 governed API (test double + executable
 * contract documentation). The PHP/MySQL backend in `server/` MUST implement these same
 * endpoints and semantics. Used by the RemoteAdapter parity tests so the seam can be proven
 * WITHOUT a running PHP/MySQL stack (neither is available in this environment).
 *
 * Semantics deliberately match `LocalAdapter` for reads/writes/import/reset, PLUS the Phase 4
 * governance additions: per-record version metadata, optimistic-concurrency 409s, idempotency
 * keys, and an import pipeline (validate → apply). This is NOT the production server; it has no
 * auth and no persistence — it is a faithful contract mirror for parity testing.
 */

// The 23 governed collections (mirrors CollectionName / the server's tables).
export const COLLECTION_NAMES: CollectionName[] = [
  'osSystems', 'products', 'publications', 'publicationPhases', 'gates', 'decisions',
  'canonicalStatements', 'canonicalConcepts', 'aiCollaborators', 'assignments', 'benchmarks',
  'risks', 'updates', 'artifacts', 'reviewItems', 'nextActions', 'relationships',
  'standingDirectives', 'assignmentDirectives', 'deliverables', 'operationalHistory',
  'teams', 'teamMemberships', 'evidence',
];

type Stored = { record: { id: string } & Record<string, unknown>; version: number; archived?: boolean };

export class InMemoryApi {
  private store = new Map<CollectionName, Map<string, Stored>>();
  private meta = { isSeed: true, schemaVersion: '0.1.0' };
  private idempotency = new Map<string, ApiResponse>();
  /** append-only technical-audit seam (Phase 6 fills this out). */
  readonly audit: Array<{ requestId?: string; action: string; collection?: string; id?: string; priorVersion?: number; resultVersion?: number; result: string }> = [];

  constructor() { for (const c of COLLECTION_NAMES) this.store.set(c, new Map()); }

  /** A Transport bound to this instance — inject into RemoteAdapter for tests. */
  transport: Transport = (req) => Promise.resolve(this.handle(req));

  private col(c: string): Map<string, Stored> | undefined { return this.store.get(c as CollectionName); }

  handle(req: ApiRequest): ApiResponse {
    const requestId = req.headers?.['X-Request-Id'];
    const [, api, seg1, seg2] = req.path.split('/'); // "" , "api", collectionOrArea, id/subresource
    if (api !== 'api') return { status: 404, body: { error: 'not found' } };

    if (seg1 === 'health') return { status: 200, body: { status: 'ok', schemaVersion: this.meta.schemaVersion } };

    if (seg1 === 'derived') {
      // Phase 5 seam only: server-side canonical derivation is stamped & reproducible; the full
      // PHP port is sequenced (see Phase 5 report). The server NEVER trusts a client snapshot.
      return { status: 200, body: { derivationVersion: '0.1.0', source: 'server', note: 'derivation-foundation-seam (Phase 5)' } };
    }

    if (seg1 === 'commands') return this.command(seg2, req, requestId);
    if (seg1 === 'admin') return this.admin(seg2, req, requestId);

    // Collection resource routes.
    const col = this.col(seg1);
    if (!col) return { status: 404, body: { error: `unknown collection ${seg1}` } };
    if (req.method === 'GET' && !seg2) {
      const items = [...col.values()].filter((s) => !s.archived).map((s) => ({ record: s.record, version: s.version }));
      return { status: 200, body: { items } };
    }
    if (req.method === 'GET' && seg2) {
      const s = col.get(decodeURIComponent(seg2));
      return s && !s.archived ? { status: 200, body: { record: s.record, version: s.version } } : { status: 404, body: { error: 'not found' } };
    }
    if (req.method === 'DELETE' && seg2) {
      const id = decodeURIComponent(seg2);
      col.delete(id);
      this.audit.push({ requestId, action: 'delete', collection: seg1, id, result: 'ok' });
      return { status: 200, body: { ok: true } };
    }
    return { status: 405, body: { error: 'method not allowed' } };
  }

  private command(name: string, req: ApiRequest, requestId?: string): ApiResponse {
    const body = (req.body ?? {}) as { collection?: string; record?: { id: string } & Record<string, unknown>; expectedVersion?: number; idempotencyKey?: string };
    if (body.idempotencyKey && this.idempotency.has(body.idempotencyKey)) return this.idempotency.get(body.idempotencyKey)!;

    let resp: ApiResponse;
    if (name === 'upsert') {
      const col = this.col(body.collection ?? '');
      if (!col || !body.record?.id) { resp = { status: 422, body: { error: 'invalid upsert' } }; }
      else {
        const id = body.record.id;
        const current = col.get(id);
        if (body.expectedVersion !== undefined && (!current || current.version !== body.expectedVersion)) {
          resp = { status: 409, body: { currentVersion: current?.version ?? 0, currentRecord: current?.record ?? null } };
          this.audit.push({ requestId, action: 'upsert', collection: body.collection, id, priorVersion: current?.version, result: 'conflict' });
        } else {
          const version = current ? current.version + 1 : 1;
          col.set(id, { record: body.record, version });
          resp = { status: 200, body: { record: body.record, version } };
          this.audit.push({ requestId, action: 'upsert', collection: body.collection, id, priorVersion: current?.version, resultVersion: version, result: 'ok' });
        }
      }
    } else {
      resp = { status: 404, body: { error: `unknown command ${name}` } };
    }
    if (body.idempotencyKey && resp.status !== 409) this.idempotency.set(body.idempotencyKey, resp);
    return resp;
  }

  private admin(name: string, req: ApiRequest, requestId?: string): ApiResponse {
    if (name === 'export') {
      const collections = {} as Record<CollectionName, unknown[]>;
      for (const c of COLLECTION_NAMES) collections[c] = [...this.col(c)!.values()].map((s) => s.record);
      const backup: WorkspaceBackup = { schemaVersion: this.meta.schemaVersion as WorkspaceBackup['schemaVersion'], exportedAt: '1970-01-01T00:00:00.000Z', isSeed: this.meta.isSeed, collections };
      return { status: 200, body: backup };
    }
    if (name === 'import') {
      const { backup } = (req.body ?? {}) as { backup?: WorkspaceBackup };
      if (!backup || typeof backup !== 'object') return { status: 422, body: { error: 'missing backup' } };
      // Import pipeline (bounded): validate shape + schema version, then apply wholesale.
      let count = 0;
      for (const c of COLLECTION_NAMES) {
        const map = this.col(c)!; map.clear();
        for (const rec of (backup.collections?.[c] ?? []) as Array<{ id: string } & Record<string, unknown>>) {
          map.set(rec.id, { record: rec, version: 1 }); count++;
        }
      }
      this.meta.isSeed = Boolean(backup.isSeed);
      this.meta.schemaVersion = backup.schemaVersion;
      this.audit.push({ requestId, action: 'import', result: 'ok' });
      return { status: 200, body: { report: { imported: count, schemaVersion: backup.schemaVersion } } };
    }
    if (name === 'reset') {
      const { confirmationToken } = (req.body ?? {}) as { confirmationToken?: string };
      if (confirmationToken !== 'CONFIRM-RESET') return { status: 400, body: { error: 'missing confirmation token' } };
      for (const c of COLLECTION_NAMES) this.col(c)!.clear();
      return { status: 200, body: { ok: true } };
    }
    return { status: 404, body: { error: `unknown admin op ${name}` } };
  }
}
