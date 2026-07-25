import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, ShieldCheck, ShieldAlert, Clock, Info, ArrowRight, ArrowUpRight,
} from 'lucide-react';
import { useCollection, indexById, useIsSeed } from '../../lib/data';
import { deriveReviews } from '../../lib/reviews';
import { deriveTeam } from '../../lib/team';
import { productExecutiveSummary, currentGateLabel, FAMILY_LABEL, pubDisplayTitle } from '../../lib/derive';
import {
  Card, SectionTitle, StatTile, StatusBadge, DemonstrationBadge, GovernanceBadge,
  DimensionTag, DimensionRow,
} from '../../design-system/components';
import type {
  OSSystem, Product, Publication, PublicationPhase, AICollaborator,
  NextAction, Gate, CanonicalStatement, Update, Artifact, Decision,
  StandingDirective, AssignmentDirective, OperationalHistoryEntry, Team, TeamMembership, Deliverable,
} from '../../domain/entities';
import '../snapshot/snapshot.css';

const QUESTIONS = ['Where are we?', 'What changed?', 'What needs me?', 'What is blocked?', 'What happens next?'];

export function SCSHomePage() {
  const isSeed = useIsSeed();
  const os = useCollection<OSSystem>('osSystems');
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');
  const phases = useCollection<PublicationPhase>('publicationPhases');
  const ai = useCollection<AICollaborator>('aiCollaborators');
  const nextActions = useCollection<NextAction>('nextActions');
  const gates = useCollection<Gate>('gates');
  const canon = useCollection<CanonicalStatement>('canonicalStatements');
  const updates = useCollection<Update>('updates');
  const artifacts = useCollection<Artifact>('artifacts');
  const decisions = useCollection<Decision>('decisions');
  const decisionCount = (decisions.data ?? []).length;
  const standingDirectives = useCollection<StandingDirective>('standingDirectives');
  const assignmentDirectives = useCollection<AssignmentDirective>('assignmentDirectives');
  const operationalHistory = useCollection<OperationalHistoryEntry>('operationalHistory');
  const teams = useCollection<Team>('teams');
  const teamMemberships = useCollection<TeamMembership>('teamMemberships');
  const deliverables = useCollection<Deliverable>('deliverables');

  const [filter, setFilter] = useState<'all' | 'Approval' | 'Unresolved decision'>('all');

  const scs = (os.data ?? []).find((s) => s.acronym === 'SCS');
  const sosAI = (ai.data ?? []).find((c) => c.name === '#SOS');
  const nextAction = (nextActions.data ?? [])[0];
  const productList = products.data ?? [];
  const pubList = pubs.data ?? [];
  const phaseList = phases.data ?? [];
  const productById = indexById(products.data);

  // ---- Reviews (each opens a decision workspace) ----
  const reviews = deriveReviews({
    gates: gates.data ?? [],
    publications: pubList,
    products: productList,
    artifacts: artifacts.data ?? [],
    aiCollaborators: ai.data ?? [],
    isSeed,
  });
  const approvals = reviews.filter((r) => r.kind === 'Approval');
  const unresolved = reviews.filter((r) => r.kind === 'Unresolved decision');
  const shownReviews = filter === 'all' ? reviews : reviews.filter((r) => r.kind === filter);
  const nextActionReview = reviews.find((r) => nextAction && r.id.includes('chipn'));

  // ---- Constitutional awareness (what / why / next) ----
  const missingCanon = (canon.data ?? []).filter((c) => c.classification === 'I' && !c.statement.trim());
  const unverifiedRefs = (artifacts.data ?? []).filter((a) => a.linkHealth === 'unverified' || a.linkHealth === 'broken');
  const undatedLocks = (updates.data ?? []).filter((u) => u.code === 'ST-LOCK' && !u.date && u.demonstration);
  const noDecisions = decisionCount === 0;
  const awareness = [
    missingCanon.length && {
      what: `${missingCanon.length} Class I canonical statements have no approved wording`,
      why: 'Canonical language must not be referenced before it is written and approved.',
      next: 'Enter and approve the wording, or reclassify the statements.',
    },
    noDecisions && {
      what: 'No governed Product Owner decisions are recorded',
      why: 'Constitutional states cannot yet trace to an approving decision.',
      next: 'The Decision Register (Phase 2) will record approvals as governed decisions.',
    },
    unverifiedRefs.length && {
      what: `${unverifiedRefs.length} document references are unverified`,
      why: 'SCS must know every governing artifact still resolves to its authoritative source.',
      next: 'Verify each source link and record its last-verified date.',
    },
    undatedLocks.length && {
      what: `${undatedLocks.length} constitutional change is recorded without a date`,
      why: 'A locked change (Cue Phase 4 approval) has incomplete provenance.',
      next: 'Record the approval date and the governing decision.',
    },
  ].filter(Boolean) as Array<{ what: string; why: string; next: string }>;

  const activity = [...(updates.data ?? [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const latestChange = activity[0];
  const team = deriveTeam({
    agents: ai.data ?? [], decisions: decisions.data ?? [], products: products.data ?? [],
    standingDirectives: standingDirectives.data ?? [], assignmentDirectives: assignmentDirectives.data ?? [],
    operationalHistory: operationalHistory.data ?? [], teams: teams.data ?? [], teamMemberships: teamMemberships.data ?? [],
    deliverables: deliverables.data ?? [], gates: gates.data ?? [], isSeed,
  });

  return (
    <div>
      {isSeed && (
        <div className="scs-demo-banner">
          <Info size={18} className="scs-demo-banner__icon" />
          <div>
            <div className="scs-demo-banner__title">Phase 1 functional demonstration shell</div>
            <div className="scs-demo-banner__body">
              Governed decision records and constitutional activity shown here are <strong>real Product Owner
              rulings</strong> from the version-controlled decision source. Operational data (products, publications,
              coordination) is <strong>demonstration</strong> and marked as such — never counted as a real metric,
              cited as provenance, or exported as governed truth. No production implementation is authorized.
            </div>
          </div>
        </div>
      )}

      {/* 1 — Current Constitutional State */}
      <section className="scs-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <p className="scs-hero__eyebrow">SCS Home · Constitutional command center</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scs?.constitutionalReview && <GovernanceBadge />}
            {isSeed && <DemonstrationBadge />}
          </div>
        </div>
        <h1 className="scs-hero__title">Current Constitutional State</h1>
        <div className="scs-hero__questions">
          {QUESTIONS.map((q) => <span key={q}>{q}</span>)}
        </div>
        <div className="scs-hero__stats">
          <StatTile small value={scs?.version ?? '—'} label="SCS version" />
          <StatTile small value={scs?.status ?? '—'} label="Overall status" />
          <StatTile small tone="accent" value={sosAI?.syncState ?? '—'} label={`Constitutional sync${sosAI?.lastSynced ? ` · ${sosAI.lastSynced}` : ''}`} />
          <StatTile tone="review" value={reviews.length} label="Awaiting you" />
        </div>
        <p className="scs-hero__baseline">
          <Link to="/decisions" className="scs-section-link">{decisionCount} governed decisions</Link> are recorded in the
          interim decision source (ST-LOCK). #SOS role: constitutional guardian — separate from its synchronization state above.
        </p>
      </section>

      {/* Phase status — four states represented separately; no production authorization implied. */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Phase status</SectionTitle>
        <Card>
          {[
            { label: 'Phase 0 — Architecture', state: 'Approved', tone: 'approved' as const, note: 'Stack, data model, and deployment path locked.' },
            { label: 'Phase 1 — Design baseline', state: 'Approved', tone: 'approved' as const, note: 'Executive Snapshot visual direction approved.' },
            { label: 'Phase 1 — Functional shell', state: 'Functional demonstration shell', tone: 'review' as const, note: 'Current work — under Product Owner review.' },
            { label: 'Production implementation', state: 'Not authorized', tone: 'neutral' as const, note: 'No Product Owner implementation ruling recorded.' },
          ].map((p) => (
            <div key={p.label} className="scs-row">
              <div className="scs-row__main">
                <div className="scs-row__title">{p.label}</div>
                <div className="scs-row__sub">{p.note}</div>
              </div>
              <StatusBadge label={p.state} tone={p.tone} />
            </div>
          ))}
        </Card>
      </section>

      {/* 2 — If You Do One Thing Today (strongest action, directly below the header) */}
      {nextAction && (
        <section className="scs-snapshot__layer">
          <div className="scs-nextaction">
            <p className="scs-nextaction__eyebrow"><Target size={14} /> If you do one thing today</p>
            <h2 className="scs-nextaction__title">{nextAction.recommendation}</h2>
            <p className="scs-nextaction__why">{nextAction.why}</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {nextActionReview ? (
                <Link className="scs-btn scs-btn--primary" to={`/review/${nextActionReview.id}`}>
                  Review this decision <ArrowRight size={15} />
                </Link>
              ) : null}
              {nextAction.requiresOwnerApproval && <StatusBadge label="Needs your approval" tone="review" />}
            </div>
          </div>
        </section>
      )}

      {/* 3 — What Needs You (reconciled metrics + actionable list) */}
      <section className="scs-snapshot__layer">
        <div className="scs-section-head">
          <SectionTitle>What needs you</SectionTitle>
          {reviews.length > 1 && (
            <Link className="scs-section-link" to={`/review/${reviews[0].id}`}>Review Decision Packet →</Link>
          )}
        </div>
        <Card>
          <p className="scs-metric-note">
            <strong style={{ color: 'var(--text-secondary)' }}>{reviews.length} items awaiting you</strong>
            {reviews.length > 0 && ` — ${approvals.length} approval${approvals.length === 1 ? '' : 's'} and ${unresolved.length} unresolved decision${unresolved.length === 1 ? '' : 's'}. These categories do not overlap.`}
            {' '}Select a count to filter the list.
          </p>
          <div className="scs-decisions__counts" style={{ marginBottom: 18 }}>
            <button className={`scs-metric-tile${filter === 'all' ? ' scs-metric-tile--active' : ''}`} onClick={() => setFilter('all')}>
              <StatTile value={reviews.length} label="Total awaiting you" tone={reviews.length ? 'review' : 'muted'} />
            </button>
            <button className={`scs-metric-tile${filter === 'Approval' ? ' scs-metric-tile--active' : ''}`} onClick={() => setFilter('Approval')}>
              <StatTile value={approvals.length} label="Approvals waiting" tone={approvals.length ? 'accent' : 'muted'} />
            </button>
            <button className={`scs-metric-tile${filter === 'Unresolved decision' ? ' scs-metric-tile--active' : ''}`} onClick={() => setFilter('Unresolved decision')}>
              <StatTile value={unresolved.length} label="Unresolved decisions" tone={unresolved.length ? 'accent' : 'muted'} />
            </button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {shownReviews.map((r) => (
              <Link key={r.id} to={`/review/${r.id}`} className="scs-review-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{r.title}</div>
                  <div style={{ marginTop: 8 }}>
                    <DimensionRow>
                      <DimensionTag label="Type" tone="work">{r.kind}</DimensionTag>
                      <DimensionTag label="Authority" tone="authority">{r.authority}</DimensionTag>
                    </DimensionRow>
                  </div>
                </div>
                <span className="scs-review-row__cta">Review decision <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      {/* 4 — Risks & Constitutional Awareness */}
      <section className="scs-snapshot__layer">
        <SectionTitle>Risks & constitutional awareness</SectionTitle>
        <Card>
          {awareness.length === 0 ? (
            <div className="scs-awareness--clear"><ShieldCheck size={18} /> No constitutional conflicts detected.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, color: 'var(--status-review)' }}>
                <ShieldAlert size={18} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{awareness.length} constitutional signals{isSeed ? ' (evaluating demonstration data)' : ''}</span>
              </div>
              {awareness.map((a) => (
                <div className="scs-aw3" key={a.what}>
                  <div className="scs-aw3__what"><ShieldAlert size={15} style={{ color: 'var(--status-review)', marginTop: 2, flex: 'none' }} /> {a.what}</div>
                  <div className="scs-aw3__grid">
                    <div><div className="scs-aw3__k">Why it matters</div><div className="scs-aw3__v">{a.why}</div></div>
                    <div><div className="scs-aw3__k">What should happen next</div><div className="scs-aw3__v">{a.next}</div></div>
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
      </section>

      {/* 5 — What Changed */}
      <section className="scs-snapshot__layer">
        <div className="scs-section-head">
          <SectionTitle>What changed</SectionTitle>
          <Link className="scs-section-link" to="/updates">Update Log →</Link>
        </div>
        <Card>
          {latestChange ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span className="scs-activity__code" style={{ flex: 'none' }}>{latestChange.code}</span>
              <div>
                <div style={{ fontSize: 14.5 }}>{latestChange.summary}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                  {latestChange.date || 'undated'} · via {latestChange.source ?? 'unknown'} · {latestChange.syncStatus}
                </div>
              </div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>No changes recorded.</span>
          )}
        </Card>
      </section>

      {/* 6 — Compact Product & Publication summary (two-column) */}
      <section className="scs-snapshot__layer">
        <div className="scs-home-cols">
          <div>
            <div className="scs-section-head">
              <SectionTitle>Products</SectionTitle>
              <Link className="scs-section-link" to="/products">All products →</Link>
            </div>
            <Card>
              {productList.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="scs-row scs-row-link">
                  <div className="scs-row__main">
                    <div className="scs-row__title">{p.name}</div>
                    <div className="scs-row__sub">{productExecutiveSummary(p, pubList, phaseList)}</div>
                  </div>
                  <DimensionTag label="Record" tone="authority">{p.authorityStatus}</DimensionTag>
                </Link>
              ))}
            </Card>
          </div>
          <div>
            <div className="scs-section-head">
              <SectionTitle>Publications</SectionTitle>
              <Link className="scs-section-link" to="/publications">All publications →</Link>
            </div>
            <Card>
              {pubList.map((pub) => (
                <Link key={pub.id} to="/publications" className="scs-row scs-row-link">
                  <div className="scs-row__main">
                    <div className="scs-row__title">{pubDisplayTitle(pub)}</div>
                    <div className="scs-row__sub">{FAMILY_LABEL[pub.family]} · {productById.get(pub.product)?.name}</div>
                  </div>
                  <DimensionRow>
                    <DimensionTag label="Gate" tone="gate">{currentGateLabel(pub, phaseList)}</DimensionTag>
                    <DimensionTag label="Authority" tone="authority">{pub.authorityStatus}</DimensionTag>
                  </DimensionRow>
                </Link>
              ))}
            </Card>
          </div>
        </div>
      </section>

      {/* 7 — ShockTheory Agent Team (compact summary → Team Command Center) */}
      <section className="scs-snapshot__layer">
        <div className="scs-section-head">
          <SectionTitle>ShockTheory agent team</SectionTitle>
          <Link className="scs-section-link" to="/ai-work">Team Command Center →</Link>
        </div>
        <Card>
          <div className="scs-decisions__counts" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 16 }}>
            <StatTile value={team.metrics.activeAgents.value} label="Active agents" tone="accent" />
            <StatTile value={team.metrics.activeAssignments.value} label="Active assignments" tone="accent" />
            <StatTile value={team.metrics.deliverables.value} label="Deliverables awaiting review" tone={team.metrics.deliverables.value ? 'review' : 'muted'} />
            <StatTile value={team.metrics.waitingPO.value} label="Waiting on you" tone={team.metrics.waitingPO.value ? 'review' : 'muted'} />
            <StatTile value={team.metrics.blocked.value} label="Work blocked" tone={team.metrics.blocked.value ? 'review' : 'muted'} />
            <StatTile value={team.metrics.warnings.value} label="Alignment warnings" tone={team.metrics.warnings.value ? 'review' : 'muted'} />
            <StatTile value={team.metrics.directivesNoWork.value} label="Available — awaiting assignment" tone="muted" />
            <StatTile value={team.metrics.pendingOnboarding.value} label="Pending onboarding" tone={team.metrics.pendingOnboarding.value ? 'review' : 'muted'} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link className="scs-btn scs-btn--primary" to="/ai-work">Open Team Command Center <ArrowRight size={15} /></Link>
            <Link className="scs-btn scs-btn--secondary" to="/decisions">View Active Decisions</Link>
            <Link className="scs-btn scs-btn--secondary" to="/ai-work">Review Alignment</Link>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', marginLeft: 4 }}>Last full-team sync: {team.lastFullSync}</span>
          </div>
        </Card>
      </section>

      {/* 8 — Recent Constitutional Activity (compact; traces to provenance) */}
      <section className="scs-snapshot__layer">
        <div className="scs-section-head">
          <SectionTitle>Recent constitutional activity</SectionTitle>
          <Link className="scs-section-link" to="/updates">Update Log →</Link>
        </div>
        <Card>
          <div className="scs-activity">
            {activity.slice(0, 5).map((u) => {
              const hasDecisions = (u.decisionsCreated?.length ?? 0) > 0;
              const body = (
                <>
                  <span className="scs-activity__code">{u.code}</span>
                  <span className="scs-activity__summary">
                    {u.summary}
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      via {u.source ?? 'unknown'} · {u.syncStatus}
                      {u.demonstration
                        ? <span style={{ color: 'var(--status-review)' }}> · Demonstration</span>
                        : <span style={{ color: 'var(--status-approved)' }}> · Governed record</span>}
                      {hasDecisions && ' · records DEC-0001…DEC-0008'}
                    </span>
                  </span>
                  <span className="scs-activity__date">
                    {u.date ? u.date : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> undated</span>}
                  </span>
                </>
              );
              return hasDecisions ? (
                <Link key={u.id} to="/decisions" className="scs-activity__item scs-row-link" style={{ color: 'inherit', textDecoration: 'none' }}>{body}</Link>
              ) : (
                <div className="scs-activity__item" key={u.id}>{body}</div>
              );
            })}
          </div>
        </Card>
      </section>

      <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowUpRight size={13} /> Every section answers one of the five executive questions. The concise generated briefing lives under Executive Snapshot.
      </p>
    </div>
  );
}
