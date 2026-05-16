'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/api-client';

interface DashboardSummaryResponse {
  stats: {
    contentCreated: number;
    pendingApprovals: number;
    postsScheduled: number;
    tokenUsage: {
      used: number;
      limit: number;
      percentage: number;
    };
    brands: number;
    teamMembers: number;
    workspaceHealth: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardSummaryResponse }>('/business/dashboard');
      return res.data;
    },
    staleTime: 60_000,
  });

  const stats = [
    {
      label: 'Content Created',
      value: isLoading ? '—' : String(data?.stats.contentCreated ?? 0),
      helper: 'All generated and saved items',
      icon: '✦',
      color: 'text-brand-600',
    },
    {
      label: 'Pending Approvals',
      value: isLoading ? '—' : String(data?.stats.pendingApprovals ?? 0),
      helper: 'Items waiting for review',
      icon: '✓',
      color: 'text-yellow-600',
    },
    {
      label: 'Posts Scheduled',
      value: isLoading ? '—' : String(data?.stats.postsScheduled ?? 0),
      helper: 'Upcoming scheduled posts',
      icon: '◷',
      color: 'text-blue-600',
    },
    {
      label: 'Token Usage',
      value: isLoading ? '—' : `${data?.stats.tokenUsage.percentage ?? 0}%`,
      helper: isLoading
        ? 'Loading token usage…'
        : `${formatNumber(data?.stats.tokenUsage.used ?? 0)} / ${formatNumber(data?.stats.tokenUsage.limit ?? 0)}`,
      icon: '⊞',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your live workspace summary across brand, content, and publishing workflows.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="mt-2 text-xs text-gray-500">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>

          {isError ? (
            <div className="p-8 text-center text-sm text-red-500">
              Failed to load activity. Please refresh the page.
            </div>
          ) : isLoading ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-6 py-4 animate-pulse">
                  <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="mt-2 h-3 w-64 rounded bg-gray-100 dark:bg-gray-900" />
                </div>
              ))}
            </div>
          ) : data?.recentActivity.length ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="block px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">No activity yet — create content, campaigns, or approvals to populate this feed.</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Workspace Snapshot</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6 text-center">
              <MetricTile label="Brands" value={isLoading ? '—' : String(data?.stats.brands ?? 0)} />
              <MetricTile label="Team" value={isLoading ? '—' : String(data?.stats.teamMembers ?? 0)} />
              <MetricTile label="Health" value={isLoading ? '—' : `${data?.stats.workspaceHealth ?? 0}%`} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Generate Content', href: '/create/content', icon: '✦' },
                { label: 'New Campaign', href: '/campaigns', icon: '◎' },
                { label: 'View Approvals', href: '/review/approvals', icon: '✓' },
                { label: 'Schedule Post', href: '/publish/calendar', icon: '◷' },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
                >
                  <span>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

