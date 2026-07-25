import { ExternalLink } from 'lucide-react';
import { useCollection } from '../../lib/data';
import { PageHeader, Card, MetaGrid, StatusBadge } from '../../design-system/components';
import type { Artifact } from '../../domain/entities';

/**
 * Artifact Registry (ST-DEC-2026-015) — where every governing artifact lives, with a
 * direct path to open it and its link health. Implements the approved baseline only.
 */
export function ArtifactRegistryPage() {
  const artifacts = useCollection<Artifact>('artifacts');
  const healthTone = (h?: string) => (h === 'ok' ? 'approved' : h === 'broken' ? 'risk' : 'review');

  return (
    <div>
      <PageHeader
        eyebrow="Artifact Registry · ST-DEC-2026-015"
        title="Artifact Registry"
        subtitle="Every governing artifact and where it lives — storage provider, direct open link, and link health. Broken, moved, or unverified links are visibly identified."
      />
      <div style={{ display: 'grid', gap: 14 }}>
        {(artifacts.data ?? []).map((a) => {
          const href = a.openLink ?? a.repoURL ?? a.productionURL;
          return (
            <Card key={a.id}>
              <div className="scs-section-head">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.type} · {a.area}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{a.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge label={`Link ${a.linkHealth ?? 'unverified'}`} tone={healthTone(a.linkHealth)} />
                  {href && (
                    <a className="scs-btn scs-btn--tertiary" href={href} target="_blank" rel="noreferrer">
                      Open source <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
              <MetaGrid
                rows={[
                  ['Storage', a.storageProvider ?? '—'],
                  ['Version', a.version],
                  ['Confidentiality', a.confidentiality],
                  ['Last verified', a.lastVerified ?? 'Not verified'],
                ]}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
