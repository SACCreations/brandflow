'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  Database, 
  Search, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  BrainCircuit, 
  Filter, 
  Plus,
  FileText,
  Globe
} from 'lucide-react';
import AddSourceModal from '@/components/knowledge/add-source-modal';
import KnowledgeExplorer from '@/components/knowledge/knowledge-explorer';
import LiveIngestionMonitor from '@/components/knowledge/live-ingestion-monitor';
import SourcesTable from '@/components/knowledge/sources-table';
import { apiClient } from '@/lib/api-client';


interface KnowledgeStatsResponse {
  totalSources: number;
  totalEntries: number;
  pendingReviews: number;
  healthScore: number;
  averageConfidence: number;
  recentJobs: Array<{
    id: string;
    status: string;
    stage: string;
    createdAt: string;
    source?: {
      name: string | null;
      type: string;
    } | null;
  }>;
  sourcesByStatus: Record<string, number>;
}

export default function KnowledgeDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const { data, isLoading, isError } = useQuery<KnowledgeStatsResponse>({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      const response = await apiClient.get<KnowledgeStatsResponse>('/knowledge/stats');
      return response.data;
    },
    staleTime: 30_000,
    refetchInterval: 5000,
  });


  const stats = {
    totalSources: data?.totalSources ?? 0,
    totalEntries: data?.totalEntries ?? 0,
    pendingReviews: data?.pendingReviews ?? 0,
    healthScore: Math.round(data?.healthScore ?? 0),
    avgConfidence: data?.averageConfidence ?? 0,
  };

  const recentActivity = data?.recentJobs ?? [];
  const statusMix = Object.entries(data?.sourcesByStatus ?? {});
  const totalStatusCount = statusMix.reduce((sum, [, count]) => sum + (count as number), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Knowledge Hub</h1>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            The operational brain and truth source for your enterprise AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExplorerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Search className="h-4 w-4" />
            Explorer
          </button>
          
          <div className="relative group">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add Knowledge
            </button>
            
            {/* Quick Actions Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 transition-all opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto dark:border-gray-800 dark:bg-gray-900 z-50">
              <button onClick={() => setIsModalOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                <FileText className="h-4 w-4 text-brand-500" />
                Upload File
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                <Globe className="h-4 w-4 text-blue-500" />
                Add URL
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 border-t border-gray-50 dark:border-gray-800 mt-1 pt-2">
                <Search className="h-4 w-4 text-purple-500" />
                Full Connector Hub
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Intelligence Health" 
          value={isLoading ? '—' : `${stats.healthScore}%`} 
          description="Global accuracy & freshness"
          icon={<BrainCircuit className="h-6 w-6 text-brand-500" />}
          trend={isLoading ? undefined : `${stats.pendingReviews} pending`}
          trendUp={stats.pendingReviews < 5}
        />
        <StatCard 
          title="Knowledge Atoms" 
          value={isLoading ? '—' : stats.totalEntries.toLocaleString()} 
          description="Classified facts & claims"
          icon={<Database className="h-6 w-6 text-blue-500" />}
        />
        <StatCard 
          title="Avg. Confidence" 
          value={isLoading ? '—' : `${(stats.avgConfidence * 100).toFixed(0)}%`} 
          description="AI extraction certainty"
          icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
        />
        <StatCard 
          title="Review Queue" 
          value={isLoading ? '—' : stats.pendingReviews} 
          description="Requires human validation"
          icon={<Clock className="h-6 w-6 text-amber-500" />}
          alert={stats.pendingReviews > 10}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Live Ingestion Monitor */}
        <div className="lg:col-span-2">
          <LiveIngestionMonitor />
        </div>

        {/* Knowledge Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Source Status Mix</h3>
          <div className="space-y-5">
            {statusMix.length > 0 ? (
              statusMix.map(([status, count], index) => (
                <ProgressItem
                  key={status}
                  label={status.replace(/_/g, ' ')}
                  percentage={totalStatusCount > 0 ? Math.round(((count as number) / totalStatusCount) * 100) : 0}
                  color={STATUS_COLORS[index % STATUS_COLORS.length]}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add a source to see ingestion status distribution.
              </p>
            )}
          </div>
          <div className="mt-8 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-brand-500" />
              AI Insight
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {stats.pendingReviews > 0
                ? `${stats.pendingReviews} knowledge item${stats.pendingReviews === 1 ? '' : 's'} still need human review. Clearing the queue will improve trust in downstream generation.`
                : 'Your review queue is clear. Keep feeding high-quality sources to improve generation grounding.'}
            </p>
          </div>
        </div>
      </div>

      <SourcesTable />

      <AddSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <KnowledgeExplorer isOpen={isExplorerOpen} onClose={() => setIsExplorerOpen(false)} />
    </div>
  );
}

const STATUS_COLORS = ['bg-blue-500', 'bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];

function StatCard({ title, value, description, icon, trend, trendUp, alert }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${alert ? 'ring-2 ring-amber-500/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
            <ArrowUpRight className="ml-0.5 h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function ProgressItem({ label, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div 
          className={`h-full transition-all duration-1000 ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
