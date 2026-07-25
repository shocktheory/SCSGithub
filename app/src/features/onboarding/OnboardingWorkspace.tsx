import { ShieldCheck, Lock } from 'lucide-react';
import {
  PageHeader, Card, SectionTitle, MetaGrid, StatusBadge, AuthorityBadge,
} from '../../design-system/components';
import { deriveOnboarding, READINESS_LABEL, type ReadinessStatus } from '../../lib/onboarding';
import { cklrCandidate } from '../../seed/onboarding';
import type { DerivedAgentState } from '../../lib/derivation';
import './onboarding.css';

type Tone = 'approved' | 'proposed' | 'verified' | 'review' | 'risk' | 'neutral';
const READINESS_TONE: Record<ReadinessStatus, Tone> = {
  'present-approved': 'approved',
  'present-proposed': 'proposed',
  'pending-approval': 'review',
  missing: 'risk',
  superseded: 'neutral',
  contradictory: 'risk',
  'not-applicable': 'neutral',
};

/**
 * Governed Agent Onboarding Workspace (Phase 3).
 *
 * Shows the completed #CKL-R onboarding: the approved records, the proposal→approval
 * provenance, and the current derived state (Available — Awaiting Assignment). The
 * competitive-research Assignment Directive remains proposed; the derivation preview
 * reuses the Constitutional State Derivation Engine unchanged.
 */
