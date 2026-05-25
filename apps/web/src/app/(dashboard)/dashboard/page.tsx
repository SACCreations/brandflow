'use client';

import { useApiQuery } from '@/hooks/use-api';
import { DashboardStats } from '@/features/dashboard/components/DashboardStats';
import { RecentActivityFeed } from '@/features/dashboard/components/RecentActivityFeed';
import { WorkspaceSnapshot } from '@/features/dashboard/components/WorkspaceSnapshot';
import { AiInsightsWidget } from '@/features/dashboard/components/AiInsightsWidget';

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
  const { data, isLoading, isError } = useApiQuery<DashboardSummaryResponse>(
    ['dashboard-summary'],
    '/business/dashboard',
    {},
    { staleTime: 60_000 }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Workspace Overview</h1>
        <p className="mt-2 text-sm text-gray-500 font-medium">Your live summary across brand, content, and publishing workflows.</p>
      </div>

      <DashboardStats stats={data?.stats} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
           <AiInsightsWidget />
           <RecentActivityFeed 
             recentActivity={data?.recentActivity ?? []} 
             isLoading={isLoading} 
             isError={isError} 
           />
        </div>

        <div className="space-y-6">
          <WorkspaceSnapshot stats={data?.stats} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
