'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import { 
  ArrowLeft, 
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

export default function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [content, setContent] = useState('');

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/content/${id}`, { body: content });
      return res.data.data as ContentDetail;
    },
    onSuccess: () => {
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
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
            <Send className="h-4 w-4" /> Review & Publish
          </button>
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
        <div className="lg:col-span-3 h-full">
          <QualityChecksWidget 
            score={Math.round(latestQualityCheck?.confidenceScore ?? data.qualityChecks?.[0]?.confidenceScore ?? 0)} 
            passed={latestQualityCheck?.passed ?? true} 
            violations={violations}
            category={latestQualityCheck?.category ?? undefined}
            remediation={latestQualityCheck?.remediation ?? undefined}
          />
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
