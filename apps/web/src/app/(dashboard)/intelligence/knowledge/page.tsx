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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Knowledge Hub</h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl text-balance">
            The operational brain and truth source for your enterprise AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExplorerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-surface-2 shadow-sm micro-hover"
          >
            <Search className="h-4 w-4" />
            Explorer
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-[1px] micro-hover"
          >
            <Plus className="h-4 w-4" />
            Add Knowledge
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {isError ? (
        <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Failed to load knowledge stats</h3>
              <p className="text-sm font-medium text-destructive mt-1">Check your connection and try again.</p>
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
