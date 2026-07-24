import { useCollection, indexById } from '../../lib/data';
import { PageHeader, SectionTitle, PublicationCard } from '../../design-system/components';
import { FAMILY_LABEL } from '../../lib/derive';
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
        subtitle="The three official publication families, each phase-gated — living constitutional artifacts, not archived documents. Product status and publication status are kept distinct."
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
                <PublicationCard
                  key={pub.id}
                  pub={pub}
                  phases={phases.data ?? []}
                  productName={productById.get(pub.product)?.name}
                  ownerName={pub.ownerAI ? aiById.get(pub.ownerAI)?.name : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
