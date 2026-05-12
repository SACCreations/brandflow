'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@brandflow/ui';

const NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '⊞',
  },
  {
    group: 'Intelligence',
    items: [
      { label: 'Brands', href: '/intelligence/brands', icon: '◈' },
      { label: 'Knowledge Hub', href: '/intelligence/knowledge', icon: '◉' },
      { label: 'Sources', href: '/intelligence/sources', icon: '⌥' },
      { label: 'Review Queue', href: '/intelligence/review', icon: '✓' },
      { label: 'Monitor', href: '/intelligence/monitor', icon: '◷' },
    ],
  },
  {
    group: 'Create',
    items: [
      { label: 'Content', href: '/create/content', icon: '✦' },
      { label: 'Campaigns', href: '/create/campaigns', icon: '◎' },
    ],
  },
  {
    group: 'Review',
    items: [{ label: 'Approvals', href: '/review/approvals', icon: '✓' }],
  },
  {
    group: 'Publish',
    items: [
      { label: 'Calendar', href: '/publish/calendar', icon: '◷' },
      { label: 'Social Accounts', href: '/publish/social', icon: '◈' },
    ],
  },
  {
    group: 'Automate',
    items: [{ label: 'Automations', href: '/automate/automations', icon: '⚡' }],
  },
  {
    group: 'Insights',
    items: [{ label: 'Analytics', href: '/analytics', icon: '◉' }],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Business', href: '/settings/business', icon: '⚙' },
      { label: 'LLM Settings', href: '/settings/llm', icon: '◈' },
      { label: 'Billing', href: '/settings/billing', icon: '＄' },
      { label: 'Team', href: '/settings/team', icon: '👥' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-gray-200 dark:border-gray-800">
        <span className="text-lg font-bold text-brand-600">BrandFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => {
          if ('href' in item) {
            return (
              <NavLink key={item.href} href={item.href ?? ''} icon={item.icon ?? ''} label={item.label ?? ''} pathname={pathname} />
            );
          }
          return (
            <div key={item.group} className="pt-3 first:pt-0">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {item.group}
              </p>
              {item.items.map((sub) => (
                <NavLink key={sub.href} href={sub.href} icon={sub.icon ?? ''} label={sub.label ?? ''} pathname={pathname} />
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function NavLink({ href, icon, label, pathname }: { href: string; icon: string; label: string; pathname: string }) {
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
      <span className="w-4 text-center">{icon}</span>
      {label}
    </Link>
  );
}
