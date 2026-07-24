import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useCollection } from '../../lib/data';
import { publicationTimeline, FAMILY_LABEL, authorityTone } from '../../lib/derive';
import {
  PageHeader, Card, SectionTitle, MetaGrid, AuthorityBadge, StatusBadge, SeedFlag, GateTimeline, EmptyState,
} from '../../design-system/components';
import type {
  OSSystem, Product, Publication, PublicationPhase, AICollaborator, NextAction, Gate,
} from '../../domain/entities';

export function OverviewPage() {
  const os = useCollection<OSSystem>('osSystems');
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');
  const phases = useCollection<PublicationPhase>('publicationPhases');
  const ai = useCollection<AICollaborator>('aiCollaborators');
  const nextActions = useCollection<NextAction>('nextActions');
  const gates = useCollection<Gate>('gates');

  const scs = (os.data ?? []).find((s) => s.acronym === 'SCS');
  const sosAI = (ai.data ?? []).find((c) => c.name === '#SOS');
  const nextAction = (nextActions.data ?? [])[0];
  const openGates = (gates.data ?? []).filter((g) => g.requiresOwnerApproval && g.status !== 'Approved');

  return (
    <div>
      <PageHeader
        eyebrow="Executive Snapshot"
        title="Where we are"
        subtitle="The current operating state of ShockTheory OS — what is active, what is waiting, and what should happen next. Answerable in under a minute."
        actions={<SeedFlag />}
      />

      {/* Current operating state */}
      <Card glass style={{ marginBottom: 24 }}>
        <SectionTitle>Current operating state</SectionTitle>
        <MetaGrid
          rows={[
            ['ShockTheory OS', scs ? `${scs.name}` : '—'],
            ['SCS version', scs?.version ?? '—'],
            ['Overall status', scs ? <StatusBadge label={scs.status} tone="proposed" /> : '—'],
            ['Constitutional baseline', 'Phase 0 architecture approved · Phase 1 in review'],
            ['#SOS synchronization', sosAI ? <StatusBadge label={sosAI.waitingState ?? 'Advising'} tone="verified" /> : '—'],
          ]}
        />
      </Card>

      {/* Needs your review + Recommended next action */}
      <div className="scs-grid scs-grid--2" style={{ marginBottom: 24 }}>
        <Card>
          <SectionTitle>Needs your review</SectionTitle>
          {openGates.length === 0 ? (
            <EmptyState title="Nothing is waiting on you">
              Only genuine gates appear here — approvals, unresolved constitutional decisions,
              conflicts. Routine updates never become review items.
            </EmptyState>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {openGates.map((g) => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14 }}>{g.name}</span>
                  <AuthorityBadge state={g.authorityStatus} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ borderColor: 'rgba(65,143,255,0.3)' }}>
          <SectionTitle>Recommended next action</SectionTitle>
          {nextAction ? (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>{nextAction.recommendation}</p>
              <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>{nextAction.why}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AuthorityBadge state={nextAction.authorityStatus} />
                {nextAction.requiresOwnerApproval && <StatusBadge label="Needs your approval" tone="review" />}
              </div>
            </div>
          ) : (
            <EmptyState title="No recommendation yet">A single governed next action will appear here.</EmptyState>
          )}
        </Card>
      </div>

      {/* Active products */}
      <SectionTitle>Active products</SectionTitle>
      <div className="scs-grid scs-grid--2" style={{ marginBottom: 28 }}>
        {(products.data ?? []).map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} className="scs-card scs-card--interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{p.ecosystem}</div>
              </div>
              <AuthorityBadge state={p.authorityStatus} />
            </div>
            <p style={{ margin: '12px 0 14px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{p.purpose}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge label={p.lifecycleStage} tone="neutral" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-soft-sky)', fontSize: 13, fontWeight: 600 }}>
                Open <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Current publications */}
      <SectionTitle>Current publications</SectionTitle>
      <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
        {(pubs.data ?? []).map((pub) => (
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
        ))}
      </div>

      {/* AI work */}
      <SectionTitle>AI work</SectionTitle>
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          {(ai.data ?? []).map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--divider)' }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 10 }}>{c.currentTask ?? c.role}</span>
              </div>
              {c.waitingState && <StatusBadge label={c.waitingState} tone="neutral" />}
            </div>
          ))}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Full AI coordination — assignments, waiting states, expected outputs — arrives in Phase 3.
        </p>
      </Card>

      <p style={{ marginTop: 28, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ExternalLink size={13} /> Recent constitutional changes, risks, and artifact quick-links populate as Phases 2–3 land.
      </p>
    </div>
  );
}
