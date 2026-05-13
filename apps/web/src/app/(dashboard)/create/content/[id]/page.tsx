'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, useToast } from '@brandflow/ui';
import { 
  ArrowLeft, 
  Calendar,
  CheckCircle2,
  Clock,
  Save, 
  Send, 
  Sparkles, 
  History, 
  Settings,
  MoreVertical,
  Type,
  Layout,
  Share2,
  Trash2,
  Target,
  Users,
  Zap,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import QualityChecksWidget from '@/components/editor/quality-checks-widget';

interface ContentDetail {
  id: string;
  body: string;
  status: string;
  platform: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  brand: {
    id: string;
    name: string;
  };
  brief?: {
    id: string;
    objective: string;
    audience: string | null;
    cta: string | null;
  } | null;
  campaign?: {
    id: string;
    name: string;
    status: string;
  } | null;
  schedules: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    socialAccount: {
      id: string;
      platform: string;
      name: string;
    };
    publishJobs: Array<{
      id: string;
      status: string;
      publishedAt?: string | null;
    }>;
  }>;
  approvals: Array<{
    id: string;
    status: string;
    reviewType: string;
    note?: string | null;
    createdAt: string;
    decidedAt?: string | null;
  }>;
  qualityChecks: Array<{
    passed: boolean;
    confidenceScore: number;
    category?: string | null;
    remediation?: string | null;
    violations?: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      detail: string;
      position?: number;
    }> | null;
  }>;
}

interface SocialAccount {
  id: string;
  platform: string;
  name: string;
}

