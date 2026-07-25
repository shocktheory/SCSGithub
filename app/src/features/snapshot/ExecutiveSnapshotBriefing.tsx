import { Download, Printer, RefreshCw } from 'lucide-react';
import { useCollection, useIsSeed } from '../../lib/data';
import { deriveReviews } from '../../lib/reviews';
import { PageHeader, Card, DemonstrationBadge } from '../../design-system/components';
import type {
  OSSystem, Product, Publication, NextAction, Gate, Update, Artifact, AICollaborator,
} from '../../domain/entities';
import './snapshot.css';

/**
 * Executive Snapshot — the concise, generated operational briefing produced from
 * SCS state. Distinct from SCS Home: briefing-oriented, print-friendly, not a
 * second long dashboard.
 */
export function ExecutiveSnapshotBriefing() {
  const isSeed = useIsSeed();
  const os = useCollection<OSSystem>('osSystems');
  const products = useCollection<Product>('products');
  const pubs = useCollection<Publication>('publications');
  const nextActions = useCollection<NextAction>('nextActions');
  const gates = useCollection<Gate>('gates');
  const updates = useCollection<Update>('updates');
  const artifacts = useCollection<Artifact>('artifacts');
  const ai = useCollection<AICollaborator>('aiCollaborators');

  const scs = (os.data ?? []).find((s) => s.acronym === 'SCS');
  const reviews = deriveReviews({
    gates: gates.data ?? [], publications: pubs.data ?? [], products: products.data ?? [],
    artifacts: artifacts.data ?? [], aiCollaborators: ai.data ?? [], isSeed,
  });
  const latest = [...(updates.data ?? [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  const blocked = (pubs.data ?? []).filter((p) => /pending|decision|discovery/i.test(p.status));
  const nextAction = (nextActions.data ?? [])[0];

  const answers: Array<[string, string]> = [
    ['Where are we?', `${scs?.name ?? 'SCS'} ${scs?.version ?? ''} — ${scs?.status ?? 'status unknown'}. No governed decisions recorded yet (Phase 2).`],
    ['What changed?', latest ? `${latest.summary} (${latest.date || 'undated'}, via ${latest.source ?? 'unknown'}).` : 'No constitutional activity recorded.'],
    ['What needs me?', reviews.length ? `${reviews.length} items awaiting you — ${reviews.filter((r) => r.kind === 'Approval').length} approval, ${reviews.filter((r) => r.kind === 'Unresolved decision').length} unresolved decision.` : 'Nothing is waiting on you.'],
    ['What is blocked?', blocked.length ? blocked.map((p) => `${p.title} (${p.status})`).join('; ') + '.' : 'Nothing is blocked.'],
    ['What happens next?', nextAction ? `${nextAction.recommendation}` : 'No recommended action.'],
  ];

  function exportMarkdown() {
    const md = [
      `# Executive Snapshot — ShockTheory Constitutional System`,
      isSeed ? `> Demonstration data — not approved constitutional truth.` : '',
      '',
      ...answers.map(([q, a]) => `**${q}**\n\n${a}\n`),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scs-executive-snapshot.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="scs-briefing">
      <PageHeader
        eyebrow="Generated briefing"
        title="Executive Snapshot"
        subtitle="A concise operational briefing generated from current SCS state — the five executive questions, answered in under a minute."
        actions={
          <div className="scs-briefing__actions" style={{ display: 'flex', gap: 8 }}>
            <button className="scs-btn scs-btn--secondary" onClick={() => window.location.reload()}><RefreshCw size={14} /> Refresh</button>
            <button className="scs-btn scs-btn--secondary" onClick={exportMarkdown}><Download size={14} /> Export</button>
            <button className="scs-btn scs-btn--secondary" onClick={() => window.print()}><Printer size={14} /> Print</button>
          </div>
        }
      />

      {isSeed && (
        <div style={{ marginBottom: 18 }}><DemonstrationBadge /></div>
      )}

      <Card>
        {answers.map(([q, a]) => (
          <div className="scs-briefing__q" key={q}>
            <div className="scs-briefing__q-label">{q}</div>
            <div className="scs-briefing__q-body">{a}</div>
          </div>
        ))}
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          For the interactive command center — decision workspaces, coordination, and activity — open SCS Home.
        </p>
      </Card>
    </div>
  );
}
