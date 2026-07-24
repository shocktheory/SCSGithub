import { Target, ShieldCheck, ShieldAlert, CircleCheck, Clock } from 'lucide-react';
import { useCollection, indexById } from '../../lib/data';
import {
  Card, SectionTitle, StatTile, StatusBadge, AuthorityBadge, SeedFlag,
  ProductCard, PublicationCard, AICoordinationRow, EmptyState,
} from '../../design-system/components';
import type {
  OSSystem, Product, Publication, PublicationPhase, AICollaborator, Assignment,
  NextAction, Gate, CanonicalStatement, Update,
} from '../../domain/entities';
import './snapshot.css';

const QUESTIONS = ['Where are we?', 'What changed?', 'What needs me?', 'What is blocked?', 'What happens next?'];

export function ExecutiveSnapshotPage() {
  const os = useCollection<OSSystem>('osSystems');
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');
  const phases = useCollection<PublicationPhase>('publicationPhases');
  const ai = useCollection<AICollaborator>('aiCollaborators');
  const assignments = useCollection<Assignment>('assignments');
  const nextActions = useCollection<NextAction>('nextActions');
  const gates = useCollection<Gate>('gates');
  const canon = useCollection<CanonicalStatement>('canonicalStatements');
  const updates = useCollection<Update>('updates');

  const scs = (os.data ?? []).find((s) => s.acronym === 'SCS');
  const sosAI = (ai.data ?? []).find((c) => c.name === '#SOS');
  const nextAction = (nextActions.data ?? [])[0];
  const productList = products.data ?? [];
  const pubList = pubs.data ?? [];
  const phaseList = phases.data ?? [];
  const productById = indexById(products.data);
  const aiById = indexById(ai.data);

  // ---- Immediate decisions (quantities first) ----
  const openGates = (gates.data ?? []).filter((g) => g.requiresOwnerApproval && g.status !== 'Approved');
  const unresolved = pubList.filter((p) => /pending|decision/i.test(p.status));
  const proposalsToReview = (nextActions.data ?? []).filter((n) => n.requiresOwnerApproval);
  const reviewItems = [
    ...openGates.map((g) => ({ id: g.id, label: `Cue · ${g.name}`, state: g.authorityStatus })),
    ...unresolved.map((p) => ({ id: p.id, label: `${p.title} · discovery & lifecycle decisions`, state: p.authorityStatus })),
  ];
  const reviewTotal = reviewItems.length;

  // ---- Constitutional awareness (the compiler) ----
  const missingCanon = (canon.data ?? []).filter((c) => c.classification === 'I' && !c.statement.trim());
  const undatedLocks = (updates.data ?? []).filter((u) => u.code === 'ST-LOCK' && !u.date);
  const aiConflicts = (ai.data ?? []).flatMap((c) => c.conflictsDetected);
  const awareness = [
    missingCanon.length && {
      text: `${missingCanon.length} Class I canonical statements are missing approved wording`,
      sub: 'Canonical language should not be referenced before its wording is entered and approved.',
    },
    undatedLocks.length && {
      text: `${undatedLocks.length} constitutional change recorded without a date`,
      sub: 'A locked change (Cue Phase 4 approval) has no date on record — provenance is incomplete.',
    },
    aiConflicts.length && {
      text: `${aiConflicts.length} AI collaborator conflict(s) detected`,
      sub: aiConflicts.join('; '),
    },
  ].filter(Boolean) as Array<{ text: string; sub: string }>;

  // ---- Recent constitutional activity ----
  const activity = [...(updates.data ?? [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div>
      {/* Layer 1 — Current Operating State (Mission Control) */}
      <section className="scs-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <p className="scs-hero__eyebrow">Executive Snapshot</p>
          <SeedFlag />
        </div>
        <h1 className="scs-hero__title">Current Constitutional State</h1>
        <div className="scs-hero__questions">
          {QUESTIONS.map((q) => <span key={q}>{q}</span>)}
        </div>
        <div className="scs-hero__stats">
          <StatTile small value={scs?.version ?? '—'} label="SCS version" />
          <StatTile small value={scs?.status ?? '—'} label="Overall status" />
          <StatTile small tone="accent" value={sosAI?.waitingState ?? 'Advising'} label="#SOS synchronization" />
          <StatTile tone="review" value={reviewTotal} label="Awaiting you" />
        </div>
        <p className="scs-hero__baseline">
          Constitutional baseline · Phase 0 architecture approved · Phase 1 approved as design baseline · Executive Snapshot in review
        </p>
      </section>

      {/* Layer 2 — Immediate Decisions */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Immediate decisions</SectionTitle>
        <Card>
          <div className="scs-decisions__counts">
            <StatTile value={openGates.length} label="Approvals waiting" tone={openGates.length ? 'review' : 'muted'} />
            <StatTile value={proposalsToReview.length} label="Constitutional reviews" tone={proposalsToReview.length ? 'accent' : 'muted'} />
            <StatTile value={unresolved.length} label="Unresolved decisions" tone={unresolved.length ? 'accent' : 'muted'} />
          </div>
          {reviewItems.length === 0 ? (
            <EmptyState title="Nothing is waiting on you">
              Only genuine gates appear here — approvals, unresolved constitutional decisions, and
              conflicts. Routine updates never become review items.
            </EmptyState>
          ) : (
            <div className="scs-decisions__list">
              {reviewItems.map((item) => (
                <div className="scs-decisions__item" key={item.id}>
                  <span style={{ fontSize: 14 }}>{item.label}</span>
                  <AuthorityBadge state={item.state} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Layer 3 — Risks & Constitutional Awareness */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Risks & constitutional awareness</SectionTitle>
        <Card>
          {awareness.length === 0 ? (
            <div className="scs-awareness--clear">
              <ShieldCheck size={18} /> No constitutional conflicts detected. The operating system is consistent.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--status-review)' }}>
                <ShieldAlert size={18} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {awareness.length} constitutional {awareness.length === 1 ? 'signal' : 'signals'} to review
                </span>
              </div>
              {awareness.map((a) => (
                <div className="scs-awareness__item" key={a.text}>
                  <ShieldAlert size={16} className="scs-awareness__icon" style={{ color: 'var(--status-review)' }} />
                  <div>
                    <div className="scs-awareness__text">{a.text}</div>
                    <div className="scs-awareness__sub">{a.sub}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Constitutional Awareness continuously evaluates the health of the operating system — the constitutional equivalent of a compiler. It becomes a primary section in Phase 2.
          </p>
        </Card>
      </section>

      {/* Layer 4 — Recommended Next Action (elevated) */}
      {nextAction && (
        <section className="scs-snapshot__layer">
          <div className="scs-nextaction">
            <p className="scs-nextaction__eyebrow"><Target size={14} /> If you do one thing today</p>
            <h2 className="scs-nextaction__title">{nextAction.recommendation}</h2>
            <p className="scs-nextaction__why">{nextAction.why}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <AuthorityBadge state={nextAction.authorityStatus} />
              {nextAction.requiresOwnerApproval && <StatusBadge label="Needs your approval" tone="review" />}
              {nextAction.affectedScope && (
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Affects · {pubList.find((p) => p.id === nextAction.affectedScope)?.title ?? nextAction.affectedScope}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Layer 5 — Products */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Products</SectionTitle>
        <div className="scs-grid scs-grid--2">
          {productList.map((p) => (
            <ProductCard key={p.id} product={p} publications={pubList} phases={phaseList} />
          ))}
        </div>
      </section>

      {/* Layer 6 — Publications */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Publications</SectionTitle>
        <div style={{ display: 'grid', gap: 14 }}>
          {pubList.map((pub) => (
            <PublicationCard
              key={pub.id}
              pub={pub}
              phases={phaseList}
              productName={productById.get(pub.product)?.name}
              ownerName={pub.ownerAI ? aiById.get(pub.ownerAI)?.name : undefined}
            />
          ))}
        </div>
      </section>

      {/* Layer 7 — AI Coordination */}
      <section className="scs-snapshot__layer">
        <SectionTitle>AI coordination</SectionTitle>
        <Card>
          {(ai.data ?? []).map((c) => (
            <AICoordinationRow
              key={c.id}
              collaborator={c}
              assignment={(assignments.data ?? []).find((a) => a.collaborator === c.id)}
            />
          ))}
        </Card>
      </section>

      {/* Layer 8 — Recent Constitutional Activity */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Recent constitutional activity</SectionTitle>
        <Card>
          {activity.length === 0 ? (
            <EmptyState title="No activity recorded yet">Constitutional events — locks, approvals, benchmarks, supersessions — will stream here.</EmptyState>
          ) : (
            <div className="scs-activity">
              {activity.map((u) => (
                <div className="scs-activity__item" key={u.id}>
                  <span className="scs-activity__code">{u.code}</span>
                  <span className="scs-activity__summary">{u.summary}</span>
                  <span className="scs-activity__date">
                    {u.date ? u.date : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> undated</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <CircleCheck size={13} /> Every layer supports one of the five executive questions, progressing from strategic awareness to operational detail.
      </p>
    </div>
  );
}
