import { useCollection, indexById } from '../../lib/data';
import { PageHeader, Card, MetaGrid, StatusBadge, AuthorityBadge, GateTimeline, SectionTitle } from '../../design-system/components';
import { FAMILY_LABEL, publicationTimeline, authorityTone } from '../../lib/derive';
import type { Publication, PublicationPhase, Product, AICollaborator } from '../../domain/entities';

const FAMILY_QUESTION: Record<Publication['family'], string> = {
  experience: 'Why does this matter, and what should it feel like?',
  workflow: 'How does this capability work from beginning to end?',
  component: 'How must this reusable interaction behave everywhere?',
};

const FAMILY_ORDER: Publication['family'][] = ['experience', 'workflow', 'component'];

export function PublicationsPage() {
  const pubs = useCollection<Publication>('publications');
  const phases = useCollection<PublicationPhase>('publicationPhases');
  const products = useCollection<Product>('products');
  const ai = useCollection<AICollaborator>('aiCollaborators');
  const productById = indexById(products.data);
  const aiById = indexById(ai.data);

  return (
    <div>
      <PageHeader
        eyebrow="Publication system"
        title="Publications"
        subtitle="The three official publication families, each phase-gated. Product status and publication status are kept distinct."
      />

      {FAMILY_ORDER.map((family) => {
        const familyPubs = (pubs.data ?? []).filter((p) => p.family === family);
        if (familyPubs.length === 0) return null;
        return (
          <section key={family} style={{ marginBottom: 30 }}>
            <SectionTitle>{FAMILY_LABEL[family]}s</SectionTitle>
            <p style={{ margin: '-6px 0 16px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {FAMILY_QUESTION[family]}
            </p>
            <div style={{ display: 'grid', gap: 14 }}>
              {familyPubs.map((pub) => (
                <Card key={pub.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Vol {pub.volume} · {productById.get(pub.product)?.name ?? pub.product}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3 }}>{pub.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge label={pub.status} tone={authorityTone(pub.authorityStatus)} />
                      <AuthorityBadge state={pub.authorityStatus} />
                    </div>
                  </div>
                  <GateTimeline steps={publicationTimeline(pub, phases.data ?? [])} />
                  <div style={{ marginTop: 16 }}>
                    <MetaGrid
                      rows={[
                        ['Product', productById.get(pub.product)?.name ?? '—'],
                        ['Current owner', pub.ownerAI ? (aiById.get(pub.ownerAI)?.name ?? pub.ownerAI) : '—'],
                        ['Version', pub.version],
                        ['Confidentiality', pub.confidentiality],
                        ['Notes', pub.notes ?? '—'],
                      ]}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
