'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface KnowledgeJob {
  id: string;
  sourceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
  source?: { name?: string; type: string };
}

interface IngestionLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  createdAt: string;
}

interface FailedRecord {
  id: string;
  sourceId: string;
  error: string;
  failedAt: string;
}

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/20',  label: 'Pending' },
  processing: { icon: Loader2,      color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/20',    label: 'Processing', spin: true },
  completed:  { icon: CheckCircle2, color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/20', label: 'Completed' },
  failed:     { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/20',      label: 'Failed' },
};

const LEVEL_COLOR: Record<string, string> = {
  DEBUG: 'text-muted-foreground',
  INFO:  'text-blue-500',
  WARN:  'text-amber-500',
  ERROR: 'text-red-500',
};

function JobRow({ job, businessId }: { job: KnowledgeJob; businessId?: string }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const { data: logs = [] } = useQuery<IngestionLog[]>({
    queryKey: ['ingestion-logs', job.sourceId],
    queryFn: async () => {
      const res = await apiClient.get(`/knowledge/sources/${job.sourceId}/logs`);
      return res.data;
    },
    enabled: expanded,
    refetchInterval: job.status === 'processing' ? 2000 : false,
  });

  const handleRetry = async () => {
    await apiClient.post(`/knowledge/jobs/${job.id}/retry`);
  };

  return (
    <div className={`rounded-xl border ${cfg.bg} border-transparent mb-2 overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color} ${'spin' in cfg && cfg.spin ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {job.source?.name ?? job.sourceId.slice(0, 8)}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{job.source?.type}</span>
            <span className={`ml-auto text-xs font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
          </div>
          {job.status === 'processing' && (
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 bg-surface-3">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}
          {job.stage && job.status === 'processing' && (
            <p className="mt-1 text-xs text-muted-foreground capitalize">{job.stage} — {job.progress}%</p>
          )}
          {job.error && (
            <p className="mt-1 text-xs text-red-500 truncate">{job.error}</p>
          )}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 py-3 space-y-1 max-h-60 overflow-y-auto">
          {job.status === 'failed' && (
            <button
              onClick={handleRetry}
              className="mb-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry ingestion
            </button>
          )}
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No logs yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-xs font-mono">
                <span className={`font-bold w-12 flex-shrink-0 ${LEVEL_COLOR[log.level]}`}>{log.level}</span>
                <span className="text-muted-foreground text-foreground break-all">{log.message}</span>
                <span className="ml-auto text-muted-foreground dark:text-gray-600 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function LiveIngestionMonitor() {
  const [tab, setTab] = useState<'jobs' | 'failed'>('jobs');

  const { data: jobs = [], refetch: refetchJobs, isLoading: jobsLoading, isError: jobsError } = useQuery<KnowledgeJob[]>({
    queryKey: ['knowledge-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/knowledge/jobs');
      return res.data;
    },
    refetchInterval: 4000,
  });

  const { data: failedRecords = [] } = useQuery<FailedRecord[]>({
    queryKey: ['knowledge-failed-records'],
    queryFn: async () => {
      const res = await apiClient.get('/knowledge/failed-records');
      return res.data;
    },
    enabled: tab === 'failed',
    refetchInterval: 10000,
  });

  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'pending');
  const recentJobs = jobs.slice(0, 25);

  return (
    <div className="rounded-[1.25rem] border border-border bg-surface-1 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-bold text-foreground">Live Ingestion Monitor</h3>
          {activeJobs.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/30 px-2 py-0.5 text-xs font-bold text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              {activeJobs.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => refetchJobs()}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-surface-2"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {(['jobs', 'failed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all ${
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
            }`}
          >
            {t === 'failed' ? 'Failed Records' : 'Ingestion Jobs'}
            {t === 'failed' && failedRecords.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 dark:bg-red-950/30 px-1.5 py-0.5 text-xs text-red-600">
                {failedRecords.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[480px] overflow-y-auto">
        {tab === 'jobs' && (
          <>
            {jobsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-surface-2 p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full bg-surface-3 bg-surface-3" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded bg-surface-3 bg-surface-3" />
                        <div className="h-1.5 w-full rounded-full bg-surface-3 bg-surface-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobsError ? (
              <div className="py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-red-300 dark:text-red-700 mx-auto mb-2" />
                <p className="text-sm text-red-500 font-medium">Failed to load ingestion jobs.</p>
                <button onClick={() => refetchJobs()} className="mt-2 text-xs font-bold text-blue-600 hover:underline">
                  Try again
                </button>
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No ingestion jobs yet. Add a source to get started.</p>
              </div>
            ) : (
              recentJobs.map((job) => <JobRow key={job.id} job={job} />)
            )}
          </>
        )}

        {tab === 'failed' && (
          <>
            {failedRecords.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-200 dark:text-emerald-900 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No failed records. All ingestions succeeded.</p>
              </div>
            ) : (
              failedRecords.map((record) => (
                <div key={record.id} className="mb-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">{record.error}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source: {record.sourceId.slice(0, 8)}… · {new Date(record.failedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
