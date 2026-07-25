import type { StorageAdapter } from './StorageAdapter';
import { localAdapter } from './localAdapter';
import { RemoteAdapter, httpTransport } from './remoteAdapter';

/**
 * Active storage adapter selector (Phase 5).
 *
 * Defaults to the local IndexedDB adapter (offline/demo) so the demonstration build is
 * unchanged. When `VITE_SCS_API_BASE` is configured at build time, the client instead talks
 * to the governed PHP/MySQL API through the RemoteAdapter — the same `StorageAdapter` seam,
 * so nothing upstream changes. Remote mode is dev/test only in Phase 5 (no production data,
 * no deployment).
 */
const apiBase = (import.meta.env as Record<string, string | undefined>).VITE_SCS_API_BASE;

export const adapterMode: 'local' | 'remote' = apiBase ? 'remote' : 'local';

export const adapter: StorageAdapter = apiBase
  ? new RemoteAdapter(httpTransport(apiBase))
  : localAdapter;
