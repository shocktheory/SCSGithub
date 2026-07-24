import { SCHEMA_VERSION } from '../domain/schemaVersion';
import type {
  CollectionName,
  StorageAdapter,
  WorkspaceBackup,
} from './StorageAdapter';
import { COLLECTIONS, db } from './db';

/**
 * IndexedDB implementation of StorageAdapter (v0.1, local-first).
 * The UI and domain depend only on the StorageAdapter interface, so this can be
 * swapped for an httpAdapter (PHP/MySQL) later with no changes upstream.
 */
export class LocalAdapter implements StorageAdapter {
  async list<T>(collection: CollectionName): Promise<T[]> {
    return (await db.table(collection).toArray()) as T[];
  }

  async get<T>(collection: CollectionName, id: string): Promise<T | undefined> {
    return (await db.table(collection).get(id)) as T | undefined;
  }

  async put<T extends { id: string }>(collection: CollectionName, record: T): Promise<T> {
    await db.table(collection).put(record);
    return record;
  }

  async remove(collection: CollectionName, id: string): Promise<void> {
    await db.table(collection).delete(id);
  }

  async exportWorkspace(): Promise<WorkspaceBackup> {
    const collections = {} as Record<CollectionName, unknown[]>;
    for (const name of COLLECTIONS) {
      collections[name] = await db.table(name).toArray();
    }
    const isSeedRow = await db.meta.get('isSeed');
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      isSeed: Boolean(isSeedRow?.value ?? true),
      collections,
    };
  }

  async importWorkspace(backup: WorkspaceBackup): Promise<void> {
    // Import replaces the workspace wholesale. Callers must validate/sanitize first.
    await db.transaction('rw', db.tables, async () => {
      for (const name of COLLECTIONS) {
        await db.table(name).clear();
        const rows = backup.collections[name] ?? [];
        if (rows.length) await db.table(name).bulkPut(rows as Record<string, unknown>[]);
      }
      await db.meta.put({ key: 'isSeed', value: backup.isSeed });
      await db.meta.put({ key: 'schemaVersion', value: backup.schemaVersion });
    });
  }

  async resetWorkspace(confirmationToken: string): Promise<void> {
    // Guard: never wipe data without the explicit confirmation token (Rule: prevent
    // accidental destructive resets).
    if (confirmationToken !== 'CONFIRM-RESET') {
      throw new Error('resetWorkspace refused: missing confirmation token');
    }
    await db.transaction('rw', db.tables, async () => {
      for (const name of COLLECTIONS) await db.table(name).clear();
      await db.meta.clear();
    });
  }
}

export const localAdapter = new LocalAdapter();
