import { db } from './db';
import { localAdapter } from './localAdapter';
import { seedWorkspace } from '../seed';

/**
 * Load labeled seed data on first run only. If the workspace already has data,
 * this is a no-op — the Product Owner's edits are never overwritten by seed.
 */
export async function ensureSeeded(): Promise<void> {
  await db.open();
  const existing = await db.osSystems.count();
  if (existing === 0) {
    await localAdapter.importWorkspace(seedWorkspace);
  }
}

/** Whether the current workspace is still the labeled demo/seed dataset. */
export async function isSeedWorkspace(): Promise<boolean> {
  const row = await db.meta.get('isSeed');
  return Boolean(row?.value ?? false);
}
