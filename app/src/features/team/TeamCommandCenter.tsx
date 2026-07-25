import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Info, ExternalLink, X } from 'lucide-react';
import { useCollection, useIsSeed } from '../../lib/data';
import { deriveTeam, type AgentCard } from '../../lib/team';
import {
  PageHeader, Card, SectionTitle, StatTile, StatusBadge, DimensionTag, DimensionRow,
} from '../../design-system/components';
import type {
  AICollaborator, Decision, Product, StandingDirective, AssignmentDirective, OperationalHistoryEntry,
  Team, TeamMembership, Deliverable, Gate,
} from '../../domain/entities';
import './team.css';

type View = 'team' | 'assignment' | 'governance';
type Density = 'compact' | 'expanded' | 'collapsed';

export function TeamCommandCenter() {
  const isSeed = useIsSeed();
  const agents = useCollection<AICollaborator>('aiCollaborators');
  const decisions = useCollection<Decision>('decisions');
  const products = useCollection<Product>('products');
  const standingDirectives = useCollection<StandingDirective>('standingDirectives');
  const assignmentDirectives = useCollection<AssignmentDirective>('assignmentDirectives');
  const operationalHistory = useCollection<OperationalHistoryEntry>('operationalHistory');
  const teams = useCollection<Team>('teams');
  const teamMemberships = useCollection<TeamMembership>('teamMemberships');
  const deliverables = useCollection<Deliverable>('deliverables');
  const gates = useCollection<Gate>('gates');
  const [view, setView] = useState<View>('team');
  const [density, setDensity] = useState<Density>('compact');
  const [filterIds, setFilterIds] = useState<string[] | null>(null);
  const [filterLabel, setFilterLabel] = useState('');

  const model = deriveTeam({
    agents: agents.data ?? [], decisions: decisions.data ?? [], products: products.data ?? [],
    standingDirectives: standingDirectives.data ?? [], assignmentDirectives: assignmentDirectives.data ?? [],
    operationalHistory: operationalHistory.data ?? [], teams: teams.data ?? [], teamMemberships: teamMemberships.data ?? [],
    deliverables: deliverables.data ?? [], gates: gates.data ?? [], isSeed,
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

      <div className="scs-onb-pointer">
        <span>
          <strong>Phase 3 · Agent onboarding.</strong> AGENT-006/#CKL-R (Kidlytics Competitive Research Agent) is
          constitutionally onboarded and activated — Available — Awaiting Assignment. No research assignment is active.
        </span>
        <Link to="/onboarding" className="scs-onb-pointer__link">
          Open Onboarding Workspace <ExternalLink size={13} />
        </Link>
      </div>

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
          <ProductOwnerCard model={model} docQueue={(decisions.data ?? []).filter((d) => d.queue === 'documentation').length} />
          <div className="scs-section-head">
            <SectionTitle>Agents</SectionTitle>
            <div className="scs-tabs" style={{ margin: 0, border: 'none' }}>
              {(['collapsed', 'compact', 'expanded'] as Density[]).map((d) => (
                <button key={d} className={`scs-tab${density === d ? ' scs-tab--active' : ''}`} style={{ marginRight: 12, fontSize: 12.5, textTransform: 'capitalize' }} onClick={() => setDensity(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="scs-agents">
            {model.agents.map((a) => <AgentCardView key={a.id} a={a} density={density} />)}
          </div>
        </>
      )}

      {view === 'assignment' && (
        <Card>
          {shown.map((a) => (
            <div key={a.id} className="scs-row">
              <div className="scs-row__main">
                <div className="scs-row__title">{a.name} — {a.currentAssignment}</div>
                <div className="scs-row__sub">
                  {a.affected ? `${a.affected} · ` : ''}{a.operationalReadiness}{a.currentGate ? ` · gate: ${a.currentGate}` : ''}
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

function AgentCardView({ a, density }: { a: AgentCard; density: Density }) {
  // Pending onboarding: no divergence/stale/warning — the agent has not yet entered
  // the governed operating environment (Product Owner correction).
  if (a.onboarding) {
    return (
      <div>
        <Card className="scs-card--fill">
          <div className="scs-agent__head">
            <div>
              <div className="scs-agent__name">{a.name}</div>
              {a.modelProvider && <div className="scs-agent__provider">{a.modelProvider}</div>}
            </div>
            <DimensionRow>
              <DimensionTag label="Status" tone="gate">{a.status}</DimensionTag>
              <DimensionTag label="Gate" tone="gate">{a.currentGate}</DimensionTag>
            </DimensionRow>
          </div>
          {density !== 'collapsed' && (
            <>
              <p className="scs-agent__role">{a.role}</p>
              <div className="scs-trace">
                <Row k="Standing directive" v={a.standingDirectiveStatus} />
                <Row k="Current assignment" v={a.currentAssignment} />
                <Row k="Assignment directive" v={a.assignmentDirectiveStatus} />
                <Row k="Synchronization" v={a.synchronization} />
                <Row k="Directive coverage" v={a.directiveCoverage} />
                <Row k="Team membership" v={a.teamMembership} />
              </div>
              <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--status-review)', lineHeight: 1.5 }}>
                <strong>Missing approved activation evidence:</strong> {a.missingEvidence.join(', ') || 'none'}.
                {' '}Requires a Product Owner determination of the authorized activation history.
              </p>
              {a.contradictions.length > 0 && (
                <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--status-risk)', lineHeight: 1.5 }}>
                  <strong>Contradictory evidence:</strong> {a.contradictions.join('; ')}.
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    );
  }
  // Collapsed = identity + status only; Compact = key traceability; Expanded = everything.
  if (density === 'collapsed') {
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
          {a.missingLinks.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--status-risk)' }}>{a.missingLinks.length} missing link(s)</div>
          )}
        </Card>
      </div>
    );
  }
  const expanded = density === 'expanded';
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
        {expanded && a.standingResponsibility && (
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            <span className="scs-trace__k" style={{ display: 'block' }}>Standing responsibility</span>{a.standingResponsibility}
          </p>
        )}
        <div className="scs-trace">
          <Row k="Operational readiness" v={a.operationalReadiness} />
          <Row k="Standing directive" v={a.roleDirectiveId ? <Link className="scs-trace__link" to="/standing-directives">{a.standingDirectiveStatus} ↗</Link> : <span className="scs-trace__missing">None on record</span>} />
          <Row k="Current assignment" v={a.currentAssignment} />
          <Row k="Synchronization" v={a.synchronization} />
          <Row k="Directive coverage" v={<StatusBadge label={a.directiveCoverage} tone={a.directiveCoverage === 'Full' ? 'approved' : a.directiveCoverage === 'Partial' ? 'review' : 'risk'} />} />
          <Row k="Current gate" v={a.currentGate} />
          <Row k="Assignment directive" v={a.assignmentDirectiveId ? <Link className="scs-trace__link" to="/assignment-directives">{a.assignmentDirectiveStatus} ↗</Link> : a.assignmentDirectiveStatus} />
          <Row k="Team membership" v={a.teamMembership} />
          {expanded && <Row k="Expected deliverable" v={a.deliverable ?? '—'} />}
          {expanded && a.waitingOn && <Row k="Waiting on" v={a.waitingOn} />}
          {expanded && <Row k="Blocker / risk" v={a.blocker ?? 'None'} />}
          {expanded && <Row k="Affected" v={a.affected ?? '—'} />}
        </div>
        {a.missingLinks.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.missingLinks.map((m) => (
              <span key={m} className="scs-badge scs-badge--risk"><ShieldAlert size={11} /> {m}</span>
            ))}
          </div>
        )}
        {a.contradictions.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--status-risk)', lineHeight: 1.5 }}>
            <strong>Contradictory evidence:</strong> {a.contradictions.join('; ')}.
          </div>
        )}
        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--divider)' }}>
            <div className="scs-trace__k" style={{ marginBottom: 6 }}>Derived from · source records → logic</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {a.trace.sourceRecords.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{a.trace.logic}</p>
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

function ProductOwnerCard({ model, docQueue }: { model: ReturnType<typeof deriveTeam>; docQueue: number }) {
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
          <Row k="Decisions awaiting your action" v={<Link className="scs-trace__link" to="/">2 review items · on SCS Home ↗</Link>} />
          <Row k="Historical decisions awaiting documentation" v={<Link className="scs-trace__link" to="/decisions">{docQueue} pending confirmation (ST-DEC-2026-001/003/005) ↗</Link>} />
          <Row k="Deliverables awaiting review" v={<Link className="scs-trace__link" to="/deliverables">{deliverables} · Phase 2 (ST-DLV-2026-002) ↗</Link>} />
          <Row k="Approvals due" v={`${waiting} deliverable awaiting Product Owner review`} />
          <Row k="Blocked work needing you" v={`${model.metrics.blocked.value}`} />
          <Row k="Queues" v={<><Link className="scs-trace__link" to="/decisions">Decision register ↗</Link>{'   '}<Link className="scs-trace__link" to="/">Approval queue ↗</Link></>} />
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
