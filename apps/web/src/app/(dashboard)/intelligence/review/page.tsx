'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Check, 
  X, 
  AlertCircle, 
  MessageSquare, 
  History,
  Brain,
  Filter,
  Eye,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Inbox,
} from 'lucide-react';
import { cn } from '@brandflow/ui';
import { apiClient } from '@/lib/api-client';

interface ApprovalItem {
  id: string;
  status: string;
  reviewType: string;
  routeReason: string | null;
  slaDeadline: string | null;
  createdAt: string;
  content: {
    id: string;
    body: string;
    type: string;
    platform: string;
    status: string;
    brand: { id: string; name: string } | null;
    campaign: { id: string; name: string; status: string } | null;
    qualityChecks: Array<{
      overallGrade: string;
      confidenceScore: number;
      factualScore: number;
      safetyScore: number;
      complianceScore: number;
      passed: boolean;
    }>;
  };
}

type FilterSource = 'all' | 'auto' | 'manual';

export default function ReviewQueuePage() {
  const queryClient = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all');

  const { data: approvals = [], isLoading, isError } = useQuery<ApprovalItem[]>({
    queryKey: ['approval-queue', sourceFilter],
    queryFn: async () => {
      const params: Record<string, string> = { status: 'pending' };
      if (sourceFilter !== 'all') params['source'] = sourceFilter;
      const res = await apiClient.get('/approvals/queue', { params });
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      await apiClient.post(`/approvals/${id}/decide`, { status, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiClient.post('/approvals/bulk-approve', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const autoRouted = approvals.filter((a) => a.routeReason);
  const manualRouted = approvals.filter((a) => !a.routeReason);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Review Queue</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Approve, reject, or request revisions for content requiring review.
          </p>
        </div>
        {approvals.length > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            {approvals.length} item{approvals.length !== 1 ? 's' : ''} require attention
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Filter By</h3>
            <div className="space-y-2">
              <FilterItem label="All Items" count={approvals.length} active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')} />
              <FilterItem label="Auto-Routed" count={autoRouted.length} active={sourceFilter === 'auto'} onClick={() => setSourceFilter('auto')} />
              <FilterItem label="Manual Requests" count={manualRouted.length} active={sourceFilter === 'manual'} onClick={() => setSourceFilter('manual')} />
            </div>
          </div>

          {approvals.length > 1 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <h3 className="mb-2 text-sm font-bold text-emerald-800 dark:text-emerald-400">Quick Actions</h3>
              <p className="mb-4 text-xs text-emerald-700/70 dark:text-emerald-400/60">Batch approve all items in queue.</p>
              <button
                onClick={() => bulkApproveMutation.mutate(approvals.map((a) => a.id))}
                disabled={bulkApproveMutation.isPending}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {bulkApproveMutation.isPending ? 'Approving…' : `Bulk Approve (${approvals.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Review List */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-900/10">
              <p className="text-sm text-red-600">Failed to load approval queue. Please try again.</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <Inbox className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Queue is clear</h3>
              <p className="mt-2 text-sm text-gray-500">No items pending review. Content with quality grade below B will appear here automatically.</p>
            </div>
          ) : (
            approvals.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                onApprove={() => decideMutation.mutate({ id: item.id, status: 'approved' })}
                onReject={() => decideMutation.mutate({ id: item.id, status: 'rejected' })}
                onRevision={() => decideMutation.mutate({ id: item.id, status: 'revision_requested' })}
                isActing={decideMutation.isPending}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({
  item,
  onApprove,
  onReject,
  onRevision,
  isActing,
}: {
  item: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
  onRevision: () => void;
  isActing: boolean;
}) {
  const qc = item.content.qualityChecks[0];
  const isAutoRouted = !!item.routeReason;

  const gradeColors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    F: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className={cn(
      'group relative rounded-2xl border bg-white dark:bg-gray-900 p-6 transition-all hover:shadow-lg dark:bg-gray-900',
      isAutoRouted
        ? 'border-amber-200 dark:border-amber-500/30 ring-1 ring-amber-500/10'
        : 'border-gray-200 dark:border-gray-800',
    )}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {qc && (
            <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase', gradeColors[qc.overallGrade] ?? gradeColors['C'])}>
              Grade {qc.overallGrade}
            </span>
          )}
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {item.content.platform} · {item.content.type}
          </span>
          {item.content.brand && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              {item.content.brand.name}
            </span>
          )}
          {isAutoRouted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <ShieldAlert className="h-3 w-3" />
              Auto-routed
            </span>
          )}
        </div>
        {item.content.campaign && (
          <span className="text-xs text-gray-400">{item.content.campaign.name}</span>
        )}
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-900 dark:text-white leading-relaxed line-clamp-4">
          {item.content.body}
        </p>
      </div>

      {/* Quality Scores */}
      {qc && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          <ScorePill label="Confidence" value={qc.confidenceScore} />
          <ScorePill label="Factual" value={qc.factualScore} />
          <ScorePill label="Safety" value={qc.safetyScore} />
          <ScorePill label="Compliance" value={qc.complianceScore} />
        </div>
      )}

      {isAutoRouted && item.routeReason && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Brain className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{item.routeReason}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 pt-4 dark:border-gray-800">
        <button
          onClick={onRevision}
          disabled={isActing}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1 inline" /> Revision
        </button>
        <button
          onClick={onReject}
          disabled={isActing}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-red-500/10 disabled:opacity-50"
        >
          <X className="h-4 w-4 mr-1 inline" /> Reject
        </button>
        <button
          onClick={onApprove}
          disabled={isActing}
          className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Check className="h-4 w-4 mr-1 inline" /> Approve
        </button>
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  const color =
    percent >= 90 ? 'text-emerald-600' : percent >= 70 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-950 px-3 py-2 text-center dark:bg-gray-800/50">
      <p className="text-[10px] uppercase text-gray-400">{label}</p>
      <p className={cn('text-sm font-bold', color)}>{percent}%</p>
    </div>
  );
}

function FilterItem({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
          : 'text-gray-500 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800',
      )}
    >
      <span>{label}</span>
      <span className={cn(
        'rounded-full px-2 py-0.5 text-[10px]',
        active ? 'bg-brand-200 text-brand-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500',
      )}>
        {count}
      </span>
    </button>
  );
}
