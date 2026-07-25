import type { Publication, PublicationPhase } from '../../domain/entities';
import { FAMILY_LABEL, publicationTimeline, currentGateLabel, pubDisplayTitle } from '../../lib/derive';
import { GateTimeline } from './GateTimeline';
import { DimensionTag, DimensionRow } from './Dimensions';

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
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3 }}>{pubDisplayTitle(pub)}</div>
        </div>
      </div>

      <div style={{ margin: '16px 0 14px' }}>
        <DimensionRow>
          <DimensionTag label="Authority" tone="authority">Record · {pub.authorityStatus}</DimensionTag>
          <DimensionTag label="Work state" tone="work">{pub.status}</DimensionTag>
          <DimensionTag label="Gate" tone="gate">{gate}</DimensionTag>
          {ownerName && <DimensionTag label="Owner" tone="neutral">{ownerName}</DimensionTag>}
        </DimensionRow>
      </div>

      <GateTimeline steps={publicationTimeline(pub, phases)} />
    </div>
  );
}
