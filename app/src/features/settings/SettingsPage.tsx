import { useEffect, useState } from 'react';
import { Download, ExternalLink, RotateCcw, Save } from 'lucide-react';
import { db } from '../../storage/db';
import { localAdapter } from '../../storage/localAdapter';
import { ensureSeeded } from '../../storage/bootstrap';
import { SCHEMA_VERSION } from '../../domain/schemaVersion';
import { useCollection } from '../../lib/data';
import { PageHeader, Card, SectionTitle, MetaGrid, StatusBadge } from '../../design-system/components';
import type { Artifact } from '../../domain/entities';

export function SettingsPage() {
  const artifacts = useCollection<Artifact>('artifacts');
  const [localPath, setLocalPath] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSeed, setIsSeed] = useState(true);

  useEffect(() => {
    void (async () => {
      const pathRow = await db.meta.get('localPath');
      if (pathRow?.value) setLocalPath(String(pathRow.value));
      const seedRow = await db.meta.get('isSeed');
      setIsSeed(Boolean(seedRow?.value ?? true));
    })();
  }, []);

  async function saveLocalPath() {
    await db.meta.put({ key: 'localPath', value: localPath.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function exportWorkspace() {
    const backup = await localAdapter.exportWorkspace();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scs-workspace-${backup.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function resetToSeed() {
    if (!window.confirm('Reset the workspace and reload the labeled demo data? Export a backup first if you have edits to keep.')) return;
    await localAdapter.resetWorkspace('CONFIRM-RESET');
    await ensureSeeded();
    window.location.reload();
  }

  const sources = (artifacts.data ?? []).filter((a) => a.openLink || a.repoURL || a.productionURL);

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Local persistence, workspace backup, source locations, and folder paths for this SCS workspace."
      />

      <Card style={{ marginBottom: 22 }}>
        <SectionTitle>Storage & data</SectionTitle>
        <MetaGrid
          rows={[
            ['Persistence', <StatusBadge label="Local · IndexedDB" tone="verified" key="p" />],
            ['Schema version', `v${SCHEMA_VERSION}`],
            ['Workspace', isSeed ? <StatusBadge label="Labeled demo data" tone="review" key="s" /> : <StatusBadge label="Product Owner data" tone="approved" key="s" />],
            ['Migration path', 'Same StorageAdapter → hosted MySQL API (Phase 3+). No UI rewrite.'],
          ]}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button className="scs-btn scs-btn--secondary" onClick={exportWorkspace}>
            <Download size={15} /> Export workspace (JSON)
          </button>
          <button className="scs-btn scs-btn--secondary" onClick={resetToSeed}>
            <RotateCcw size={15} /> Reset to demo data
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
          Import with validation and full backup recovery arrive in Phase 4. Reset is guarded and always re-seeds cleanly.
        </p>
      </Card>

      <Card style={{ marginBottom: 22 }}>
        <SectionTitle>Local working folder</SectionTitle>
        <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          The absolute iCloud path varies by Mac and iCloud configuration, so it is stored as a setting rather than hard-coded.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
            placeholder="/Users/…/ShockTheory Constitutional System (SCS)"
            aria-label="Local working folder path"
            style={{
              flex: '1 1 320px', minWidth: 0, padding: '9px 12px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)', color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          <button className="scs-btn scs-btn--primary" onClick={saveLocalPath}>
            <Save size={15} /> {saved ? 'Saved' : 'Save path'}
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Source locations</SectionTitle>
        <div style={{ display: 'grid', gap: 10 }}>
          {sources.map((a) => {
            const href = a.openLink ?? a.repoURL ?? a.productionURL!;
            return (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.storageProvider} · link {a.linkHealth}</div>
                </div>
                <a className="scs-btn scs-btn--tertiary" href={href} target="_blank" rel="noreferrer">
                  Open <ExternalLink size={13} />
                </a>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
