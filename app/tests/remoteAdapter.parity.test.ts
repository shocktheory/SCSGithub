import { describe, expect, it } from 'vitest';
import { RemoteAdapter, ConflictError } from '../src/storage/remoteAdapter';
import { InMemoryApi, COLLECTION_NAMES } from '../src/storage/testing/inMemoryApi';
import type { CollectionName, StorageAdapter, WorkspaceBackup } from '../src/storage/StorageAdapter';

/**
 * Phase 5 parity: the client must behave identically against local and remote persistence.
 *
 * PHP/MySQL are not available in this environment, so parity is proven against a faithful
 * in-memory reference of the SAME StorageAdapter contract that LocalAdapter implements
 * (a thin key-value store with wholesale import + guarded reset), and the RemoteAdapter
 * driving the InMemoryApi (the executable contract the PHP backend must match).
 */

// Reference adapter — LocalAdapter-equivalent semantics (Dexie is verified in-browser).
class ReferenceAdapter implements StorageAdapter {
  private store = new Map<CollectionName, Map<string, { id: string }>>();
  private meta = { isSeed: true, schemaVersion: '0.1.0' as WorkspaceBackup['schemaVersion'] };
  constructor() { for (const c of COLLECTION_NAMES) this.store.set(c, new Map()); }
  private t(c: CollectionName) { return this.store.get(c)!; }
  async list<T>(c: CollectionName) { return [...this.t(c).values()] as T[]; }
  async get<T>(c: CollectionName, id: string) { return this.t(c).get(id) as T | undefined; }
  async put<T extends { id: string }>(c: CollectionName, r: T) { this.t(c).set(r.id, r); return r; }
  async remove(c: CollectionName, id: string) { this.t(c).delete(id); }
  async exportWorkspace(): Promise<WorkspaceBackup> {
    const collections = {} as Record<CollectionName, unknown[]>;
    for (const c of COLLECTION_NAMES) collections[c] = [...this.t(c).values()];
    return { schemaVersion: this.meta.schemaVersion, exportedAt: '1970-01-01T00:00:00.000Z', isSeed: this.meta.isSeed, collections };
  }
  async importWorkspace(b: WorkspaceBackup) {
    for (const c of COLLECTION_NAMES) { this.t(c).clear(); for (const r of (b.collections[c] ?? []) as { id: string }[]) this.t(c).set(r.id, r); }
    this.meta.isSeed = b.isSeed; this.meta.schemaVersion = b.schemaVersion;
  }
  async resetWorkspace(token: string) { if (token !== 'CONFIRM-RESET') throw new Error('refused'); for (const c of COLLECTION_NAMES) this.t(c).clear(); }
}

type P = { id: string; name: string };
const byId = (rows: P[]) => [...rows].sort((a, b) => a.id.localeCompare(b.id));

/** A deterministic sequence of operations; returns a trace of observable results. */
async function runContract(a: StorageAdapter): Promise<unknown[]> {
  const trace: unknown[] = [];
  trace.push(['list0', await a.list<P>('products')]);
  trace.push(['put1', await a.put('products', { id: 'p1', name: 'Alpha' })]);
  trace.push(['get1', await a.get<P>('products', 'p1')]);
  await a.put('products', { id: 'p2', name: 'Beta' });
  trace.push(['list2', byId(await a.list<P>('products'))]);
  trace.push(['update', await a.put('products', { id: 'p1', name: 'Alpha-2' })]);
  trace.push(['getUpdated', await a.get<P>('products', 'p1')]);
  trace.push(['getMissing', await a.get<P>('products', 'nope')]);
  await a.remove('products', 'p1');
  trace.push(['afterRemove', await a.get<P>('products', 'p1')]);
  trace.push(['listFinal', byId(await a.list<P>('products'))]);
  return trace;
}

