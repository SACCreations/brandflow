'use client';

import React from 'react';
import { Card } from '@brandflow/ui';

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
      icon: '✦',
      color: 'text-brand-500',
      bg: 'bg-brand-500/10'
    },
    {
      label: 'Pending Approvals',
      value: isLoading ? '—' : String(stats?.pendingApprovals ?? 0),
      helper: 'Items waiting for review',
      icon: '✓',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Posts Scheduled',
      value: isLoading ? '—' : String(stats?.postsScheduled ?? 0),
      helper: 'Upcoming scheduled posts',
      icon: '◷',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Token Usage',
      value: isLoading ? '—' : `${stats?.tokenUsage?.percentage ?? 0}%`,
      helper: isLoading
        ? 'Loading token usage…'
        : `${formatNumber(stats?.tokenUsage?.used ?? 0)} / ${formatNumber(stats?.tokenUsage?.limit ?? 0)}`,
      icon: '⊞',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <Card
          key={stat.label}
          className="glass rounded-2xl p-5 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </span>
          </div>
          <p className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
          <p className="mt-2 text-xs font-medium text-gray-400">{stat.helper}</p>
        </Card>
      ))}
    </div>
  );
}
