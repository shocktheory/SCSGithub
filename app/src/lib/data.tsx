import { QueryClient, useQuery } from '@tanstack/react-query';
import { localAdapter } from '../storage/localAdapter';
import type { CollectionName } from '../storage/StorageAdapter';

/**
 * Data access for features. Everything reads through the StorageAdapter, so
 * swapping IndexedDB for the hosted PHP/MySQL API later changes nothing here.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: false },
  },
});

export function useCollection<T>(name: CollectionName) {
  return useQuery({
    queryKey: ['collection', name],
    queryFn: () => localAdapter.list<T>(name),
  });
}

/** Convenience: index a collection by id for cheap lookups/joins in the UI. */
export function indexById<T extends { id: string }>(rows: T[] | undefined): Map<string, T> {
  const map = new Map<string, T>();
  for (const r of rows ?? []) map.set(r.id, r);
  return map;
}
