import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useCollection } from '../../lib/data';
import {
  PageHeader, Card, SectionTitle, MetaGrid, StatusBadge, AuthorityBadge, GateTimeline, EmptyState,
} from '../../design-system/components';
import { FAMILY_LABEL, publicationTimeline, authorityTone } from '../../lib/derive';
import type {
  Product, Publication, PublicationPhase, Assignment, AICollaborator, Artifact,
} from '../../domain/entities';

export function ProductCommandPage() {
  const { id } = useParams<{ id: string }>();
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');
  const phases = useCollection<PublicationPhase>('publicationPhases');
  const assignments = useCollection<Assignment>('assignments');
  const ai = useCollection<AICollaborator>('aiCollaborators');
  const artifacts = useCollection<Artifact>('artifacts');

  const product = (products.data ?? []).find((p) => p.id === id);
  const aiById = new Map((ai.data ?? []).map((c) => [c.id, c]));

  if (products.isLoading) return null;
  if (!product) {
    return (
      <div>
        <BackLink />
        <EmptyState title="Product not found">This product isn’t in the workspace. It may have been renamed or removed.</EmptyState>
      </div>
    );
  }

  const productPubs = (pubs.data ?? []).filter((p) => p.product === product.id);
  const productAssignments = (assignments.data ?? []).filter((a) => a.product === product.id);

  return (
    <div>
      <BackLink />
      <PageHeader
        eyebrow="Product command page"
        title={product.name}
        subtitle={product.purpose}
        actions={<AuthorityBadge state={product.authorityStatus} />}
      />

      <Card style={{ marginBottom: 24 }}>
        <SectionTitle>Product identity</SectionTitle>
        <MetaGrid
          rows={[
            ['Ecosystem', product.ecosystem],
            ['Lifecycle stage', <StatusBadge label={product.lifecycleStage} tone="neutral" key="s" />],
            ['Status', product.status],
            ['Owner', product.owner],
            ['Current benchmark', product.currentBenchmark ?? '—'],
            ['Notes', product.notes ?? '—'],
          ]}
        />
      </Card>

      <SectionTitle>Publications</SectionTitle>
      <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
        {productPubs.length === 0 ? (
          <EmptyState title="No publications yet">Publications for this product will appear here as they are created.</EmptyState>
        ) : (
          productPubs.map((pub) => (
            <Card key={pub.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {FAMILY_LABEL[pub.family]} · Vol {pub.volume}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 3 }}>{pub.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge label={pub.status} tone={authorityTone(pub.authorityStatus)} />
                  <AuthorityBadge state={pub.authorityStatus} />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <GateTimeline steps={publicationTimeline(pub, phases.data ?? [])} />
              </div>
            </Card>
          ))
        )}
      </div>

      <SectionTitle>Current AI assignments</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        {productAssignments.length === 0 ? (
          <EmptyState title="No active assignments">AI collaborators assigned to this product will appear here.</EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {productAssignments.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{aiById.get(a.collaborator)?.name ?? a.collaborator}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 10 }}>{a.task}</span>
                </div>
                {a.waitingState && <StatusBadge label={a.waitingState} tone="neutral" />}
              </div>
            ))}
          </div>
        )}
      </Card>

      <SectionTitle>Documentation & artifacts</SectionTitle>
      <Card>
        <div style={{ display: 'grid', gap: 10 }}>
          {(artifacts.data ?? []).map((a) => {
            const href = a.openLink ?? a.repoURL ?? a.productionURL;
            return (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.type} · link {a.linkHealth}</div>
                </div>
                {href ? (
                  <a className="scs-btn scs-btn--tertiary" href={href} target="_blank" rel="noreferrer">
                    Open source <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No link</span>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
          The full Artifact Registry — folder paths, link health, verification — is shared across products; product-scoped filtering arrives with the registry work.
        </p>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
      <ArrowLeft size={14} /> Products
    </Link>
  );
}
