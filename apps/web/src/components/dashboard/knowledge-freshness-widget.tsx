'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import { cn } from '@brandflow/ui';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface StaleSource {
  id: string;
  title: string;
  type: string;
  lastSyncedAt: string | null;
  staleSince: string | null;
  entryCount: number;
}

interface FreshnessData {
  totalSources: number;
  staleSources: number;
  staleEntries: number;
  lastChecked: string | null;
  sources: StaleSource[];
}

export function KnowledgeFreshnessWidget() {
  const queryClient = useQueryClient();
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<FreshnessData>({
    queryKey: ['knowledge-freshness'],
    queryFn: async () => {
      const res = await apiClient.get('/knowledge/freshness');
      return res.data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const syncMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      setSyncingIds((prev) => new Set([...prev, sourceId]));
      await apiClient.post(`/knowledge/sources/${sourceId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-freshness'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onSettled: (_data, _err, sourceId) => {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/knowledge/sources/sync-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-freshness'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900 animate-pulse">
        <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-4 h-20 rounded bg-gray-100 dark:bg-gray-800/50" />
      </div>
    );
  }

  if (!data) return null;

  const freshnessPercent =
    data.totalSources > 0
      ? Math.round(((data.totalSources - data.staleSources) / data.totalSources) * 100)
      : 100;

  const isAllFresh = data.staleSources === 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Knowledge Freshness</h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              isAllFresh
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
            )}
          >
            {isAllFresh ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                All Fresh
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                {data.staleSources} Stale
              </>
            )}
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {freshnessPercent}%
          </span>
        </div>
      </div>

      {!isAllFresh && (
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {data.staleEntries} entries affected across {data.staleSources} source{data.staleSources !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={cn('h-3 w-3', syncAllMutation.isPending && 'animate-spin')}
              />
              Sync All Stale
            </button>
          </div>

          <div className="space-y-2">
            {data.sources.map((source) => {
              const isSyncing = syncingIds.has(source.id) || syncAllMutation.isPending;
              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <SourceTypeIcon type={source.type} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {source.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {source.lastSyncedAt
                          ? `Last synced ${formatDistanceToNow(new Date(source.lastSyncedAt), { addSuffix: true })}`
                          : 'Never synced'}
                        {' · '}{source.entryCount} entries
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => syncMutation.mutate(source.id)}
                    disabled={isSyncing}
                    className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white dark:bg-gray-900 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
                    Re-ingest
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAllFresh && (
        <div className="px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            All knowledge sources are up to date.
          </p>
          {data.lastChecked && (
            <p className="mt-1 text-xs text-gray-400">
              Last checked {formatDistanceToNow(new Date(data.lastChecked), { addSuffix: true })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SourceTypeIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    pdf: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    url: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    notion: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    manual: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <span
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold uppercase',
        colors[type.toLowerCase()] ?? colors['manual'],
      )}
    >
      {type.slice(0, 3)}
    </span>
  );
}
