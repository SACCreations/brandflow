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
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-gray-200 dark:border-gray-800">
        <span className="text-lg font-bold text-brand-600">BrandFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
    </aside>
  );
}

function CollapsibleGroup({ group, items, pathname }: { group: string; items: NavItem[]; pathname: string }) {
  const hasActive = items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="pt-3 first:pt-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {group}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open ? '' : '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {items.map((sub) => (
            <NavLink key={sub.href} href={sub.href} Icon={sub.icon} label={sub.label} pathname={pathname} badge={sub.badge} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({ href, Icon, label, pathname, badge }: { href: string; Icon: LucideIcon; label: string; pathname: string; badge?: number }) {
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
