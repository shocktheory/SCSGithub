import {
  LayoutDashboard,
  Network,
  Package,
  BookOpen,
  Scale,
  Quote,
  Bot,
  Target,
  AlertTriangle,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** false → renders a teaching placeholder ("arrives in Phase N"). */
  live: boolean;
  phase?: number;
  /** Used by placeholder pages to explain what the section will do. */
  blurb?: string;
}

/**
 * Primary navigation (§7). Plain, durable language — no internal dev jargon.
 * Phase 1 ships Overview, ShockTheory OS, Products, Publications, Settings.
 * The remaining sections show honest "coming in Phase N" pages so the full
 * shape of SCS is visible without pretending features exist.
 */
export const NAV: NavItem[] = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, live: true, phase: 1 },
  { path: '/os', label: 'ShockTheory OS', icon: Network, live: true, phase: 1 },
  { path: '/products', label: 'Products', icon: Package, live: true, phase: 1 },
  { path: '/publications', label: 'Publications', icon: BookOpen, live: true, phase: 1 },
  {
    path: '/decisions', label: 'Decisions', icon: Scale, live: false, phase: 2,
    blurb: 'The governed decision register — rulings, rationale, approving authority, and downstream impact.',
  },
  {
    path: '/canonical', label: 'Canonical Language', icon: Quote, live: false, phase: 2,
    blurb: 'The three-tier language model (Canonical, Enduring, Narrative) and canonical concepts.',
  },
  {
    path: '/ai-work', label: 'AI Work', icon: Bot, live: false, phase: 3,
    blurb: 'What each collaborator is assigned, what they are waiting on, and their expected next output.',
  },
  {
    path: '/benchmarks', label: 'Benchmarks', icon: Target, live: false, phase: 2,
    blurb: 'The registry of governing quality standards — what each benchmark governs and what it does not.',
  },
  {
    path: '/risks', label: 'Risks & Divergence', icon: AlertTriangle, live: false, phase: 2,
    blurb: 'Governed risks — drift, conflicting authority, missing decisions — with evidence and correction.',
  },
  {
    path: '/updates', label: 'Update Log', icon: History, live: false, phase: 2,
    blurb: 'A chronological, filterable operating log driven by the adopted sync codes.',
  },
  { path: '/settings', label: 'Settings', icon: Settings, live: true, phase: 1 },
];

export const navByPath = (path: string) => NAV.find((n) => n.path === path);
