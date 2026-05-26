'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@brandflow/ui';

interface RecentActivityFeedProps {
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>;
  isLoading: boolean;
  isError: boolean;
}

export function RecentActivityFeed({ recentActivity, isLoading, isError }: RecentActivityFeedProps) {
  return (
    <Card className="glass-premium overflow-hidden animate-fade-in-up" style={{ animationDelay: '500ms' }}>
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="font-semibold text-foreground">Recent Activity</h2>
      </div>

      {isError ? (
        <div className="p-8 text-center text-sm text-red-500">
          Failed to load activity. Please refresh the page.
        </div>
      ) : isLoading ? (
        <div className="divide-y divide-border/50">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4 animate-pulse">
              <div className="h-4 w-40 rounded bg-surface-2" />
              <div className="mt-2 h-3 w-64 rounded bg-surface-3" />
            </div>
          ))}
        </div>
      ) : recentActivity?.length ? (
        <div className="divide-y divide-border/50">
          {recentActivity.map((activity) => (
            <Link
              key={activity.id}
              href={activity.href}
              className="block px-6 py-4 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground font-medium">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground text-sm">No activity yet — create content, campaigns, or approvals to populate this feed.</div>
      )}
    </Card>
  );
}
