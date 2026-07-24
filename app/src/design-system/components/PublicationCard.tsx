import { GitBranch } from 'lucide-react';
import type { Publication, PublicationPhase } from '../../domain/entities';
import { FAMILY_LABEL, publicationTimeline, currentGateLabel, authorityTone } from '../../lib/derive';
import { AuthorityBadge, StatusBadge } from './Badges';
import { GateTimeline } from './GateTimeline';

/**
 * A publication as a living constitutional artifact — its type, volume, maturity,
 * current gate, and operating state — not an archived document row.
 */
export function PublicationCard({
  pub,
  phases,
  productName,
  ownerName,
}: {
  pub: Publication;
  phases: PublicationPhase[];
  productName?: string;
  ownerName?: string;
}) {
  const gate = currentGateLabel(pub, phases);
  return (
    <div className={`scs-card scs-artifact scs-artifact--${pub.family}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {FAMILY_LABEL[pub.family]} · Vol {pub.volume}
            {productName ? ` · ${productName}` : ''}
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3 }}>{pub.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge label={pub.status} tone={authorityTone(pub.authorityStatus)} />
          <AuthorityBadge state={pub.authorityStatus} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 12px', flexWrap: 'wrap' }}>
        <span className="scs-artifact__gate">
          <GitBranch size={13} /> Gate · {gate}
        </span>
        {ownerName && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Owner · {ownerName}</span>}
      </div>

      <GateTimeline steps={publicationTimeline(pub, phases)} />
    </div>
  );
}
