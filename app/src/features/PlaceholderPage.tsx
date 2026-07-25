import { PageHeader, EmptyState } from '../design-system/components';
import type { NavItem } from '../app/nav';

/**
 * Honest placeholder for sections that are planned or deferred. It shows the true
 * shape of the section without pretending the feature exists — empty states teach.
 */
export function PlaceholderPage({ item }: { item: NavItem }) {
  const eyebrow =
    item.status === 'deferred' ? 'Deferred from Phase 1' : `Arrives in Phase ${item.phase}`;
  const detail =
    item.status === 'deferred'
      ? 'It is deferred from Phase 1 and represented explicitly in the phase plan — not built yet, and nothing here is mistaken for a working feature.'
      : `It is specified in the data model and ships in Phase ${item.phase}; it is intentionally not built yet so nothing here is mistaken for a working feature.`;
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={item.label} />
      <EmptyState title={`${item.label} — defined, not yet built`}>
        {item.blurb} {detail}
      </EmptyState>
    </div>
  );
}
