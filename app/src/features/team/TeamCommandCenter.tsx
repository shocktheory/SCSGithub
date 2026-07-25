import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Info, ExternalLink, X } from 'lucide-react';
import { useCollection, useIsSeed } from '../../lib/data';
import { deriveTeam, type AgentCard } from '../../lib/team';
import {
  PageHeader, Card, SectionTitle, StatTile, StatusBadge, DimensionTag, DimensionRow,
} from '../../design-system/components';
import type { AICollaborator, Assignment, Decision, Product } from '../../domain/entities';
import './team.css';

const DEC = (id?: string) => (id ? id.replace('dec-', 'DEC-').toUpperCase() : undefined);

type View = 'team' | 'assignment' | 'governance';

export function TeamCommandCenter() {
  const isSeed = useIsSeed();
  const agents = useCollection<AICollaborator>('aiCollaborators');
  const assignments = useCollection<Assignment>('assignments');
  const decisions = useCollection<Decision>('decisions');
  const products = useCollection<Product>('products');
  const [view, setView] = useState<View>('team');
  const [filterIds, setFilterIds] = useState<string[] | null>(null);
  const [filterLabel, setFilterLabel] = useState('');

  const model = deriveTeam({
    agents: agents.data ?? [], assignments: assignments.data ?? [],
    decisions: decisions.data ?? [], products: products.data ?? [], isSeed,
  });

  const metricList = Object.values(model.metrics);
  const shown = filterIds ? model.agents.filter((a) => filterIds.includes(a.id)) : model.agents;

  function openMetric(label: string, ids: string[]) {
    setFilterIds(ids); setFilterLabel(label); setView('assignment');
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI Work · Agent operations & governance"
        title="Team Command Center"
        subtitle="The full ShockTheory agent team at a glance — standing responsibilities, current assignments, alignment, blockers, deliverables, and the approved directives governing each role. Not a personnel directory; a coordination surface."
      />

      {isSeed && (
        <div className="scs-demo-banner" style={{ marginBottom: 18 }}>
          <Info size={18} className="scs-demo-banner__icon" />
          <div>
            <div className="scs-demo-banner__title">Governed identities · demonstration operations</div>
            <div className="scs-demo-banner__body">
              Agent names, roles, and authority boundaries are <strong>governed</strong> (real, from the decision source).
              Synchronization states, dates, metrics, and assignments beyond #SCS/#SOS are <strong>Demonstration Data</strong> —
              never counted as actual productivity, approval, alignment, or constitutional truth.
            </div>
          </div>
        </div>
      )}

      {/* Executive metrics — each opens the exact filtered records. */}
      <div className="scs-tc-metrics">
        {metricList.map((mt) => (
          <button key={mt.key} className={`scs-metric-tile${filterIds && filterLabel === mt.label ? ' scs-metric-tile--active' : ''}`}
            onClick={() => openMetric(mt.label, mt.ids)}>
            <StatTile value={mt.value} label={mt.label} tone={mt.value ? (mt.key === 'blocked' || mt.key === 'workNoDirective' ? 'review' : 'accent') : 'muted'} small={false} />
          </button>
        ))}
      </div>
      <p className="scs-metric-note">
        {model.overlaps.length ? model.overlaps.join(' ') : 'Categories are distinct.'} Last full-team constitutional synchronization: {model.lastFullSync}.
      </p>

      {/* Views */}
      <div className="scs-tabs">
        {(['team', 'assignment', 'governance'] as View[]).map((v) => (
          <button key={v} className={`scs-tab${view === v ? ' scs-tab--active' : ''}`} onClick={() => { setView(v); if (v !== 'assignment') { setFilterIds(null); } }}>
            {v === 'team' ? 'Team View' : v === 'assignment' ? 'Assignment View' : 'Governance View'}
          </button>
        ))}
      </div>

      {filterIds && view === 'assignment' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <StatusBadge label={`Filtered: ${filterLabel} (${shown.length})`} tone="review" />
          <button className="scs-btn scs-btn--tertiary" onClick={() => { setFilterIds(null); setFilterLabel(''); }}>
            <X size={13} /> Clear filter
          </button>
        </div>
      )}

      {view === 'team' && (
        <>
          <ProductOwnerCard model={model} />
          <SectionTitle>Agents</SectionTitle>
          <div className="scs-agents">
            {model.agents.map((a) => <AgentCardView key={a.id} a={a} />)}
          </div>
        </>
      )}

      {view === 'assignment' && (
        <Card>
          {shown.filter((a) => a.assignment || !filterIds).map((a) => (
            <div key={a.id} className="scs-row">
              <div className="scs-row__main">
                <div className="scs-row__title">{a.name} — {a.assignment ?? 'No active assignment'}</div>
                <div className="scs-row__sub">
                  {a.affected ? `${a.affected} · ` : ''}{a.deliverable ?? 'No deliverable'}{a.gate ? ` · gate: ${a.gate}` : ''}
                </div>
              </div>
              <DimensionRow>
                <DimensionTag label="Status" tone="work">{a.status}</DimensionTag>
                <DimensionTag label="Alignment" tone={a.alignment === 'Aligned' ? 'maturity' : 'gate'}>{a.alignment}</DimensionTag>
              </DimensionRow>
            </div>
          ))}
        </Card>
      )}

      {view === 'governance' && <GovernanceView model={model} />}
    </div>
  );
}

