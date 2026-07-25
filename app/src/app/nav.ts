import {
  Home, ClipboardList, Network, Library, FolderTree, Quote, Scale,
  Package, BookOpen, Bot, Target, AlertTriangle, History, Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavStatus = 'live' | 'planned' | 'deferred';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  status: NavStatus;
  phase?: number;
  /** Short badge text (e.g. "Phase 2", "Deferred"); tooltip explains its meaning. */
  badge?: string;
  badgeTip?: string;
  blurb?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const planned = (phase: number, blurb: string): Partial<NavItem> => ({
  status: 'planned',
  phase,
  badge: `Phase ${phase}`,
  badgeTip: `Planned for Phase ${phase} — defined in the data model, not built yet.`,
  blurb,
});

const deferred = (blurb: string): Partial<NavItem> => ({
  status: 'deferred',
  badge: 'Deferred',
  badgeTip: 'Deferred from Phase 1 — represented explicitly in the phase plan.',
  blurb,
});

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'SCS Home', icon: Home, status: 'live' },
      { path: '/snapshot', label: 'Executive Snapshot', icon: ClipboardList, status: 'live' },
    ],
  },
  {
    title: 'Constitution',
    items: [
      { path: '/os', label: 'ShockTheory OS', icon: Network, status: 'live' },
      { path: '/library', label: 'Constitutional Library', icon: Library, ...deferred('Product architecture, playbooks, canonical language, decisions, specifications, and benchmarks in one governed library.') } as NavItem,
      { path: '/artifacts', label: 'Artifact Registry', icon: FolderTree, ...deferred('Where every governing artifact lives, with direct open links and link-health.') } as NavItem,
      { path: '/canonical', label: 'Canonical Language', icon: Quote, ...planned(2, 'The three-tier language model (Canonical, Enduring, Narrative) and canonical concepts.') } as NavItem,
      { path: '/decisions', label: 'Decisions', icon: Scale, ...planned(2, 'The governed decision register — rulings, rationale, approving authority, downstream impact.') } as NavItem,
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { path: '/products', label: 'Products', icon: Package, status: 'live' },
      { path: '/publications', label: 'Publications', icon: BookOpen, status: 'live' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/ai-work', label: 'AI Work', icon: Bot, status: 'live' },
      { path: '/benchmarks', label: 'Benchmarks', icon: Target, ...planned(2, 'The registry of governing quality standards — what each benchmark governs and does not.') } as NavItem,
      { path: '/risks', label: 'Risks & Divergence', icon: AlertTriangle, ...planned(2, 'Governed risks — drift, conflicting authority, missing decisions — with evidence and correction.') } as NavItem,
      { path: '/updates', label: 'Update Log', icon: History, ...planned(2, 'A chronological, filterable operating log driven by the adopted sync codes.') } as NavItem,
    ],
  },
  {
    title: 'System',
    items: [{ path: '/settings', label: 'Settings', icon: Settings, status: 'live' }],
  },
];

export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
export const navByPath = (path: string) => NAV.find((n) => n.path === path);
