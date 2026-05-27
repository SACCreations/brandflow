'use client';

import React from 'react';
import { Card } from '@brandflow/ui';
import { FileText, CheckCircle2, CalendarClock, Zap } from 'lucide-react';
import { cn } from '@brandflow/ui';

interface DashboardStatsProps {
  stats: {
    contentCreated: number;
    pendingApprovals: number;
    postsScheduled: number;
    tokenUsage: {
      used: number;
      limit: number;
      percentage: number;
    };
  } | undefined;
  isLoading: boolean;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const statItems = [
    {
      label: 'Content Created',
      value: isLoading ? '—' : String(stats?.contentCreated ?? 0),
      helper: 'All generated and saved items',
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: 'Pending Approvals',
      value: isLoading ? '—' : String(stats?.pendingApprovals ?? 0),
      helper: 'Items waiting for review',
      icon: CheckCircle2,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Posts Scheduled',
      value: isLoading ? '—' : String(stats?.postsScheduled ?? 0),
      helper: 'Upcoming scheduled posts',
      icon: CalendarClock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Token Usage',
      value: isLoading ? '—' : `${stats?.tokenUsage?.percentage ?? 0}%`,
      helper: isLoading
        ? 'Loading token usage…'
        : `${formatNumber(stats?.tokenUsage?.used ?? 0)} / ${formatNumber(stats?.tokenUsage?.limit ?? 0)}`,
      icon: Zap,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="group relative overflow-hidden p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 bg-surface-1/60 backdrop-blur-xl border-border/50 hover:border-border"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-surface-2/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110", stat.bg)}>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-3xl font-black tracking-tighter text-foreground mb-1">{stat.value}</p>
              {stat.label === 'Token Usage' && !isLoading && (
                <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2 mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${stats?.tokenUsage?.percentage ?? 0}%` }} 
                  />
                </div>
              )}
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">{stat.helper}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
