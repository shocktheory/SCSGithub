import { useCollection } from '../../lib/data';
import { PageHeader, ProductCard } from '../../design-system/components';
import type { Product, Publication, PublicationPhase } from '../../domain/entities';

export function ProductsPage() {
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');
  const phases = useCollection<PublicationPhase>('publicationPhases');

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Products"
        subtitle="Each product has a dedicated command page — its identity, work, decisions, documentation, and next action. Cards communicate constitutional status, maturity, and operational health."
      />

      <div className="scs-grid scs-grid--2">
        {(products.data ?? []).map((p) => (
          <ProductCard key={p.id} product={p} publications={pubs.data ?? []} phases={phases.data ?? []} />
        ))}
      </div>
    </div>
  );
}
