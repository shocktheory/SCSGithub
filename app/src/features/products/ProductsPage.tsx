import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCollection } from '../../lib/data';
import { PageHeader, StatusBadge, AuthorityBadge } from '../../design-system/components';
import type { Product, Publication } from '../../domain/entities';

export function ProductsPage() {
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');

  const pubCount = (productId: string) =>
    (pubs.data ?? []).filter((p) => p.product === productId).length;

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Products"
        subtitle="Each product has a dedicated command page — its identity, work, decisions, documentation, and next action."
      />

      <div className="scs-grid scs-grid--2">
        {(products.data ?? []).map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} className="scs-card scs-card--interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{p.ecosystem}</div>
              </div>
              <AuthorityBadge state={p.authorityStatus} />
            </div>
            <p style={{ margin: '12px 0 16px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{p.purpose}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge label={p.lifecycleStage} tone="neutral" />
                <StatusBadge label={`${pubCount(p.id)} publications`} tone="neutral" />
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-soft-sky)', fontSize: 13, fontWeight: 600 }}>
                Command page <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