export default function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['content-editor', id],
    queryFn: async () => {
      const res = await apiClient.get(`/content/${id}`);
      return res.data.data as ContentDetail;
    },
  });

  useEffect(() => {
    if (data?.body) {
      setContent(data.body);
    }
  }, [data?.body]);

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await apiClient.get('/social/accounts');
      return res.data.data as SocialAccount[];
    },
  });

  useEffect(() => {
    if (!selectedSocialAccountId && socialAccounts.length > 0) {
      const firstSocialAccount = socialAccounts[0];
      if (firstSocialAccount) {
        setSelectedSocialAccountId(firstSocialAccount.id);
      }
    }
  }, [selectedSocialAccountId, socialAccounts]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/content/${id}`, { body: content });
      return res.data.data as ContentDetail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-editor', id] });
      toast({
        title: 'Content saved',
        description: 'A new version was recorded for this draft.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to save content',
        description: error?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/approvals/request', {
        contentId: id,
        reviewType: 'internal',
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-editor', id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({
        title: 'Approval requested',
        description: 'This draft is now in the editorial review queue.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to request approval',
        description: error?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/schedules', {
        contentId: id,
        campaignId: data?.campaign?.id ?? null,
        socialAccountId: selectedSocialAccountId,
        scheduledAt: new Date(scheduleAt).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-editor', id] });
      queryClient.invalidateQueries({ queryKey: ['publish-queue'] });
      setScheduleAt('');
      toast({
        title: 'Post scheduled',
        description: 'The approved content is queued for publishing.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to schedule content',
        description: error?.response?.data?.message || 'Please check the selected date and account.',
        variant: 'destructive',
      });
    },
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      await apiClient.delete(`/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-editor', id] });
      queryClient.invalidateQueries({ queryKey: ['publish-queue'] });
      toast({
        title: 'Schedule cancelled',
        description: 'The content has been moved back to approved state.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to cancel schedule',
        description: error?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const latestQualityCheck = data.qualityChecks?.[0];
  const violations = Array.isArray(latestQualityCheck?.violations) ? latestQualityCheck.violations : [];
  const backHref = data.campaign ? `/campaigns/${data.campaign.id}` : '/content';
  const latestApproval = data.approvals?.[0];
  const canRequestApproval = data.status === 'draft' || data.status === 'revision_requested';
  const canSchedule = data.status === 'approved';
  const hasSchedules = data.schedules.length > 0;
  const workflowButtonLabel = canRequestApproval
    ? 'Request approval'
    : data.status === 'in_review'
      ? 'In review'
      : data.status === 'approved'
        ? 'Approved'
        : data.status === 'scheduled'
          ? 'Scheduled'
          : 'Review & publish';

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Strategy Brief Context Bar */}
      <div className="flex items-center gap-6 rounded-2xl bg-gray-900 px-6 py-3 text-white dark:bg-brand-500/10 dark:text-brand-400">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Objective:</span>
          <span className="text-xs font-semibold">{data.brief?.objective || 'No linked brief'}</span>
        </div>
        <div className="h-4 w-px bg-gray-700"></div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Audience:</span>
          <span className="text-xs font-semibold">{data.brief?.audience || 'Not set'}</span>
        </div>
        <div className="h-4 w-px bg-gray-700"></div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CTA:</span>
          <span className="text-xs font-semibold underline underline-offset-4">{data.brief?.cta || 'Not set'}</span>
        </div>
        {data.brief && (
          <Link href={`/create/brief?briefId=${data.brief.id}${data.campaign ? `&campaignId=${data.campaign.id}` : ''}`} className="ml-auto text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:text-white">
            Edit Brief
          </Link>
        )}
      </div>

      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white pb-6 dark:border-gray-800 dark:bg-transparent">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{data.campaign?.name || data.brand.name}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${data.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {data.status} • {data.platform} • {data.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => saveMutation.mutate()} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          {canRequestApproval ? (
            <button
              onClick={() => requestApprovalMutation.mutate()}
              disabled={requestApprovalMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-60"
            >
              {requestApprovalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {workflowButtonLabel}
            </button>
          ) : data.status === 'in_review' ? (
            <Link href="/review" className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
              <ShieldCheck className="h-4 w-4" /> {workflowButtonLabel}
            </Link>
          ) : (
            <Link href="/publish" className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
              <Calendar className="h-4 w-4" /> {workflowButtonLabel}
            </Link>
          )}
          <button className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid h-full gap-6 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Toolbar */}
        <div className="hidden lg:flex flex-col gap-4 lg:col-span-1 border-r border-gray-100 pr-4 dark:border-gray-800">
          <ToolbarButton icon={<Type className="h-5 w-5" />} active />
          <ToolbarButton icon={<Layout className="h-5 w-5" />} />
          <ToolbarButton icon={<Sparkles className="h-5 w-5" />} />
          <ToolbarButton icon={<History className="h-5 w-5" />} />
          <div className="mt-auto">
            <ToolbarButton icon={<Settings className="h-5 w-5" />} />
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {/* Rich Text Toolbar Mockup */}
          <div className="flex items-center gap-2 border-b border-gray-100 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
            <select className="rounded-md border-gray-200 bg-white px-2 py-1 text-xs font-bold dark:border-gray-700 dark:bg-gray-800">
              <option>Heading 2</option>
              <option>Body Text</option>
            </select>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <button className="p-1.5 hover:bg-white rounded transition-colors font-serif font-bold">B</button>
            <button className="p-1.5 hover:bg-white rounded transition-colors italic">I</button>
            <button className="p-1.5 hover:bg-white rounded transition-colors underline">U</button>
          </div>
          
          <textarea 
            className="flex-1 w-full p-8 text-lg bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 font-medium leading-relaxed resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between dark:border-gray-800">
            <div className="flex gap-4 text-xs font-bold text-gray-400">
              <span>Words: {content.split(' ').length}</span>
              <span>Reading time: 1m 20s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform:</span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10">{data.platform}</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Quality Guard) */}
        <div className="lg:col-span-3 h-full space-y-6">
          <QualityChecksWidget 
            score={Math.round(latestQualityCheck?.confidenceScore ?? data.qualityChecks?.[0]?.confidenceScore ?? 0)} 
            passed={latestQualityCheck?.passed ?? true} 
            violations={violations}
            category={latestQualityCheck?.category ?? undefined}
            remediation={latestQualityCheck?.remediation ?? undefined}
          />

          <Card className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Workflow state</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <WorkflowRow label="Content status" value={data.status} icon={<Clock className="h-4 w-4" />} />
              <WorkflowRow label="Latest approval" value={latestApproval ? latestApproval.status : 'Not requested'} icon={<ShieldCheck className="h-4 w-4" />} />
              <WorkflowRow label="Schedules" value={hasSchedules ? `${data.schedules.length} active` : 'Not scheduled'} icon={<Calendar className="h-4 w-4" />} />
            </div>
            {latestApproval?.note && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800">
                Reviewer note: {latestApproval.note}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Scheduling handoff</h3>

            {canSchedule ? (
              socialAccounts.length > 0 ? (
                <div className="mt-4 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Social account</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      value={selectedSocialAccountId}
                      onChange={(event) => setSelectedSocialAccountId(event.target.value)}
                    >
                      {socialAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.platform})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Publish at</span>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      value={scheduleAt}
                      onChange={(event) => setScheduleAt(event.target.value)}
                    />
                  </label>

                  <Button onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending || !scheduleAt || !selectedSocialAccountId} className="w-full gap-2">
                    {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                    Schedule publish
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800">
                  <p>Connect a social account before scheduling approved content.</p>
                  <Link href="/publish/social">
                    <Button variant="outline" className="w-full">Connect account</Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800">
                {data.status === 'scheduled'
                  ? 'This content is already queued for publishing.'
                  : 'Approve the content before it can move into the scheduler.'}
              </div>
            )}

            {hasSchedules && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                {data.schedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{schedule.socialAccount.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{new Date(schedule.scheduledAt).toLocaleString()} • {schedule.status}</div>
                      </div>
                      {schedule.status === 'pending' && (
                        <button onClick={() => cancelScheduleMutation.mutate(schedule.id)} className="text-xs font-bold text-red-600 hover:underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, active }: any) {
  return (
    <button className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
      active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800'
    }`}>
      {icon}
    </button>
  );
}

function WorkflowRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <span className="text-brand-600">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{value}</span>
    </div>
  );
}
