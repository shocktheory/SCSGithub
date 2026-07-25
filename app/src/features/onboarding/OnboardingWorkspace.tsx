import { ShieldAlert, Lock } from 'lucide-react';
import {
  PageHeader, Card, SectionTitle, MetaGrid, StatusBadge, AuthorityBadge, DemonstrationBadge,
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
 * Shows the PROPOSED #CKL-R onboarding package and the effect of approval BEFORE any
 * authority is created. Everything here is nonauthoritative; nothing is activated. The
 * derivation preview reuses the Constitutional State Derivation Engine unchanged.
 */
export function OnboardingWorkspace() {
  const c = cklrCandidate;
  const m = deriveOnboarding(c);

  return (
    <div>
      <PageHeader
        eyebrow="Phase 3 · Operational Governance & Agent Onboarding"
        title="Governed Agent Onboarding"
        subtitle="A controlled, traceable path from proposed identity to operational availability. Every stage stays distinguishable in the data, the derivation engine, and Operational History. Preparing these records is not approval — only an explicit Product Owner ruling approves them or activates the agent."
        actions={<DemonstrationBadge />}
      />

      <div className="scs-onb-boundary">
        <ShieldAlert size={20} className="scs-onb-boundary__icon" />
        <div>
          <p className="scs-onb-boundary__title">Product Owner approval boundary — nothing here is authoritative</p>
          <p className="scs-onb-boundary__body">
            The complete {c.handle} package below is <b>proposed</b>. No canonical identifier has been assigned,
            no Standing Directive is Current, no Team Membership is Active, and the activation event is nonauthoritative.
            {' '}<b>{c.handle} is not activated</b> and no competitive research has begun. The derivation engine still
            reports only the state that approved evidence supports.
          </p>
        </div>
      </div>

      {/* Identity */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Candidate identity</SectionTitle>
        <MetaGrid
          rows={[
            ['Handle', <strong key="h">{c.handle}</strong>],
            ['Name', c.name],
            ['Proposed identity', <span key="id"><span className="scs-onb-rec">{c.identity.tempRef}</span> · recommended <span className="scs-onb-rec">{c.identity.recommendedId}</span></span>],
            ['Intended team', `${c.intendedTeam.teamId} — ${c.intendedTeam.name}`],
            ['Intended function', c.intendedFunction],
            ['Onboarding status', <StatusBadge key="s" label={m.statusLabel} tone="proposed" />],
            ['Onboarding stage', `${m.stages.find((s) => s.status === 'current')?.index ?? '—'} of 8 — ${m.stages.find((s) => s.status === 'current')?.name ?? 'complete'}`],
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
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Present-but-proposed is not governing authority. No item below currently satisfies activation.
        </p>
        <div className="scs-onb-check">
          {m.checklist.map((item) => (
            <div className="scs-onb-check__item" key={item.label}>
              <span className="scs-onb-check__label">{item.label}</span>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifySelf: 'end' }}>
                <StatusBadge label={READINESS_LABEL[item.status]} tone={READINESS_TONE[item.status]} />
                <StatusBadge label={item.satisfiesActivationNow ? 'Counts toward activation' : 'Does not activate'} tone={item.satisfiesActivationNow ? 'approved' : 'neutral'} />
              </span>
              <p className="scs-onb-check__detail">{item.detail}</p>
              <p className="scs-onb-check__after"><b>On approval:</b> {item.afterApproval}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Preview before approval */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Preview — the effect of approval, before any authority is created</SectionTitle>
        <div className="scs-onb-preview">
          <PreviewColumn cap="Now (nothing approved)" state={m.before} showMissing />
          <PreviewColumn
            cap="If onboarding records approved"
            state={m.afterActivation}
            after
            note="Approving identity, Standing Directive, activation authority, the activation event, and TEAM-001 membership would activate #CKL-R and make it assignment-ready. No research begins — there is no active Assignment Directive yet."
          />
          <PreviewColumn
            cap="If research assignment also approved"
            state={m.afterAssignment}
            after
            note="Only a SEPARATE approval that activates the competitive-research Assignment Directive moves #CKL-R to Working and lets research begin."
          />
        </div>
      </Card>

      {/* Authority & limitations */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Proposed authority & limitations</SectionTitle>
        <div className="scs-onb-lists">
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-approved)', margin: '0 0 8px' }}>May be prepared to</p>
            <ul>{c.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-risk)', margin: '0 0 8px' }}>Must not</p>
            <ul>{c.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
      </Card>

      {/* Proposed record set */}
      <div className="scs-onb-grid" style={{ marginBottom: 16 }}>
        <RecordCard
          title="Standing Directive"
          rows={[
            ['Working ref', <span className="scs-onb-rec" key="r">{c.standingDirective.ref.tempRef}</span>],
            ['Recommended id', <span className="scs-onb-rec" key="i">{c.standingDirective.ref.recommendedId}</span>],
            ['Title', c.standingDirective.title],
            ['Version', c.standingDirective.version],
            ['Governing authority', c.standingDirective.governingAuthority],
            ['Status', <StatusBadge key="s" label="Proposed — not Current" tone="proposed" />],
            ['Authorizing decision needed', c.standingDirective.ref.authorizingDecisionNeeded],
          ]}
          text={c.standingDirective.text}
        />
        <RecordCard
          title="Team Membership"
          rows={[
            ['Working ref', <span className="scs-onb-rec" key="r">{c.teamMembership.ref.tempRef}</span>],
            ['Recommended id', <span className="scs-onb-rec" key="i">{c.teamMembership.ref.recommendedId}</span>],
            ['Team', c.teamMembership.teamId],
            ['Status', <StatusBadge key="s" label="Proposed — not Active" tone="proposed" />],
            ['Authorizing decision needed', c.teamMembership.ref.authorizingDecisionNeeded],
          ]}
        />
        <RecordCard
          title="Operational History — activation event"
          rows={[
            ['Working ref', <span className="scs-onb-rec" key="r">{c.activationEvent.ref.tempRef}</span>],
            ['Recommended id', <span className="scs-onb-rec" key="i">{c.activationEvent.ref.recommendedId}</span>],
            ['Evidence type', c.activationEvent.evidenceType],
            ['Authority', <AuthorityBadge key="a" state="proposed" />],
            ['Summary', c.activationEvent.summary],
          ]}
        />
        <RecordCard
          title="Assignment Directive — competitive research"
          rows={[
            ['Working ref', <span className="scs-onb-rec" key="r">{c.assignmentDirective.ref.tempRef}</span>],
            ['Recommended id', c.assignmentDirective.ref.recommendedId],
            ['Title', c.assignmentDirective.title],
            ['Deliverable', c.assignmentDirective.deliverable],
            ['Review gate', c.assignmentDirective.reviewGate],
            ['Status', <StatusBadge key="s" label="Proposed — not active" tone="proposed" />],
          ]}
        />
      </div>

      {/* Research-blocked confirmation */}
      <div className="scs-onb-boundary" style={{ borderColor: 'var(--status-risk)', background: 'color-mix(in srgb, var(--status-risk) 8%, transparent)' }}>
        <Lock size={20} className="scs-onb-boundary__icon" style={{ color: 'var(--status-risk)' }} />
        <div>
          <p className="scs-onb-boundary__title">Competitive research is blocked</p>
          <p className="scs-onb-boundary__body">
            No competitive research may begin until both onboarding is approved <b>and</b> the competitive-research
            Assignment Directive is separately approved and activated by the Product Owner.
          </p>
        </div>
      </div>

      {/* Product Owner decisions required */}
      <Card style={{ margin: '16px 0' }}>
        <SectionTitle>Product Owner decisions required to complete onboarding</SectionTitle>
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
            ['Previous state', 'None on record — #CKL-R did not previously exist as a governed agent.'],
            ['Resulting state', `${m.statusLabel} (nonauthoritative; excluded from authoritative derivation).`],
            ['Approval status', <StatusBadge key="a" label="Pending Product Owner approval" tone="review" />],
            ['Provenance', c.audit.provenance],
          ]}
        />
      </Card>
    </div>
  );
}

function PreviewColumn({ cap, state, after, showMissing, note }: {
  cap: string; state: DerivedAgentState; after?: boolean; showMissing?: boolean; note?: string;
}) {
  return (
    <div className={`scs-onb-prev${after ? ' scs-onb-prev--after' : ''}`}>
      <span className="scs-onb-prev__cap">{cap}</span>
      <span className="scs-onb-prev__status">{state.status}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge label={state.activated ? 'Activated' : 'Not activated'} tone={state.activated ? 'approved' : 'neutral'} />
        <StatusBadge label={state.currentGate} tone="neutral" />
      </div>
      {showMissing && state.missingEvidence.length > 0 && (
        <p className="scs-onb-prev__miss">Missing approved evidence: {state.missingEvidence.join(', ')}.</p>
      )}
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
