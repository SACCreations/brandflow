'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Facebook,
  MoreVertical,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Activity,
  AlertCircle,
  Eye,
  Layout,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, useToast } from '@brandflow/ui';

interface ScheduleItem {
  id: string;
  status: string;
  scheduledAt: string;
  content?: {
    id: string;
    body: string;
    platform: string;
    type: string;
    status: string;
  } | null;
  campaign?: {
    id: string;
    name: string;
  } | null;
  socialAccount: {
    id: string;
    platform: string;
    name: string;
  };
  publishJobs: Array<{
    id: string;
    status: string;
    publishedAt?: string | null;
    failureReason?: string | null;
    failureClass?: string | null;
    nextRetryAt?: string | null;
  }>;
}

interface SocialAccount {
  id: string;
  platform: string;
  name: string;
}

export default function PublishQueuePage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'queue' | 'history'>('queue');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['publish-queue'],
    queryFn: async () => {
      const res = await apiClient.get('/schedules');
      return res.data as ScheduleItem[];
    },
  });

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await apiClient.get('/social/accounts');
      return res.data as SocialAccount[];
    },
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publish-queue'] });
      toast({ title: 'Schedule cancelled', description: 'The post was removed from the publishing queue.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to cancel schedule',
        description: error?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const retryScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/schedules/${id}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publish-queue'] });
      toast({ title: 'Retry queued', description: 'The failed publish job was re-queued.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to retry publish',
        description: error?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesView = view === 'queue'
        ? schedule.status === 'pending'
        : schedule.status !== 'pending';
      const haystack = [
        schedule.content?.body,
        schedule.content?.platform,
        schedule.socialAccount.name,
        schedule.campaign?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesView && haystack.includes(search.toLowerCase());
    });
  }, [schedules, search, view]);

  const scheduledCount = schedules.filter((schedule) => schedule.status === 'pending').length;
  const publishedCount = schedules.filter((schedule) => schedule.status === 'published').length;
  const failedCount = schedules.filter((schedule) => schedule.status === 'failed').length;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Publishing Hub</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage, tailor, and schedule your global content distribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/publish/calendar" className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            <Calendar className="h-4 w-4" /> Calendar View
          </Link>
          <Link href="/publish/social" className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
            <Sparkles className="h-4 w-4" /> Manage accounts
          </Link>
        </div>
      </div>

      {/* Analytics Mini-Bar */}
      <div className="grid gap-6 md:grid-cols-4">
        <PublishStat label="Scheduled" value={String(scheduledCount)} icon={<Clock className="h-4 w-4 text-blue-500" />} />
        <PublishStat label="Published" value={String(publishedCount)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        <PublishStat label="Connected Accounts" value={String(socialAccounts.length)} icon={<Activity className="h-4 w-4 text-brand-500" />} />
        <PublishStat label="Errors" value={String(failedCount)} icon={<AlertCircle className="h-4 w-4 text-gray-400" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Main List Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('queue')} className={`text-sm ${view === 'queue' ? 'font-bold text-brand-600 border-b-2 border-brand-600 pb-1' : 'font-medium text-gray-500 hover:text-gray-700'}`}>Queue</button>
              <button onClick={() => setView('history')} className={`text-sm ${view === 'history' ? 'font-bold text-brand-600 border-b-2 border-brand-600 pb-1' : 'font-medium text-gray-500 hover:text-gray-700'}`}>History</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search posts..." 
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
            </div>
          </div>

          {filteredSchedules.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-400 dark:border-gray-800">
              No schedules found for this view.
            </div>
          ) : filteredSchedules.map((schedule) => {
            const post = schedule.content;
            const platform = schedule.socialAccount.platform;
            const latestPublishJob = schedule.publishJobs[0];
            return (
            <div key={schedule.id} className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-600 dark:border-gray-900 dark:bg-gray-800">
                    {platform === 'linkedin' && <Linkedin className="h-3.5 w-3.5 text-blue-700" />}
                    {platform === 'twitter' && <Twitter className="h-3.5 w-3.5 text-sky-500" />}
                    {platform === 'instagram' && <Instagram className="h-3.5 w-3.5 text-pink-600" />}
                    {platform === 'facebook' && <Facebook className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(schedule.scheduledAt).toLocaleString()}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                        schedule.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        schedule.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {schedule.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{schedule.socialAccount.name}{schedule.campaign?.name ? ` • ${schedule.campaign.name}` : ''}</p>
                  </div>
                </div>
                {schedule.status === 'pending' ? (
                  <button onClick={() => cancelScheduleMutation.mutate(schedule.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : schedule.status === 'failed' ? (
                  <button onClick={() => retryScheduleMutation.mutate(schedule.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                {post?.body || 'Linked content was removed.'}
              </p>

              {latestPublishJob?.failureReason ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  {latestPublishJob.failureReason}
                  {latestPublishJob.nextRetryAt ? ` • next retry ${new Date(latestPublishJob.nextRetryAt).toLocaleString()}` : ''}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {post?.id ? (
                    <Link href={`/create/content/${post.id}`} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Link>
                  ) : null}
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                    <Sparkles className="h-3.5 w-3.5" /> {platform}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {schedule.status === 'failed' ? (
                    <button
                      onClick={() => retryScheduleMutation.mutate(schedule.id)}
                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950/30"
                    >
                      Retry publish
                    </button>
                  ) : null}
                  {post?.id ? (
                    <Link href={`/create/content/${post.id}`} className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-bold text-white dark:bg-brand-600">
                      Edit Post
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )})}
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-6 dark:border-brand-500/20 dark:bg-brand-500/5">
            <h3 className="text-sm font-bold text-brand-900 dark:text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-brand-600" />
              Smart Scheduling
            </h3>
            <p className="text-xs text-brand-700/70 dark:text-brand-400/70 mb-6 leading-relaxed">
              The scheduler is now live: approved content can be queued from the editor and tracked here by connected destination account.
            </p>
            <div className="rounded-xl bg-white dark:bg-gray-900 p-4 text-center border border-brand-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="text-2xl font-black text-brand-600">{socialAccounts.length}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Connected Accounts</div>
            </div>
            <Link href="/publish/social">
              <Button className="mt-4 w-full">Manage social accounts</Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layout className="h-4 w-4 text-purple-500" />
              Platform Limits
            </h3>
            <div className="space-y-4">
              <LimitItem label="LinkedIn" value={3000} used={filteredSchedules.filter((item) => item.socialAccount.platform === 'linkedin').length * 100} />
              <LimitItem label="Twitter" value={280} used={filteredSchedules.filter((item) => item.socialAccount.platform === 'twitter').length * 40} />
              <LimitItem label="Instagram" value={2200} used={filteredSchedules.filter((item) => item.socialAccount.platform === 'instagram').length * 80} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PublishStat({ label, value, icon }: any) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-950 p-2 dark:bg-gray-800">{icon}</div>
        <div>
          <div className="text-lg font-black text-gray-900 dark:text-white">{value}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
      </div>
    </div>
  );
}

function LimitItem({ label, value, used }: any) {
  const percentage = (used / value) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-400">{used} / {value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div 
          className={`h-full ${percentage > 90 ? 'bg-red-500' : 'bg-brand-500'}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
