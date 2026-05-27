'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@brandflow/ui';
import { apiClient } from '@/lib/api-client';
import {
  LayoutDashboard,
  Fingerprint,
  BookOpen,
  CheckSquare,
  Eye,
  PenTool,
  Image,
  Target,
  FolderKanban,
  Calendar,
  Share2,
  Zap,
  BarChart3,
  Cpu,
  Building2,
  Settings2,
  CreditCard,
  Users,
  Briefcase,
  Shield,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    group: 'Intelligence',
    items: [
      { label: 'Brands', href: '/intelligence/brands', icon: Fingerprint },
      { label: 'Knowledge Hub', href: '/intelligence/knowledge', icon: BookOpen },
      { label: 'Review Queue', href: '/review', icon: CheckSquare },
      { label: 'Monitor', href: '/intelligence/monitor', icon: Eye },
    ],
  },
  {
    group: 'Create',
    items: [
      { label: 'Content', href: '/create/content', icon: PenTool },
      { label: 'AI Images', href: '/create/image', icon: Image },
      { label: 'Campaigns', href: '/campaigns', icon: Target },
      { label: 'Projects', href: '/projects', icon: FolderKanban },
    ],
  },
  {
    group: 'Publish',
    items: [
      { label: 'Calendar', href: '/publish/calendar', icon: Calendar },
      { label: 'Social Accounts', href: '/publish/social', icon: Share2 },
    ],
  },
  {
    group: 'Automate',
    items: [{ label: 'Automations', href: '/automations', icon: Zap }],
  },
  {
    group: 'Insights',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'AI Diagnostics', href: '/ai-test', icon: Cpu },
    ],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Business', href: '/settings/business', icon: Building2 },
      { label: 'LLM Settings', href: '/settings/llm', icon: Settings2 },
      { label: 'Billing', href: '/settings/billing', icon: CreditCard },
      { label: 'Team', href: '/settings/team', icon: Users },
      { label: 'Clients', href: '/settings/clients', icon: Briefcase },
      { label: 'Compliance', href: '/settings/compliance', icon: Shield },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: approvalCount } = useQuery<number>({
    queryKey: ['approval-queue-count'],
    queryFn: async () => {
      const res = await apiClient.get('/approvals/queue/count');
      return typeof res.data === 'number' ? res.data : 0;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Patch badge for Review Queue
  const navWithBadge = NAV.map((item) => {
    if ('group' in item && item.group === 'Intelligence') {
      return {
        ...item,
        items: item.items.map((sub) =>
          sub.href === '/review' ? { ...sub, badge: approvalCount ?? 0 } : sub,
        ),
      };
    }
    return item;
  });

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-border/50 bg-surface-1/50 backdrop-blur-md">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-lg leading-none tracking-tighter">B</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">BrandFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 no-scrollbar">
        {navWithBadge.map((item) => {
          if ('href' in item) {
            return (
              <NavLink key={item.href} href={item.href} Icon={item.icon} label={item.label} pathname={pathname} badge={item.badge} />
            );
          }
          return (
            <CollapsibleGroup key={item.group} group={item.group} items={item.items} pathname={pathname} />
          );
        })}
      </nav>
      
      {/* Bottom User Area or Version */}
      <div className="p-4 border-t border-border/50">
        <div className="rounded-2xl bg-surface-2/50 p-4 border border-border/50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Enterprise Edition</p>
          <p className="text-xs font-medium text-foreground">v2.0.0-beta</p>
        </div>
      </div>
    </aside>
  );
}

function CollapsibleGroup({ group, items, pathname }: { group: string; items: NavItem[]; pathname: string }) {
  const hasActive = items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="pt-4 first:pt-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
      >
        {group}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform opacity-50 group-hover:opacity-100', open ? '' : '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-2 space-y-1 relative before:absolute before:inset-y-2 before:left-5 before:w-px before:bg-border/50">
          {items.map((sub) => (
            <NavLink key={sub.href} href={sub.href} Icon={sub.icon} label={sub.label} pathname={pathname} badge={sub.badge} isSubItem />
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({ href, Icon, label, pathname, badge, isSubItem }: { href: string; Icon: LucideIcon; label: string; pathname: string; badge?: number; isSubItem?: boolean }) {
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 relative overflow-hidden',
        active
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:bg-primary/90'
          : 'text-muted-foreground hover:bg-surface-2/80 hover:text-foreground',
        isSubItem && !active && 'ml-2 text-[13px] hover:translate-x-1'
      )}
    >
      {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />}
      <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
      <span className="flex-1 relative z-10">{label}</span>
      {badge != null && badge > 0 && (
        <span className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-red-500/20">
          {badge}
        </span>
      )}
    </Link>
  );
}
