import {
  Home, ClipboardList, Network, Scale, Landmark, ClipboardCheck, FolderTree, Quote,
  Package, BookOpen, Users, UserPlus, PackageCheck, DoorOpen, Activity, Target, AlertTriangle, Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavStatus = 'live' | 'planned' | 'deferred';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  status: NavStatus;
  phase?: number;
  badge?: string;
  badgeTip?: string;
  blurb?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const planned = (phase: number, blurb: string): Partial<NavItem> => ({
  status: 'planned', phase, badge: `Phase ${phase}`,
  badgeTip: `Planned for Phase ${phase} — defined in the data model, not built yet.`, blurb,
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
      { path: '/decisions', label: 'Constitutional Register', icon: Scale, status: 'live' },
      { path: '/standing-directives', label: 'Standing Directives', icon: Landmark, status: 'live' },
      { path: '/assignment-directives', label: 'Assignment Directives', icon: ClipboardCheck, status: 'live' },
      { path: '/artifacts', label: 'Artifact Registry', icon: FolderTree, status: 'live' },
      { path: '/canonical', label: 'Canonical Language', icon: Quote, ...planned(3, 'The three-tier language model (Canonical, Enduring, Narrative) and canonical concepts.') } as NavItem,
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
      { path: '/ai-work', label: 'Team Command Center', icon: Users, status: 'live' },
      { path: '/onboarding', label: 'Agent Onboarding', icon: UserPlus, status: 'live', phase: 3, badge: 'Phase 3', badgeTip: 'Phase 3 — governed agent onboarding workspace.' },
      { path: '/deliverables', label: 'Deliverables', icon: PackageCheck, status: 'live' },
      { path: '/review-gates', label: 'Review Gates', icon: DoorOpen, status: 'live' },
      { path: '/operational-history', label: 'Operational History', icon: Activity, status: 'live' },
      { path: '/benchmarks', label: 'Benchmarks', icon: Target, ...planned(3, 'The registry of governing quality standards — what each benchmark governs and does not.') } as NavItem,
      { path: '/risks', label: 'Risks & Divergence', icon: AlertTriangle, ...planned(3, 'Governed risks — drift, conflicting authority, missing decisions — with evidence and correction.') } as NavItem,
    ],
  },
  {
    title: 'System',
    items: [{ path: '/settings', label: 'Settings', icon: Settings, status: 'live' }],
  },
];

export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
export const navByPath = (path: string) => NAV.find((n) => n.path === path);
