import type { AuthorityState } from '../domain/authority';
import type { Publication, PublicationPhase } from '../domain/entities';
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
