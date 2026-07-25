import type { AuthorityState } from '../domain/authority';
import type {
  Gate, Publication, Product, Artifact, AICollaborator,
} from '../domain/entities';

/**
 * A review item is never presented without a path to act. Each derives a full
 * decision workspace (Revision — decision actionability): what decision is
 * required, why, sources, rulings, recommendations, consequences, and impact.
 */
export type ReviewKind = 'Approval' | 'Unresolved decision';

export interface ReviewItem {
  id: string;
  kind: ReviewKind;
  title: string; // the exact decision required
  authority: AuthorityState;
  why: string;
  sourceArtifacts: Array<{ name: string; href?: string }>;
  ownerRulings: string[];
  claudeRecommendation: string;
  sosAssessment: string;
  consequencesApprove: string;
  consequencesDefer: string;
  affects: string[];
  isDemonstration: boolean;
}

interface DeriveInput {
  gates: Gate[];
  publications: Publication[];
  products: Product[];
  artifacts: Artifact[];
  aiCollaborators: AICollaborator[];
  isSeed: boolean;
}

export function deriveReviews(input: DeriveInput): ReviewItem[] {
  const { gates, publications, products, artifacts, isSeed } = input;
  const prodName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const drive = artifacts.find((a) => a.storageProvider === 'google-drive');
  const items: ReviewItem[] = [];

  // Approval gates awaiting the Product Owner.
  for (const g of gates.filter((x) => x.requiresOwnerApproval && x.status !== 'Approved')) {
    const pub = publications.find((p) => p.id === g.publication);
    items.push({
      id: `review-${g.id}`,
      kind: 'Approval',
      title: `Approve ${pub?.title ?? 'publication'} — ${g.name}`,
      authority: g.authorityStatus,
      why: `${pub?.title ?? 'This publication'} is authorized to enter its next phase after the prior gate; the Product Owner gate decision is required to proceed.`,
      sourceArtifacts: [
        pub && { name: `${pub.title} (publication record)` },
        drive && { name: 'Google Drive — SCS folder', href: drive.openLink },
      ].filter(Boolean) as ReviewItem['sourceArtifacts'],
      ownerRulings: ['Prior phase approved (recorded; approval date incomplete).'],
      claudeRecommendation: 'Proceed — the prior phase is approved and the next phase is scoped.',
      sosAssessment: 'No constitutional conflict detected. Provenance of the prior approval date is incomplete and should be recorded.',
      consequencesApprove: `${pub?.title ?? 'The publication'} advances into its next phase.`,
      consequencesDefer: `${pub?.title ?? 'The publication'} remains blocked at this gate.`,
      affects: [pub ? prodName(pub.product) : '', pub?.title ?? ''].filter(Boolean),
      isDemonstration: isSeed,
    });
  }

  // Publications blocked pending decisions.
  for (const pub of publications.filter((p) => /pending|decision/i.test(p.status))) {
    items.push({
      id: `review-${pub.id}`,
      kind: 'Unresolved decision',
      title: `Resolve ${pub.title} — discovery & lifecycle decisions`,
      authority: pub.authorityStatus,
      why: `${pub.title} is blocked in Discovery pending lifecycle decisions; resolving them unblocks its next phase.`,
      sourceArtifacts: [
        { name: `${pub.title} (publication record)` },
        drive && { name: 'Google Drive — SCS folder', href: drive.openLink },
      ].filter(Boolean) as ReviewItem['sourceArtifacts'],
      ownerRulings: [],
      claudeRecommendation: 'Define the lifecycle and gate sequence for this workflow before further work.',
      sosAssessment: 'Unresolved lifecycle decisions are a governance risk; recording them prevents divergence.',
      consequencesApprove: `${pub.title} exits Discovery and its gate sequence is established.`,
      consequencesDefer: `${pub.title} stays blocked in Discovery.`,
      affects: [prodName(pub.product), pub.title],
      isDemonstration: isSeed,
    });
  }

  return items;
}
