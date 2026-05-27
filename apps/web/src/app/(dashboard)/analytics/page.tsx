'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, DollarSign } from 'lucide-react';
import { CostAnalysisDashboard } from '@/components/analytics/cost-dashboard';
import { apiClient } from '@/lib/api-client';
import {
  AnalyticsMetricsGrid,
  PerformanceTrendChart,
  ImpactAttribution,
  PlatformBreakdownChart,
  EventMixTracker,
  KnowledgeImpactMatrix,
  RecommendationList,
  AnalyticsSummary,
} from '@/features/analytics/components';



export default function AnalyticsDashboard() {
  const [windowDays, setWindowDays] = useState<'7' | '30'>('7');

  const from = new Date();
  from.setDate(from.getDate() - Number(windowDays));

  const {
    data: analytics,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics', 'summary', windowDays],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/summary', {
        params: { from: from.toISOString(), to: new Date().toISOString() },
      });
      return res.data;
    },
  });

  const { data: impactData, isLoading: isImpactLoading } = useQuery({
    queryKey: ['analytics', 'impact'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/analytics/intelligence-impact');
      return res.data;
    },
  });

  const { data: recommendations, isLoading: isRecLoading } = useQuery({
    queryKey: ['analytics', 'recommendations'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/analytics/recommendations');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-surface-3" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-surface-3" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">ROI & Intelligence</h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl text-balance">
            Live attribution across performance, AI cost, and your knowledge-powered content loop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value as '7' | '30')}
            className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20 hover:bg-surface-2 transition-all"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-surface-1/50 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2 hover:border-primary transition-all micro-hover"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <AnalyticsMetricsGrid summary={analytics?.summary} windowDays={windowDays} />

      {/* AI Spend Section */}
      <div className="glass-premium rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
        <h2 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3 relative z-10">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          AI Spend & Compute Efficiency
        </h2>
        <CostAnalysisDashboard />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        <PerformanceTrendChart 
          chartData={analytics?.trend ?? []} 
          windowDays={windowDays}
          rangeTo={analytics?.range?.to}
        />
        
        <ImpactAttribution 
          impactSummary={impactData?.slice(0, 4).map((item: any, i: number) => ({
            name: item.name,
            engagement: Math.round(item.engagement),
            color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6] ?? '#6366f1',
          })) || []} 
          isImpactLoading={isImpactLoading}
          topSource={analytics?.topSources?.[0]}
        />
        
        <PlatformBreakdownChart platformBreakdown={analytics?.platformBreakdown} />
        
        <EventMixTracker eventMix={analytics?.eventMix} />
        
        <KnowledgeImpactMatrix topSources={analytics?.topSources} />
        
        <RecommendationList recommendations={recommendations} isRecLoading={isRecLoading} />
      </div>
    </div>
  );
}

