import { useCollection, indexById } from '../../lib/data';
import { PageHeader, Card, MetaGrid, StatusBadge, AuthorityBadge } from '../../design-system/components';
import type { OSSystem, Product } from '../../domain/entities';

export function OSRegistryPage() {
  const os = useCollection<OSSystem>('osSystems');
  const products = useCollection<Product>('products');
  const systems = os.data ?? [];
  const byId = new Map(systems.map((s) => [s.id, s]));
  const productById = indexById(products.data);

  return (
    <div>
      <PageHeader
        eyebrow="System registry"
        title="ShockTheory OS"
        subtitle="The operating-system components that govern ShockTheory. Relationships are preserved — this is never flattened into a generic list."
      />

      <div style={{ display: 'grid', gap: 16 }}>
        {systems.map((s) => (
          <Card key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{s.acronym}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{s.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge label={s.status} tone="verified" />
                <AuthorityBadge state={s.authorityStatus} />
              </div>
            </div>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>{s.purpose}</p>
            <MetaGrid
              rows={[
                ['Authority', s.authority],
                ['Version', s.version],
                ['Owner', s.owner],
                ['Dependencies', s.dependencies.length ? s.dependencies.map((d) => byId.get(d)?.acronym ?? d).join(' · ') : '—'],
                ['Related products', s.relatedProducts.length ? s.relatedProducts.map((p) => productById.get(p)?.name ?? p).join(' · ') : '—'],
                ['Notes', s.notes ?? '—'],
              ]}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