function AgentCardView({ a }: { a: AgentCard }) {
  return (
    <div>
      <Card className="scs-card--fill">
        <div className="scs-agent__head">
          <div>
            <div className="scs-agent__name">{a.name}</div>
            {a.modelProvider && <div className="scs-agent__provider">{a.modelProvider}</div>}
          </div>
          <DimensionRow>
            <DimensionTag label="Status" tone="work">{a.status}</DimensionTag>
            <DimensionTag label="Alignment" tone={a.alignment === 'Aligned' ? 'maturity' : 'gate'}>{a.alignment}</DimensionTag>
          </DimensionRow>
        </div>
        <p className="scs-agent__role">{a.role}</p>
        {a.standingResponsibility && (
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            <span className="scs-trace__k" style={{ display: 'block' }}>Standing responsibility</span>{a.standingResponsibility}
          </p>
        )}
        <div className="scs-trace">
          <Row k="Current assignment" v={a.assignment ?? '—'} />
          <Row k="Expected deliverable" v={a.deliverable ?? '—'} />
          {a.waitingOn && <Row k="Waiting on" v={a.waitingOn} />}
          <Row k="Blocker / risk" v={a.blocker ?? 'None'} />
          <Row k="Affected" v={a.affected ?? '—'} />
          <Row k="Current gate" v={a.gate ?? 'Not gated'} />
          <Row k="Last synchronization" v={`${a.lastSync}${a.isDemonstration ? ' · demo' : ''}`} />
          <Row k="Directive coverage" v={<StatusBadge label={a.directiveCoverage} tone={a.directiveCoverage === 'Full' ? 'approved' : a.directiveCoverage === 'Partial' ? 'review' : 'risk'} />} />
          <Row k="Role directive" v={a.roleDirectiveId ? <Link className="scs-trace__link" to="/decisions">{DEC(a.roleDirectiveId)} ↗</Link> : <span className="scs-trace__missing">Missing</span>} />
          <Row k="Assignment directive" v={a.assignmentDirectiveId ? <Link className="scs-trace__link" to="/decisions">{DEC(a.assignmentDirectiveId)} ↗</Link> : (a.assignment ? <span className="scs-trace__missing">Missing</span> : '—')} />
          <Row k="Review gate → decision" v={a.reviewGate ? <Link className="scs-trace__link" to="/decisions">{a.reviewGate} ↗</Link> : '—'} />
        </div>
        {a.missingLinks.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.missingLinks.map((m) => (
              <span key={m} className="scs-badge scs-badge--risk"><ShieldAlert size={11} /> {m}</span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="scs-trace__row">
      <div className="scs-trace__k">{k}</div>
      <div className="scs-trace__v">{v}</div>
    </div>
  );
}

function ProductOwnerCard({ model }: { model: ReturnType<typeof deriveTeam> }) {
  const deliverables = model.metrics.deliverables.value;
  const waiting = model.metrics.waitingPO.value;
  return (
    <>
      <SectionTitle>Product Owner</SectionTitle>
      <Card className="scs-po-card" style={{ marginBottom: 26 }}>
        <div className="scs-agent__head">
          <div>
            <div className="scs-agent__name">Sonja Ross</div>
            <div className="scs-agent__provider">Product Owner · final approval authority — not an agent</div>
          </div>
          <DimensionTag label="Authority" tone="authority">Approves</DimensionTag>
        </div>
        <div className="scs-trace" style={{ marginTop: 12 }}>
          <Row k="Decisions awaiting review" v={<Link className="scs-trace__link" to="/decisions">0 pending · view register ↗</Link>} />
          <Row k="Deliverables awaiting review" v={<Link className="scs-trace__link" to="/">{deliverables} · review on SCS Home ↗</Link>} />
          <Row k="Unresolved constitutional rulings" v="3 governed rulings pending confirmation (DEC-0001, DEC-0003, DEC-0005)" />
          <Row k="Approvals due" v={`${waiting} deliverable awaiting Product Owner review`} />
          <Row k="Blocked work needing you" v={`${model.metrics.blocked.value}`} />
          <Row k="Queues" v={<><Link className="scs-trace__link" to="/decisions">Decision queue ↗</Link>{'   '}<Link className="scs-trace__link" to="/">Approval queue ↗</Link></>} />
        </div>
      </Card>
    </>
  );
}

function GovernanceView({ model }: { model: ReturnType<typeof deriveTeam> }) {
  return (
    <Card>
      {model.signals.length === 0 ? (
        <div className="scs-awareness--clear"><ShieldCheck size={18} /> No governance issues detected across the team.</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, color: 'var(--status-review)' }}>
            <ShieldAlert size={18} /><span style={{ fontWeight: 600, fontSize: 14 }}>{model.signals.length} governance signals (evaluating demonstration operations)</span>
          </div>
          {model.signals.map((s) => (
            <div className="scs-aw3" key={s.what}>
              <div className="scs-aw3__what"><ShieldAlert size={15} style={{ color: 'var(--status-review)', marginTop: 2, flex: 'none' }} /> {s.what}</div>
              <div className="scs-aw3__grid">
                <div><div className="scs-aw3__k">Why it matters</div><div className="scs-aw3__v">{s.why}</div></div>
                <div><div className="scs-aw3__k">What should happen next</div><div className="scs-aw3__v">{s.next}</div></div>
              </div>
            </div>
          ))}
        </>
      )}
      <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <ExternalLink size={12} /> Governance checks: missing directive links, authority conflicts, alignment warnings, stale synchronization, unreviewed deliverables, assignments outside role scope, superseded authority.
      </p>
    </Card>
  );
}