export function OnboardingWorkspace() {
  const c = cklrCandidate;
  const m = deriveOnboarding(c);
  const currentStage = m.stages.find((s) => s.status === 'current');

  return (
    <div>
      <PageHeader
        eyebrow="Phase 3 · Operational Governance & Agent Onboarding"
        title="Governed Agent Onboarding"
        subtitle="A controlled, traceable path from proposed identity to operational availability. Every stage stays distinguishable in the data, the derivation engine, and Operational History. #CKL-R is constitutionally onboarded, activated, and now assigned to Kidlytics competitive research under ST-ADR-2026-005."
      />

      <div className="scs-onb-boundary" style={{ borderColor: 'var(--status-approved)', background: 'color-mix(in srgb, var(--status-approved) 10%, transparent)' }}>
        <ShieldCheck size={20} className="scs-onb-boundary__icon" style={{ color: 'var(--status-approved)' }} />
        <div>
          <p className="scs-onb-boundary__title">Onboarding complete — {c.handle} is activated and assigned</p>
          <p className="scs-onb-boundary__body">
            By Product Owner ruling (2026-07-25), AGENT-006/{c.handle} is constitutionally onboarded and activated
            ({' '}<b>ST-SD-006 Current</b>, <b>TM-009 Active in TEAM-001</b>, <b>ST-OPH-2026-012</b> authoritative), and its
            competitive-research Assignment Directive is approved and Active as <b>ST-ADR-2026-005</b>. {c.handle} derives
            as <b>{m.current.status}</b> on deliverable <b>ST-DLV-2026-004</b>. Findings are advisory evidence only.
          </p>
        </div>
      </div>

      {/* Identity */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Agent identity</SectionTitle>
        <MetaGrid
          rows={[
            ['Canonical identifier', <strong key="i">{c.identity.approvedId ?? c.identity.recommendedId}</strong>],
            ['Handle', <strong key="h">{c.handle}</strong>],
            ['Name', c.name],
            ['Intended team', `${c.intendedTeam.teamId} — ${c.intendedTeam.name}`],
            ['Governing function', c.intendedFunction],
            ['Derived state', <StatusBadge key="s" label={m.statusLabel} tone="approved" />],
            ['Onboarding stage', `${currentStage?.index ?? 8} of 8 — ${currentStage?.name ?? 'Operational availability'}`],
          ]}
        />
      </Card>

      {/* Stage tracker */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Onboarding lifecycle</SectionTitle>
        <div className="scs-onb-stages">
          {m.stages.map((s) => (
            <div key={s.index} className={`scs-onb-stage scs-onb-stage--${s.status}`}>
              <span className="scs-onb-stage__num">{s.index}</span>
              <span className="scs-onb-stage__name">{s.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Readiness checklist */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Constitutional readiness checklist</SectionTitle>
        <div className="scs-onb-check">
          {m.checklist.map((item) => (
            <div className="scs-onb-check__item" key={item.label}>
              <span className="scs-onb-check__label">{item.label}</span>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifySelf: 'end' }}>
                <StatusBadge label={READINESS_LABEL[item.status]} tone={READINESS_TONE[item.status]} />
                <StatusBadge label={item.satisfiesActivationNow ? 'Counts toward activation' : 'Does not activate'} tone={item.satisfiesActivationNow ? 'approved' : 'neutral'} />
              </span>
              <p className="scs-onb-check__detail">{item.detail}</p>
              <p className="scs-onb-check__after"><b>Provenance:</b> {item.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Derived-state view + illustrative preview */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Derived constitutional state</SectionTitle>
        <div className="scs-onb-preview">
          <PreviewColumn cap="Current (approved evidence)" state={m.current} after
            note={m.researchBlocked
              ? 'Activated from approved evidence; no active Assignment Directive ⇒ Available — Awaiting Assignment.'
              : 'Activated from approved evidence, with an approved & Active Assignment Directive (ST-ADR-2026-005) ⇒ Working. Gate: Competitive Research Review; deliverable ST-DLV-2026-004 pending.'} />
          {m.researchBlocked && (
            <PreviewColumn cap="Illustrative — if a research assignment were approved" state={m.withAssignment}
              note="Shown only to reinforce that research is a SEPARATE approval. No such Assignment Directive is active; #CKL-R does not derive as Working today." />
          )}
        </div>
      </Card>

      {/* Proposal → approval provenance */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Proposal → approval provenance</SectionTitle>
        <div className="scs-onb-check">
          {m.provenance.map((p) => (
            <div className="scs-onb-check__item" key={p.record} style={{ gridTemplateColumns: '1fr auto' }}>
              <span className="scs-onb-check__label">{p.record}</span>
              <span style={{ justifySelf: 'end', display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                <span className="scs-onb-rec">{p.from}</span> → <span className="scs-onb-rec">{p.to}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Authority & limitations */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Authority & limitations (ST-SD-006)</SectionTitle>
        <div className="scs-onb-lists">
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-approved)', margin: '0 0 8px' }}>When assigned, may</p>
            <ul>{c.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-risk)', margin: '0 0 8px' }}>Must not</p>
            <ul>{c.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
      </Card>

      {/* Approved record set */}
      <div className="scs-onb-grid" style={{ marginBottom: 16 }}>
        <RecordCard
          title="Standing Directive"
          rows={[
            ['Canonical id', <strong key="i">{c.standingDirective.ref.approvedId}</strong>],
            ['Reconciled from', <span className="scs-onb-rec" key="r">{c.standingDirective.ref.tempRef}</span>],
            ['Title', c.standingDirective.title],
            ['Version', c.standingDirective.version],
            ['Governing authority', c.standingDirective.governingAuthority],
            ['Status', <StatusBadge key="s" label="Current" tone="approved" />],
            ['Authority', <AuthorityBadge key="a" state="approved" />],
          ]}
          text={c.standingDirective.text}
        />
        <RecordCard
          title="Team Membership"
          rows={[
            ['Canonical id', <strong key="i">{c.teamMembership.ref.approvedId}</strong>],
            ['Reconciled from', <span className="scs-onb-rec" key="r">{c.teamMembership.ref.tempRef}</span>],
            ['Team', c.teamMembership.teamId],
            ['Status', <StatusBadge key="s" label="Active" tone="approved" />],
            ['Authority', <AuthorityBadge key="a" state="approved" />],
            ['Note', 'Active membership does not, by itself, authorize research.'],
          ]}
        />
        <RecordCard
          title="Operational History — activation event"
          rows={[
            ['Canonical id', <strong key="i">{c.activationEvent.ref.approvedId}</strong>],
            ['Reconciled from', <span className="scs-onb-rec" key="r">{c.activationEvent.ref.tempRef}</span>],
            ['Evidence type', c.activationEvent.evidenceType],
            ['Authority', <AuthorityBadge key="a" state="approved" />],
            ['Summary', c.activationEvent.summary],
          ]}
        />
        <RecordCard
          title="Assignment Directive — competitive research"
          rows={[
            ['Canonical id', <strong key="i">{c.assignmentDirective.ref.approvedId ?? c.assignmentDirective.ref.recommendedId}</strong>],
            ['Reconciled from', <span className="scs-onb-rec" key="r">{c.assignmentDirective.ref.tempRef}</span>],
            ['Title', c.assignmentDirective.title],
            ['Deliverable', c.assignmentDirective.deliverable],
            ['Review gate', c.assignmentDirective.reviewGate],
            ['Status', <StatusBadge key="s" label={c.assignmentDirective.status} tone={c.assignmentDirective.status === 'Active' ? 'approved' : 'proposed'} />],
          ]}
        />
      </div>

      {/* Research authorization / boundary */}
      {m.researchBlocked ? (
        <div className="scs-onb-boundary" style={{ borderColor: 'var(--status-risk)', background: 'color-mix(in srgb, var(--status-risk) 8%, transparent)' }}>
          <Lock size={20} className="scs-onb-boundary__icon" style={{ color: 'var(--status-risk)' }} />
          <div>
            <p className="scs-onb-boundary__title">Competitive research is blocked</p>
            <p className="scs-onb-boundary__body">
              Activation is not assignment. No competitive research may begin until a <b>separate</b> Product Owner
              directive approves and activates a competitive-research Assignment Directive.
            </p>
          </div>
        </div>
      ) : (
        <div className="scs-onb-boundary" style={{ borderColor: 'var(--status-approved)', background: 'color-mix(in srgb, var(--status-approved) 8%, transparent)' }}>
          <ShieldCheck size={20} className="scs-onb-boundary__icon" style={{ color: 'var(--status-approved)' }} />
          <div>
            <p className="scs-onb-boundary__title">Competitive research authorized</p>
            <p className="scs-onb-boundary__body">
              Assignment Directive <b>ST-ADR-2026-005</b> is approved and Active. {c.handle} is authorized to conduct the
              defined Kidlytics competitive research and deliver <b>ST-DLV-2026-004</b> to the Competitive Research Review
              gate. Findings are advisory evidence — they do not automatically modify Kidlytics or authorize implementation.
            </p>
          </div>
        </div>
      )}

      {/* Next Product Owner decision */}
      <Card style={{ margin: '16px 0' }}>
        <SectionTitle>{m.researchBlocked ? 'Product Owner decisions still required' : 'Next Product Owner decision'}</SectionTitle>
        <ol className="scs-onb-decisions">
          {m.requiredDecisions.map((d) => <li key={d}>{d}</li>)}
        </ol>
      </Card>

      {/* Auditability */}
      <Card>
        <SectionTitle>Auditability</SectionTitle>
        <MetaGrid
          rows={[
            ['Initiated by', c.audit.initiatedBy],
            ['Date proposed', c.audit.dateProposed],
            ['Approved by', c.audit.approvedBy ?? '—'],
            ['Date approved', c.audit.dateApproved ?? '—'],
            ['Previous state', 'Proposed / Pending Onboarding — #CKL-R did not previously exist as a governed agent.'],
            ['Resulting state', `${m.statusLabel} (authoritative; present in the constitutional collections).`],
            ['Approval status', <StatusBadge key="a" label="Approved — Product Owner ruling" tone="approved" />],
            ['Provenance', c.audit.provenance],
          ]}
        />
      </Card>
    </div>
  );
}

function PreviewColumn({ cap, state, after, note }: {
  cap: string; state: DerivedAgentState; after?: boolean; note?: string;
}) {
  return (
    <div className={`scs-onb-prev${after ? ' scs-onb-prev--after' : ''}`}>
      <span className="scs-onb-prev__cap">{cap}</span>
      <span className="scs-onb-prev__status">{state.status}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge label={state.activated ? 'Activated' : 'Not activated'} tone={state.activated ? 'approved' : 'neutral'} />
        <StatusBadge label={state.currentGate} tone="neutral" />
      </div>
      {note && <p className="scs-onb-prev__note">{note}</p>}
    </div>
  );
}

function RecordCard({ title, rows, text }: { title: string; rows: Array<[string, React.ReactNode]>; text?: string }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionTitle>{title}</SectionTitle>
      </div>
      <MetaGrid rows={rows} />
      {text && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '12px 0 0' }}>{text}</p>}
    </Card>
  );
}