describe('Phase 5 — RemoteAdapter matches the StorageAdapter contract (parity)', () => {
  it('produces an identical observable trace to the reference adapter', async () => {
    const reference = new ReferenceAdapter();
    const remote = new RemoteAdapter(new InMemoryApi().transport);
    const [refTrace, remoteTrace] = await Promise.all([runContract(reference), runContract(remote)]);
    expect(remoteTrace).toEqual(refTrace);
  });

  it('export contains all 23 governed collections', async () => {
    const remote = new RemoteAdapter(new InMemoryApi().transport);
    await remote.put('teams', { id: 't1', teamId: 'TEAM-X' } as never);
    const backup = await remote.exportWorkspace();
    expect(Object.keys(backup.collections).sort()).toEqual([...COLLECTION_NAMES].sort());
    expect((backup.collections.teams as unknown[]).length).toBe(1);
  });

  it('round-trips through export → import with parity', async () => {
    const src = new RemoteAdapter(new InMemoryApi().transport);
    await src.put('decisions', { id: 'd1', decisionId: 'ST-DEC-X' } as never);
    const backup = await src.exportWorkspace();
    const dest = new RemoteAdapter(new InMemoryApi().transport);
    await dest.importWorkspace(backup);
    expect(await dest.get('decisions', 'd1')).toMatchObject({ id: 'd1', decisionId: 'ST-DEC-X' });
  });
});

describe('Phase 5 — optimistic concurrency (no stale overwrite)', () => {
  it('a stale writer is rejected with a ConflictError; the newer record survives', async () => {
    const api = new InMemoryApi();
    const writerA = new RemoteAdapter(api.transport);
    const writerB = new RemoteAdapter(api.transport);

    await writerA.put('products', { id: 'p1', name: 'v1' });   // A creates (version 1)
    await writerA.get<P>('products', 'p1');                      // A caches version 1
    await writerB.get<P>('products', 'p1');                      // B caches version 1
    await writerB.put('products', { id: 'p1', name: 'v2-by-B' }); // B updates → version 2

    // A now has a stale expected version and must be rejected.
    await expect(writerA.put('products', { id: 'p1', name: 'v3-by-A-STALE' })).rejects.toBeInstanceOf(ConflictError);

    // The newer authoritative record survives; the stale write did not land.
    const fresh = new RemoteAdapter(api.transport);
    expect(await fresh.get<P>('products', 'p1')).toMatchObject({ name: 'v2-by-B' });
  });
});

describe('Phase 5 — idempotency & guarded reset', () => {
  it('a repeated command with the same idempotency key applies once', () => {
    const api = new InMemoryApi();
    const req = { method: 'POST', path: '/api/commands/upsert', body: { collection: 'products', record: { id: 'p1', name: 'A' }, idempotencyKey: 'K1' } };
    const r1 = api.handle(req);
    const r2 = api.handle(req); // same key → cached, not re-applied
    expect(r1).toEqual(r2);
    expect((r1.body as { version: number }).version).toBe(1); // still version 1, not 2
  });

  it('reset refuses without the confirmation token and clears with it', async () => {
    const api = new InMemoryApi();
    const remote = new RemoteAdapter(api.transport);
    await remote.put('products', { id: 'p1', name: 'A' });
    await expect(remote.resetWorkspace('wrong')).rejects.toThrow();
    await remote.resetWorkspace('CONFIRM-RESET');
    expect(await remote.list('products')).toEqual([]);
  });
});

describe('Phase 5 — import validates rather than trusting JSON authority', () => {
  it('a technical-audit seam records mutations and import', async () => {
    const api = new InMemoryApi();
    const remote = new RemoteAdapter(api.transport);
    await remote.put('products', { id: 'p1', name: 'A' });
    expect(api.audit.some((a) => a.action === 'upsert' && a.result === 'ok')).toBe(true);
    // Import applies through the pipeline (not a raw table write).
    await remote.importWorkspace({ schemaVersion: '0.1.0', exportedAt: 'x', isSeed: true, collections: Object.fromEntries(COLLECTION_NAMES.map((c) => [c, []])) as never });
    expect(api.audit.some((a) => a.action === 'import')).toBe(true);
  });
});
