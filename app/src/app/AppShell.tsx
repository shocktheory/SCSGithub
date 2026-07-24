import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { NAV } from './nav';
import './shell.css';

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // Each section should start at the top when navigated to.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="scs-shell">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && <div className="scs-scrim" onClick={() => setOpen(false)} aria-hidden />}

      <div className="scs-main" ref={mainRef}>
        <div className="scs-topbar">
          <button
            className="scs-topbar__menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {NAV.find((n) => n.path === location.pathname)?.label ?? 'SCS'}
          </span>
        </div>
        <main className="scs-main__inner">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  return (
    <aside className={`scs-sidebar${open ? ' scs-sidebar--open' : ''}`} aria-label="Primary">
      <div className="scs-brand">
        <div className="scs-brand__mark">S</div>
        <div>
          <div className="scs-brand__name">Constitutional System</div>
          <div className="scs-brand__sub">ShockTheory OS</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `scs-nav-item${isActive ? ' scs-nav-item--active' : ''}${item.live ? '' : ' scs-nav-item--soon'}`
              }
            >
              <Icon size={17} strokeWidth={1.9} aria-hidden />
              <span>{item.label}</span>
              {!item.live && <span className="scs-nav-item__soon">P{item.phase}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '14px 10px 4px', color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
        v0.1 MVP · Phase 1
        <br />
        Confidential — Internal Use Only
      </div>
    </aside>
  );
}
