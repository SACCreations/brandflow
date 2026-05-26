'use client';

import React, { use } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Target, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  Send,
  Sparkles,
  ChevronRight,
  Plus,
  AlertCircle,
  Zap,
  MoreVertical,
  Calendar,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import { format } from 'date-fns';

interface CampaignDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
  startDate: string | null;
  endDate: string | null;
  briefs: Array<{
    id: string;
    platform: string | null;
    contentType: string | null;
    objective: string;
    isComplete: boolean;
    metadata?: {
      status?: 'draft' | 'in_review' | 'approved';
    } | null;
  }>;
  contents: any[];
  schedules: any[];
  assets: any[];
  templates: any[];
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await apiClient.get(`/campaigns/${id}`);
      return res.data as CampaignDetail;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold">Campaign not found</h2>
        <Link href="/campaigns" className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-foreground">
          Back to Campaigns
        </Link>
      </div>
    );
  }

  // Calculate health components (defensive)
  const strategyHealth = (campaign.briefs?.length || 0) > 0 
    ? Math.round((campaign.briefs?.filter(b => b.isComplete).length / campaign.briefs.length) * 100) 
    : 0;
  
  const approvalHealth = (campaign.contents?.length || 0) > 0
    ? Math.round((campaign.contents?.filter(c => c.status === 'approved').length / campaign.contents.length) * 100)
    : 0;

  const schedulingHealth = (campaign.schedules?.length || 0) > 0
    ? Math.round((campaign.schedules?.filter(s => s.status === 'pending').length / Math.max(campaign.contents?.length || 0, 1)) * 100)
    : 0;

  const timeline = (campaign.contents || []).map(content => ({
    id: content.id,
    title: content.type + ': ' + (content.body || '').substring(0, 30) + '...',
    platform: content.platform,
    date: content.schedules?.[0]?.scheduledAt ? format(new Date(content.schedules[0].scheduledAt), 'MMM d, h:mm a') : 'Not scheduled',
    status: content.status
  }));

  const latestApprovedBrief = [...(campaign.briefs || [])]
    .reverse()
    .find((brief) => brief.isComplete && brief.metadata?.status === 'approved');

  const handleGenerateSuggestion = () => {
    toast({
      title: "Generating Strategy...",
      description: "AI is analyzing your campaign performance to provide new insights.",
    });
    // In a real app, this would trigger a refetch of an 'insights' query
  };

  const handleAddAsset = () => {
    toast({
      title: "Media Library",
      description: "Opening media library for asset selection.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-surface-1 bg-background border-border dark:hover:bg-surface-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' : 'bg-surface-2 text-foreground bg-surface-2'
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{campaign.description || 'No description provided.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast({ title: 'Campaign Settings', description: 'Settings module is loading...' })}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-1 bg-background border-border text-foreground dark:hover:bg-surface-1"
          >
            <Settings className="h-4 w-4" /> Campaign Settings
          </button>
          <Link 
            href={latestApprovedBrief ? `/create/content?campaignId=${id}&briefId=${latestApprovedBrief.id}` : `/create/content?campaignId=${id}`}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add Content
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Health & Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
            <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Zap className="h-4 w-4 text-amber-500" /> Campaign Health
            </h3>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path className="text-gray-100 dark:text-foreground" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-primary" strokeDasharray={`${campaign.healthScore}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-foreground">{campaign.healthScore}%</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Health</span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <HealthItem label="Strategy (Briefs)" value={strategyHealth} />
              <HealthItem label="Approvals" value={approvalHealth} />
              <HealthItem label="Scheduling" value={schedulingHealth} />
            </div>
            {campaign.healthScore < 80 && (
              <div className="mt-8 rounded-xl bg-amber-50 p-4 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                  <span className="font-bold">Execution Gap</span>: Some items require attention to reach peak campaign performance.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Campaign Briefs</h3>
              <Link href={`/create/brief?campaignId=${id}`} className="text-[10px] font-bold text-primary">+ Add</Link>
            </div>
            <div className="space-y-3">
              {campaign.briefs?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No briefs created yet.</p>
              ) : (
                campaign.briefs?.map(brief => (
                  <Link key={brief.id} href={`/create/brief?campaignId=${id}&briefId=${brief.id}`} className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-surface-1 dark:bg-gray-950/50 p-4 text-left transition-all hover:border-primary border-border bg-surface-2/30">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">{brief.platform} {brief.contentType} Strategy</span>
                    </div>
                    {brief.isComplete ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Execution */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Content Timeline
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toast({ title: 'Roadmap', description: 'Loading campaign roadmap...' })}
                  className="text-xs font-bold text-primary"
                >
                  Roadmap
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {timeline.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-border/60 text-sm font-medium text-muted-foreground border-border">
                  No content items created for this campaign yet.
                </div>
              ) : (
                timeline.map((item, i) => (
                  <div key={item.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    {i !== timeline.length - 1 && (
                      <div className="absolute left-4 top-10 h-full w-px bg-surface-3" />
                    )}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background z-10 ${
                      item.status === 'published' ? 'border-emerald-500 text-emerald-500' :
                      item.status === 'approved' ? 'border-blue-500 text-blue-500' :
                      item.status === 'pending' ? 'border-amber-500 text-amber-500' :
                      'border-border text-muted-foreground'
                    }`}>
                      {item.status === 'published' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 rounded-xl border border-gray-50 bg-surface-1 dark:bg-gray-950/30 p-4 border-border bg-surface-2/30 transition-all hover:bg-background hover:shadow-md dark:hover:bg-surface-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.platform}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">{item.date}</span>
                        <Link href="/review" className="text-[10px] font-bold text-primary hover:underline">Edit Content</Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-500" /> Campaign Assets
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {campaign.assets?.map(asset => (
                  <div key={asset.id} className="aspect-square rounded-lg bg-surface-3 border border-border/60 border-border flex items-center justify-center overflow-hidden">
                    {asset.cdnUrl ? (
                      <img src={asset.cdnUrl} alt={asset.fileName} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
                <button 
                  onClick={handleAddAsset}
                  className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="rounded-2xl border border-primary/10 bg-brand-50/20 p-6 dark:border-primary/20 dark:bg-primary/100/5">
              <h3 className="text-sm font-bold text-brand-900 text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Suggestions
              </h3>
              <p className="text-[11px] text-brand-700/70 dark:text-brand-400/70 leading-relaxed italic mb-4">
                "Based on the '{campaign.name}' objective, adding a targeted sequence for {campaign.briefs?.[0]?.platform || 'LinkedIn'} could increase conversion by 15%."
              </p>
              <button 
                onClick={handleGenerateSuggestion}
                className="w-full rounded-xl bg-primary py-2 text-[10px] font-bold text-foreground shadow-md shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95"
              >
                Generate Suggestion
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function HealthItem({ label, value }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
        <span className="text-muted-foreground">{label}</span>
        <span className={`${value > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div 
          className={`h-full transition-all ${value > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

