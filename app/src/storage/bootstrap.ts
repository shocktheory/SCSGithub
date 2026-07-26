import { db } from './db';
import { localAdapter } from './localAdapter';
import { seedWorkspace } from '../seed';

/**
 * Bump when the demonstration seed content changes. A demonstration workspace with
 * an older seed version is refreshed automatically (there is no Product Owner data
 * to lose in a demo workspace). Real Product Owner workspaces (isSeed=false) are
 * never auto-overwritten.
 */
export const SEED_VERSION = '2026-07-26-scs-phase10-planning-closed';

/**
 * Load labeled seed data on first run. Also refresh a demonstration workspace when
 * the seed version changes, so demo data never goes stale across builds.
 */
export async function ensureSeeded(): Promise<void> {
  await db.open();
  const existing = await db.osSystems.count();
  const storedVersion = (await db.meta.get('seedVersion'))?.value;
  const isDemo = Boolean((await db.meta.get('isSeed'))?.value ?? existing === 0);

  const shouldSeed = existing === 0 || (isDemo && storedVersion !== SEED_VERSION);
  if (shouldSeed) {
    await localAdapter.importWorkspace(seedWorkspace);
    await db.meta.put({ key: 'seedVersion', value: SEED_VERSION });
  }
}

/** Whether the current workspace is still the labeled demo/seed dataset. */
export async function isSeedWorkspace(): Promise<boolean> {
  const row = await db.meta.get('isSeed');
  return Boolean(row?.value ?? false);
}
