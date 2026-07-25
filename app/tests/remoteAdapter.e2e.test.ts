import { describe, expect, it, beforeAll } from 'vitest';
import { RemoteAdapter, httpTransport, ConflictError } from '../src/storage/remoteAdapter';
import { COLLECTION_NAMES } from '../src/storage/testing/inMemoryApi';
import type { WorkspaceBackup } from '../src/storage/StorageAdapter';

/**
 * END-TO-END runtime verification (Condition §8): the ACTUAL client RemoteAdapter talking to
 * the ACTUAL running PHP/MySQL backend — NOT the in-memory API.
 *
 * Gated by `SCS_E2E_BASE` (e.g. http://127.0.0.1:8787). It is SKIPPED where no backend is running
 * (local dev without PHP/MySQL) and RUNS in CI where PHP 8.2 + MySQL 8 are provisioned. This is how
 * the host runtime verification is executed reproducibly; it is never represented as passed unless
 * it actually ran against the backend.
 */
const BASE = process.env.SCS_E2E_BASE;

describe.skipIf(!BASE)('Phase 5 E2E — RemoteAdapter ↔ real PHP/MySQL backend', () => {
  const adapter = () => new RemoteAdapter(httpTransport(BASE as string));

  beforeAll(async () => {
    // Start from a clean database (guarded reset).
    await adapter().resetWorkspace('CONFIRM-RESET');
  });

  it('health: the backend is up', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('ok');
  });

  it('create / list / get / update / remove round-trip', async () => {
    const a = adapter();
    expect(await a.list('products')).toEqual([]);
    await a.put('products', { id: 'p1', name: 'Alpha' });
    await a.put('products', { id: 'p2', name: 'Beta' });
    expect((await a.list<{ id: string }>('products')).map((r) => r.id).sort()).toEqual(['p1', 'p2']);
    expect(await a.get('products', 'p1')).toMatchObject({ id: 'p1', name: 'Alpha' });
    await a.put('products', { id: 'p1', name: 'Alpha-2' });
    expect(await a.get('products', 'p1')).toMatchObject({ name: 'Alpha-2' });
    await a.remove('products', 'p1');
    expect(await a.get('products', 'p1')).toBeUndefined();
    expect(await a.get('products', 'nope')).toBeUndefined();
  });

  it('optimistic concurrency: stale write rejected (409); newer record survives', async () => {
    const A = adapter();
    const B = adapter();
    await A.put('teams', { id: 'tX', teamId: 'TEAM-X', name: 'v1' } as never);
    await A.get('teams', 'tX'); // A caches version
    await B.get('teams', 'tX'); // B caches version
    await B.put('teams', { id: 'tX', teamId: 'TEAM-X', name: 'v2-by-B' } as never);
    await expect(A.put('teams', { id: 'tX', teamId: 'TEAM-X', name: 'v3-STALE' } as never)).rejects.toBeInstanceOf(ConflictError);
    expect(await adapter().get('teams', 'tX')).toMatchObject({ name: 'v2-by-B' });
  });

  it('import → export round-trip through the real backend', async () => {
    const empty = Object.fromEntries(COLLECTION_NAMES.map((c) => [c, []])) as Record<string, unknown[]>;
    const backup = { schemaVersion: '0.1.0', exportedAt: 'x', isSeed: true, collections: { ...empty, decisions: [{ id: 'd1', decisionId: 'ST-DEC-E2E' }] } } as unknown as WorkspaceBackup;
    const a = adapter();
    await a.importWorkspace(backup);
    expect(await a.get('decisions', 'd1')).toMatchObject({ id: 'd1', decisionId: 'ST-DEC-E2E' });
    const exported = await a.exportWorkspace();
    expect(Object.keys(exported.collections).sort()).toEqual([...COLLECTION_NAMES].sort());
  });

  it('guarded reset refuses a bad token and clears with the good one', async () => {
    const a = adapter();
    await a.put('products', { id: 'z1', name: 'Z' });
    await expect(a.resetWorkspace('nope')).rejects.toThrow();
    await a.resetWorkspace('CONFIRM-RESET');
    expect(await a.list('products')).toEqual([]);
  });
});
