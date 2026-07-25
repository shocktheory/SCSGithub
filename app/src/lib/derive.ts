import type { AuthorityState } from '../domain/authority';
import type { Product, Publication, PublicationPhase } from '../domain/entities';
import type { TimelineStep } from '../design-system/components';

/** Map an authority state to a StatusBadge tone (color is never the only signal). */
export function authorityTone(state: AuthorityState): 'approved' | 'proposed' | 'verified' | 'neutral' | 'risk' {
  switch (state) {
    case 'approved': return 'approved';
    case 'proposed': return 'proposed';
    case 'verified': return 'verified';
    case 'superseded': return 'risk';
    default: return 'neutral';
  }
}

export const FAMILY_LABEL: Record<Publication['family'], string> = {
  experience: 'Experience Playbook',
  workflow: 'Workflow Playbook',
  component: 'Component Playbook',
};

/** The publication's current phase/gate label ("what gate is it at"). */
export function currentGateLabel(pub: Publication, phases: PublicationPhase[]): string {
  const current = phases.find((p) => p.id === pub.currentPhase);
  if (current) return current.name;
  return '—';
}

/**
 * Product maturity (0–1) derived from its publications' phase progress, with a
 * plain-language label. No maturity is invented — a product with no publications
 * reads as "Early".
 */
export function productMaturity(
  product: Product,
  pubs: Publication[],
  phases: PublicationPhase[],
): { value: number; label: string } {
  const own = pubs.filter((p) => p.product === product.id);
  if (own.length === 0) return { value: 0.08, label: 'Early' };

  const scores = own.map((pub) => {
    const own = phases.filter((ph) => ph.publication === pub.id).sort((a, b) => a.order - b.order);
    if (own.length === 0) return pub.authorityStatus === 'approved' ? 1 : 0.05;
    const approved = own.filter((ph) => ph.authorityStatus === 'approved').length;
    const active = own.some((ph) => ph.id === pub.currentPhase) ? 0.5 : 0;
    return Math.min(1, (approved + active) / own.length);
  });
  const value = scores.reduce((a, b) => a + b, 0) / scores.length;
  const label = value < 0.25 ? 'Early' : value < 0.5 ? 'Developing' : value < 0.78 ? 'Maturing' : 'Mature';
  return { value, label };
}

/**
 * State-derived executive summary for a product — real state (maturity, coverage,
 * next gate), not an invented marketing description.
 */
export function productExecutiveSummary(
  product: Product,
  pubs: Publication[],
  phases: PublicationPhase[],
): string {
  const own = pubs.filter((p) => p.product === product.id);
  const maturity = productMaturity(product, pubs, phases).label;
  if (own.length === 0) return `${maturity} · no publications yet · awaiting first playbook`;
  const active = own.filter((p) => p.currentPhase && p.authorityStatus !== 'approved').length;
  const next = own
    .filter((p) => p.currentPhase && p.authorityStatus !== 'approved')
    .map((p) => `${p.title} · ${currentGateLabel(p, phases)}`)[0];
  return `${maturity} · ${own.length} publications${active ? `, ${active} active` : ''}${next ? ` · next gate: ${next}` : ''}`;
}

/** Build a phase-gate timeline for a publication from its phases. */
export function publicationTimeline(pub: Publication, phases: PublicationPhase[]): TimelineStep[] {
  const own = phases
    .filter((p) => p.publication === pub.id)
    .sort((a, b) => a.order - b.order);
  return own.map((p): TimelineStep => ({
    label: p.name,
    state:
      p.authorityStatus === 'approved'
        ? 'done'
        : p.id === pub.currentPhase
          ? 'active'
          : 'pending',
  }));
}
