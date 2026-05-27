'use client';

import React from 'react';
import { Card } from '@brandflow/ui';
import Link from 'next/link';
import { Fingerprint, Users, Activity, PenTool, Image, Target, CheckSquare, Calendar } from 'lucide-react';

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
        <div className="px-6 py-4 border-b border-border/50 bg-surface-1/50 flex items-center justify-between">
          <h2 className="font-bold text-foreground">Workspace Snapshot</h2>
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3 p-5">
          <MetricTile label="Brands" value={isLoading ? '—' : String(stats?.brands ?? 0)} icon={<Fingerprint className="h-4 w-4 text-primary" />} />
          <MetricTile label="Team" value={isLoading ? '—' : String(stats?.teamMembers ?? 0)} icon={<Users className="h-4 w-4 text-blue-500" />} />
          <MetricTile label="Health" value={isLoading ? '—' : `${stats?.workspaceHealth ?? 0}%`} icon={<Activity className="h-4 w-4 text-emerald-500" />} />
        </div>
      </Card>

      <Card className="glass-premium overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="px-6 py-4 border-b border-border/50 bg-surface-1/50">
          <h2 className="font-bold text-foreground">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-1 gap-2">
          {[
            { label: 'Generate Content', href: '/create/content', icon: <PenTool className="h-4 w-4" /> },
            { label: 'Generate AI Image', href: '/create/image', icon: <Image className="h-4 w-4" /> },
            { label: 'New Campaign', href: '/campaigns', icon: <Target className="h-4 w-4" /> },
            { label: 'View Approvals', href: '/review', icon: <CheckSquare className="h-4 w-4" /> },
            { label: 'Schedule Post', href: '/publish/calendar', icon: <Calendar className="h-4 w-4" /> },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm font-bold text-muted-foreground hover:border-border/50 hover:bg-surface-2 hover:text-foreground transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-1 shadow-sm border border-border/50 text-foreground group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                {a.icon}
              </div>
              {a.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="relative rounded-xl bg-surface-1/50 p-4 border border-border/50 hover:bg-surface-2 transition-colors group">
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tight text-foreground text-center">{value}</p>
    </div>
  );
}
