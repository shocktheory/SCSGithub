import { SCHEMA_VERSION } from '../domain/schemaVersion';
import type { CollectionName, StorageAdapter, WorkspaceBackup } from './StorageAdapter';

/**
 * Production-oriented RemoteAdapter (Phase 5).
 *
 * Implements the SAME `StorageAdapter` seam the client already depends on, so the UI,
 * TanStack Query hooks, and the derivation engine need no changes. It communicates only
 * through the approved API boundary (never direct DB access) and preserves the accepted
 * client contract.
 *
 * Governance (Phase 4 rule): writes to governed records go through governed commands, not
 * unrestricted document replacement. Optimistic concurrency is enforced without changing
 * the `StorageAdapter` interface: the adapter caches the version it last observed on a read
 * and sends it as `expectedVersion` on the next write; a stale write is rejected (409).
 *
 * Version/timestamps are PERSISTENCE metadata (server-owned) — they are not domain-entity
 * fields, so no new constitutional entity or schema is introduced (architecture freeze).
 */

/** A transport is any function that performs one API request. Injectable for tests. */
export type ApiRequest = { method: string; path: string; body?: unknown; headers?: Record<string, string> };
export type ApiResponse = { status: number; body?: unknown };
export type Transport = (req: ApiRequest) => Promise<ApiResponse>;

export class ConflictError extends Error {
  constructor(public readonly collection: string, public readonly id: string, public readonly currentVersion: number, public readonly currentRecord: unknown) {
    super(`Version conflict on ${collection}/${id}: a newer authoritative record exists (v${currentVersion}). Reload and retry.`);
    this.name = 'ConflictError';
  }
}
export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly detail?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Default transport: real HTTP via fetch against a base URL (used in production). */
export function httpTransport(baseUrl: string, fetchImpl: typeof fetch = fetch): Transport {
  return async ({ method, path, body, headers }) => {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include', // session cookie (Phase 6); harmless in dev
    });
    let parsed: unknown;
    const text = await res.text();
    try { parsed = text ? JSON.parse(text) : undefined; } catch { parsed = text; }
    return { status: res.status, body: parsed };
  };
}

let requestCounter = 0;
const nextRequestId = () => `req-${Date.now()}-${(requestCounter = (requestCounter + 1) % 1_000_000)}`;

export class RemoteAdapter implements StorageAdapter {
  /** version last observed per record — powers automatic optimistic concurrency. */
  private versions = new Map<string, number>();
  private key(c: CollectionName, id: string) { return `${c}:${id}`; }

  constructor(private readonly transport: Transport) {}

  private async call(req: ApiRequest): Promise<ApiResponse> {
    const res = await this.transport({ ...req, headers: { 'X-Request-Id': nextRequestId(), ...(req.headers ?? {}) } });
    if (res.status >= 500) throw new ApiError(res.status, `Server error (${res.status})`, res.body);
    return res;
  }

  async list<T>(collection: CollectionName): Promise<T[]> {
    const res = await this.call({ method: 'GET', path: `/api/${collection}` });
    if (res.status !== 200) throw new ApiError(res.status, `list(${collection}) failed`, res.body);
    const items = (res.body as { items: Array<{ record: T; version: number }> }).items;
    for (const it of items) this.versions.set(this.key(collection, (it.record as { id: string }).id), it.version);
    return items.map((it) => it.record);
  }

  async get<T>(collection: CollectionName, id: string): Promise<T | undefined> {
    const res = await this.call({ method: 'GET', path: `/api/${collection}/${encodeURIComponent(id)}` });
    if (res.status === 404) return undefined;
    if (res.status !== 200) throw new ApiError(res.status, `get(${collection}/${id}) failed`, res.body);
    const { record, version } = res.body as { record: T; version: number };
    this.versions.set(this.key(collection, id), version);
    return record;
  }

  async put<T extends { id: string }>(collection: CollectionName, record: T): Promise<T> {
    const expectedVersion = this.versions.get(this.key(collection, record.id));
    const res = await this.call({
      method: 'POST',
      path: `/api/commands/upsert`,
      body: { collection, record, expectedVersion, idempotencyKey: nextRequestId() },
    });
    if (res.status === 409) {
      const c = res.body as { currentVersion: number; currentRecord: unknown };
      this.versions.set(this.key(collection, record.id), c.currentVersion);
      throw new ConflictError(collection, record.id, c.currentVersion, c.currentRecord);
    }
    if (res.status !== 200) throw new ApiError(res.status, `put(${collection}) failed`, res.body);
    const { record: stored, version } = res.body as { record: T; version: number };
    this.versions.set(this.key(collection, record.id), version);
    return stored;
  }

  async remove(collection: CollectionName, id: string): Promise<void> {
    // Dev/test parity semantics only. Governed history is never hard-deleted in production —
    // production uses the `archive`/`supersede` commands; DELETE is restricted to
    // non-governing/dev records by server policy (Phase 6).
    const res = await this.call({ method: 'DELETE', path: `/api/${collection}/${encodeURIComponent(id)}` });
    if (res.status !== 200 && res.status !== 204 && res.status !== 404) throw new ApiError(res.status, `remove(${collection}/${id}) failed`, res.body);
    this.versions.delete(this.key(collection, id));
  }

  async exportWorkspace(): Promise<WorkspaceBackup> {
    const res = await this.call({ method: 'GET', path: `/api/admin/export` });
    if (res.status !== 200) throw new ApiError(res.status, 'exportWorkspace failed', res.body);
    return res.body as WorkspaceBackup;
  }

  async importWorkspace(backup: WorkspaceBackup): Promise<void> {
    // Server runs the import-safety pipeline (dry-run validation, schema-version check,
    // authority validation, referential-integrity report, transactional apply). No record
    // becomes approved merely because its JSON says so.
    const res = await this.call({ method: 'POST', path: `/api/admin/import`, body: { backup, schemaVersion: SCHEMA_VERSION } });
    if (res.status !== 200) throw new ApiError(res.status, 'importWorkspace failed', res.body);
    this.versions.clear();
  }

  async resetWorkspace(confirmationToken: string): Promise<void> {
    const res = await this.call({ method: 'POST', path: `/api/admin/reset`, body: { confirmationToken } });
    if (res.status !== 200) throw new ApiError(res.status, 'resetWorkspace refused', res.body);
    this.versions.clear();
  }
}
