'use client';

import React from 'react';
import { Card } from '@brandflow/ui';
import Link from 'next/link';

interface WorkspaceSnapshotProps {
  stats: {
    brands: number;
    teamMembers: number;
    workspaceHealth: number;
  } | undefined;
  isLoading: boolean;
}

export function WorkspaceSnapshot({ stats, isLoading }: WorkspaceSnapshotProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-premium rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-gray-900 dark:text-white">Workspace Snapshot</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 p-6 text-center">
          <MetricTile label="Brands" value={isLoading ? '—' : String(stats?.brands ?? 0)} />
          <MetricTile label="Team" value={isLoading ? '—' : String(stats?.teamMembers ?? 0)} />
          <MetricTile label="Health" value={isLoading ? '—' : `${stats?.workspaceHealth ?? 0}%`} />
        </div>
      </Card>

      <Card className="glass-premium rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Generate Content', href: '/create/content', icon: '✦' },
            { label: 'Generate AI Image', href: '/create/image', icon: '🎨' },
            { label: 'New Campaign', href: '/campaigns', icon: '◎' },
            { label: 'View Approvals', href: '/review/approvals', icon: '✓' },
            { label: 'Schedule Post', href: '/publish/calendar', icon: '◷' },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-black/20 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-brand-500 hover:bg-white dark:hover:bg-zinc-900 transition-all hover:shadow-xl micro-hover"
            >
              <span className="text-brand-500">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/40 dark:bg-black/20 p-5 border border-white/30 dark:border-white/5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
