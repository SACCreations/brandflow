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
      <Card className="glass-premium overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-foreground">Workspace Snapshot</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 p-6 text-center">
          <MetricTile label="Brands" value={isLoading ? '—' : String(stats?.brands ?? 0)} />
          <MetricTile label="Team" value={isLoading ? '—' : String(stats?.teamMembers ?? 0)} />
          <MetricTile label="Health" value={isLoading ? '—' : `${stats?.workspaceHealth ?? 0}%`} />
        </div>
      </Card>

      <Card className="glass-premium overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-foreground">Quick Actions</h2>
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
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-surface-2 transition-all hover:shadow-sm micro-hover"
            >
              <span className="text-primary">{a.icon}</span>
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
    <div className="rounded-xl bg-background p-4 border border-border">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
