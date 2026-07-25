import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Check, Clock } from 'lucide-react';
import { useCollection, useIsSeed } from '../../lib/data';
import { deriveReviews } from '../../lib/reviews';
import {
  PageHeader, Card, SectionTitle, MetaGrid, EmptyState, AuthorityBadge,
  DimensionTag, DimensionRow, DemonstrationBadge,
} from '../../design-system/components';
import type { Publication, Product, Gate, Artifact, AICollaborator } from '../../domain/entities';

/**
 * Decision workspace — a review item is never a dead-end alert. Every item opens
 * here with the exact decision, why, sources, rulings, recommendations, the
 * consequences of approving vs deferring, impact, and a clear action.
 */
export function ReviewWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const isSeed = useIsSeed();
  const pubs = useCollection<Publication>('publications');
  const products = useCollection<Product>('products');
  const gates = useCollection<Gate>('gates');
  const artifacts = useCollection<Artifact>('artifacts');
  const ai = useCollection<AICollaborator>('aiCollaborators');

  const reviews = deriveReviews({
    gates: gates.data ?? [], publications: pubs.data ?? [], products: products.data ?? [],
    artifacts: artifacts.data ?? [], aiCollaborators: ai.data ?? [], isSeed,
  });
  const item = reviews.find((r) => r.id === id);

  if (!item) {
    return (
      <div>
        <Back />
        <EmptyState title="Review item not found">This decision may have been resolved or superseded.</EmptyState>
      </div>
    );
  }

  return (
    <div>
      <Back />
      <PageHeader
        eyebrow="Decision workspace"
        title={item.title}
        actions={item.isDemonstration ? <DemonstrationBadge /> : undefined}
      />

      <div style={{ marginBottom: 20 }}>
        <DimensionRow>
          <DimensionTag label="Type" tone="work">{item.kind}</DimensionTag>
          <DimensionTag label="Authority" tone="authority"><AuthorityBadge state={item.authority} /></DimensionTag>
          <DimensionTag label="Gate" tone="gate">Product Owner decision required</DimensionTag>
        </DimensionRow>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>The decision</SectionTitle>
        <MetaGrid
          rows={[
            ['Decision required', item.title],
            ['Why now', item.why],
            ['Affected', item.affects.join(' · ') || '—'],
          ]}
        />
      </Card>

      <div className="scs-home-cols" style={{ marginBottom: 20 }}>
        <Card>
          <SectionTitle>Recommendations</SectionTitle>
          <MetaGrid
            rows={[
              ['Claude recommends', item.claudeRecommendation],
              ['#SOS governance assessment', item.sosAssessment],
              ['Product Owner rulings', item.ownerRulings.length ? item.ownerRulings.join('; ') : 'None recorded'],
            ]}
          />
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            AI participants recommend; they never approve. Authority remains with the Product Owner.
          </p>
        </Card>
        <Card>
          <SectionTitle>Consequences</SectionTitle>
          <MetaGrid
            rows={[
              ['If approved', item.consequencesApprove],
              ['If deferred', item.consequencesDefer],
            ]}
          />
        </Card>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <SectionTitle>Source artifacts</SectionTitle>
        {item.sourceArtifacts.length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>No linked artifacts.</span>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {item.sourceArtifacts.map((a) => (
              <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14 }}>{a.name}</span>
                {a.href && (
                  <a className="scs-btn scs-btn--tertiary" href={a.href} target="_blank" rel="noreferrer">
                    Open source <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="scs-btn scs-btn--primary" onClick={() => alert('Recording a governed decision arrives with the Decision Register in Phase 2. This workspace is the review surface.')}>
          <Check size={15} /> Review decision
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <Clock size={13} /> Recording the ruling as a governed decision arrives in Phase 2.
        </span>
      </div>
    </div>
  );
}

function Back() {
  return (
    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
      <ArrowLeft size={14} /> SCS Home
    </Link>
  );
}
