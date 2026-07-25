import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from '../lib/data';
import { ensureSeeded } from '../storage/bootstrap';
import { AppShell } from './AppShell';
import { NAV } from './nav';
import { SCSHomePage } from '../features/home/SCSHomePage';
import { ExecutiveSnapshotBriefing } from '../features/snapshot/ExecutiveSnapshotBriefing';
import { ReviewWorkspacePage } from '../features/reviews/ReviewWorkspacePage';
import { OSRegistryPage } from '../features/os/OSRegistryPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { ProductCommandPage } from '../features/products/ProductCommandPage';
import { PublicationsPage } from '../features/publications/PublicationsPage';
import { AIWorkPage } from '../features/ai/AIWorkPage';
import { DecisionsPage } from '../features/decisions/DecisionsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { PlaceholderPage } from '../features/PlaceholderPage';

/**
 * SCS application root.
 * HashRouter → the static build deep-links correctly on the PHP host without
 * server rewrite rules (deploy-safe for shocktheoryos.com).
 */
export function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureSeeded()
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to initialize storage'));
  }, []);

  if (error) return <Fallback>Storage error: {error}</Fallback>;
  if (!ready) return <Fallback>Loading workspace…</Fallback>;

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<SCSHomePage />} />
            <Route path="/snapshot" element={<ExecutiveSnapshotBriefing />} />
            <Route path="/review/:id" element={<ReviewWorkspacePage />} />
            <Route path="/os" element={<OSRegistryPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductCommandPage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/ai-work" element={<AIWorkPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {NAV.filter((n) => n.status !== 'live').map((n) => (
              <Route key={n.path} path={n.path} element={<PlaceholderPage item={n} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </QueryClientProvider>
  );
}

function Fallback({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
      {children}
    </div>
  );
}
