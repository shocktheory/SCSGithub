import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Product, Publication, PublicationPhase } from '../../domain/entities';
import { productMaturity } from '../../lib/derive';
import { AuthorityBadge, StatusBadge } from './Badges';
import { MaturityMeter } from './Stat';

/**
 * Product as a governed entity — communicates constitutional status, maturity,
 * current phase, and operational health, not just a name.
 */
export function ProductCard({
  product,
  publications,
  phases,
}: {
  product: Product;
  publications: Publication[];
  phases: PublicationPhase[];
}) {
  const own = publications.filter((p) => p.product === product.id);
  const inProgress = own.filter((p) => p.currentPhase && p.authorityStatus !== 'approved').length;
  const maturity = productMaturity(product, publications, phases);
  const healthy = own.length > 0;

  return (
    <Link to={`/products/${product.id}`} className="scs-card scs-card--interactive">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{product.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{product.ecosystem}</div>
        </div>
        <AuthorityBadge state={product.authorityStatus} />
      </div>

      <p style={{ margin: '12px 0 16px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
        {product.purpose}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Maturity
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{maturity.label}</span>
      </div>
      <MaturityMeter value={maturity.value} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge label={product.lifecycleStage} tone="neutral" />
          <span className="scs-product__health">
            <span className={`scs-health-dot ${healthy ? 'scs-health-dot--healthy' : 'scs-health-dot--early'}`} aria-hidden />
            {own.length} publication{own.length === 1 ? '' : 's'}{inProgress ? ` · ${inProgress} active` : ''}
          </span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-soft-sky)', fontSize: 13, fontWeight: 600 }}>
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
