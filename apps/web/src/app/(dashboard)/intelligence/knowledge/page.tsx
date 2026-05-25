'use client';

import React, { useState } from 'react';
import { Search, Plus, AlertCircle } from 'lucide-react';
import AddSourceModal from '@/components/knowledge/add-source-modal';
import KnowledgeExplorer from '@/components/knowledge/knowledge-explorer';
import LiveIngestionMonitor from '@/components/knowledge/live-ingestion-monitor';
import SourcesTable from '@/components/knowledge/sources-table';
import { useApiQuery } from '@/hooks/use-api';
import { KnowledgeStatsGrid } from '@/features/knowledge/components/KnowledgeStatsGrid';
import { SourceStatusMix } from '@/features/knowledge/components/SourceStatusMix';

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
  
  const { data, isLoading, isError } = useApiQuery<KnowledgeStatsResponse>(
    ['knowledge-stats'],
    '/knowledge/stats',
    {},
    {
      staleTime: 30_000,
      refetchInterval: 15_000, // Reduced polling interval to 15s to save resources
    }
  );

  const stats = {
    totalSources: data?.totalSources ?? 0,
    totalEntries: data?.totalEntries ?? 0,
    pendingReviews: data?.pendingReviews ?? 0,
    healthScore: Math.round(data?.healthScore ?? 0),
    avgConfidence: data?.averageConfidence ?? 0,
  };

  const statusMix = Object.entries(data?.sourcesByStatus ?? {});
  const totalStatusCount = statusMix.reduce((sum, [, count]) => sum + (count as number), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Knowledge Hub</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            The operational brain and truth source for your enterprise AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExplorerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
          >
            <Search className="h-4 w-4" />
            Explorer
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Knowledge
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900 dark:text-red-200">Failed to load knowledge stats</h3>
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Check your connection and try again.</p>
            </div>
          </div>
        </div>
      ) : (
        <KnowledgeStatsGrid stats={stats} isLoading={isLoading} />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Live Ingestion Monitor */}
        <div className="lg:col-span-2">
          <LiveIngestionMonitor />
        </div>

        {/* Knowledge Distribution */}
        <div>
          <SourceStatusMix 
            statusMix={statusMix} 
            totalStatusCount={totalStatusCount} 
            pendingReviews={stats.pendingReviews} 
          />
        </div>
      </div>

      <SourcesTable />

      <AddSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <KnowledgeExplorer isOpen={isExplorerOpen} onClose={() => setIsExplorerOpen(false)} />
    </div>
  );
}
