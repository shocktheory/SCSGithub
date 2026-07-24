import { PageHeader, EmptyState } from '../design-system/components';
import type { NavItem } from '../app/nav';

/**
 * Honest placeholder for sections that arrive in a later phase. It shows the true
 * shape of the section without pretending the feature exists — empty states teach.
 */
export function PlaceholderPage({ item }: { item: NavItem }) {
  return (
    <div>
      <PageHeader eyebrow={`Arrives in Phase ${item.phase}`} title={item.label} />
      <EmptyState title={`${item.label} is defined and scheduled`}>
        {item.blurb} This section is specified in the data model and ships in Phase {item.phase};
        it is intentionally not built yet so nothing here is mistaken for a working feature.
      </EmptyState>
    </div>
  );
}
