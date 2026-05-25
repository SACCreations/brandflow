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
    <Card className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
      </div>

      {isError ? (
        <div className="p-8 text-center text-sm text-red-500">
          Failed to load activity. Please refresh the page.
        </div>
      ) : isLoading ? (
        <div className="divide-y divide-border/50">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4 animate-pulse">
              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-64 rounded bg-gray-100 dark:bg-gray-900" />
            </div>
          ))}
        </div>
      ) : recentActivity?.length ? (
        <div className="divide-y divide-border/50">
          {recentActivity.map((activity) => (
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
                <span className="whitespace-nowrap text-xs text-gray-400 font-medium">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 text-sm">No activity yet — create content, campaigns, or approvals to populate this feed.</div>
      )}
    </Card>
  );
}
