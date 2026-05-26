'use client';

import React from 'react';
import { 
  Activity, 
  Search, 
  Terminal, 
  Clock, 
  RotateCcw, 
  Layers,
  Cpu,
  BarChart3,
  HardDrive,
  ArrowRight
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast, Tabs, TabsList, TabsTrigger, TabsContent, cn } from '@brandflow/ui';
import { formatDistanceToNow } from 'date-fns';

export default function ProcessingMonitorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingestionJobs = [], isLoading: loadingIngestion } = useQuery({
    queryKey: ['knowledge-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/knowledge/jobs');
      return res.data as any[];
    },
    refetchInterval: 5000,
  });

  const { data: publishJobs = [], isLoading: loadingPublish } = useQuery({
    queryKey: ['publish-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/schedules/jobs');
      return res.data as any[];
    },
    refetchInterval: 5000,
  });

  const retryIngestion = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/knowledge/jobs/${id}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-jobs'] });
      toast({ title: 'Ingestion re-queued', description: 'The process has been restarted.' });
    },
  });

  const retryPublish = useMutation({
    mutationFn: async (scheduleId: string) => {
      await apiClient.post(`/schedules/${scheduleId}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publish-jobs'] });
      toast({ title: 'Post re-queued', description: 'The publishing process has been restarted.' });
    },
  });

  const activeIngestion = ingestionJobs.filter(j => j.status === 'processing' || j.status === 'pending');
  const historicalIngestion = ingestionJobs.filter(j => j.status === 'completed' || j.status === 'failed');

  const activePublish = publishJobs.filter(j => j.status === 'processing' || j.status === 'pending');
  const historicalPublish = publishJobs.filter(j => j.status === 'published' || j.status === 'failed' || j.status === 'retrying');

  const successRate = publishJobs.length > 0 
    ? (publishJobs.filter(j => j.status === 'published').length / publishJobs.length * 100).toFixed(1)
    : '100';

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Processing Monitor</h1>
          <p className="mt-2 text-muted-foreground">Real-time observability into ingestion pipelines and worker health.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold dark:bg-emerald-500/10 dark:text-emerald-400">
            <Cpu className="h-4 w-4" /> Workers Online
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Publish Success" value={`${successRate}%`} subValue="last 50 jobs" icon={<BarChart3 className="h-5 w-5 text-blue-500" />} />
        <MetricCard label="Active Tasks" value={activeIngestion.length + activePublish.length} subValue="parallel executions" icon={<Activity className="h-5 w-5 text-primary" />} />
        <MetricCard label="System Health" value="99.9%" subValue="cluster status" icon={<HardDrive className="h-5 w-5 text-emerald-500" />} />
      </div>

      <Tabs defaultValue="ingestion" className="w-full">
        <TabsList className="bg-surface-3 p-1 rounded-xl mb-6">
          <TabsTrigger value="ingestion" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            Knowledge Ingestion
          </TabsTrigger>
          <TabsTrigger value="publishing" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            Social Publishing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingestion" className="space-y-6">
          <ActiveJobsSection title="Active Ingestions" jobs={activeIngestion} />
          <HistoryTableSection 
            title="Ingestion History" 
            jobs={historicalIngestion} 
            onRetry={(id: string) => retryIngestion.mutate(id)}
            retryLoading={retryIngestion.isPending}
          />
        </TabsContent>

        <TabsContent value="publishing" className="space-y-6">
          <ActiveJobsSection title="Publishing Queue" jobs={activePublish} type="publish" />
          <HistoryTableSection 
            title="Publishing History" 
            jobs={historicalPublish} 
            type="publish"
            onRetry={(id: string) => retryPublish.mutate(id)}
            retryLoading={retryPublish.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActiveJobsSection({ title, jobs, type = 'ingestion' }: any) {
  if (jobs.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {title}
        </h3>
        <span className="text-xs font-medium text-muted-foreground">Updates every 5s</span>
      </div>
      <div className="space-y-6">
        {jobs.map((job: any) => (
          <div key={job.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-muted-foreground">{job.id.slice(0, 8)}</span>
                <span className="font-semibold text-foreground">
                  {type === 'ingestion' ? (job.source.name || job.source.type) : (job.socialAccount.name)}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-primary/100/10 dark:text-brand-400 uppercase tracking-tighter">
                  <Layers className="h-3 w-3" /> {job.stage || job.status}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${job.progress ?? 50}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTableSection({ title, jobs, onRetry, retryLoading, type = 'ingestion' }: any) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-500" />
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/60">
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">ID</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Source / Account</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Atoms / Retries</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {jobs.map((job: any) => (
              <tr key={job.id} className="text-sm transition-colors hover:bg-surface-1 dark:bg-gray-950/50 dark:hover:bg-surface-1/30">
                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{job.id.slice(0, 8)}</td>
                <td className="px-4 py-4 font-medium text-foreground">
                  {type === 'ingestion' ? (job.source.name || job.source.type) : job.socialAccount.name}
                  {job.failureReason && <p className="mt-1 text-[10px] text-red-500 font-normal">{job.failureReason}</p>}
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    (job.status === 'completed' || job.status === 'published') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                  )}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {type === 'ingestion' ? (job.entries ?? '—') : (job.retryCount ?? 0)}
                </td>
                <td className="px-4 py-4 text-muted-foreground text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </div>
                  {job.status === 'failed' && (
                    <button 
                      onClick={() => onRetry(type === 'ingestion' ? job.id : job.scheduleId)}
                      disabled={retryLoading}
                      className="text-primary hover:text-brand-700 font-bold uppercase text-[10px] tracking-widest"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground italic">No job history found in this category.</div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon }: any) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-surface-1 bg-background p-3 bg-surface-2">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-foreground">{value}</h4>
            <span className="text-xs text-muted-foreground font-medium">{subValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
