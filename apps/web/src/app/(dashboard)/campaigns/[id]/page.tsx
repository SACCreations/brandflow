'use client';

import React from 'react';
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
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const health = {
    total: 82,
    strategy: 100,
    approvals: 75,
    scheduling: 70
  };

  const timeline = [
    { id: 1, title: 'Summer Launch Announcement', platform: 'LinkedIn', date: 'May 12, 10:00 AM', status: 'published' },
    { id: 2, title: 'Feature Spotlight: AI Guard', platform: 'Twitter', date: 'May 14, 2:00 PM', status: 'approved' },
    { id: 3, title: 'Early Adopter Case Study', platform: 'LinkedIn', date: 'May 15, 9:00 AM', status: 'pending_approval' },
    { id: 4, title: 'Closing Sale — 48h Left', platform: 'Instagram', date: 'May 18, 5:00 PM', status: 'draft' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Summer Growth 2024</h1>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest dark:bg-emerald-500/10">Active</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Goal: Drive 20% increase in enterprise trial signups.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
            <Settings className="h-4 w-4" /> Campaign Settings
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Add Content
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Health & Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Zap className="h-4 w-4 text-amber-500" /> Campaign Health
            </h3>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path className="text-gray-100 dark:text-gray-800" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-brand-600" strokeDasharray={`${health.total}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{health.total}%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Health</span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <HealthItem label="Strategy (Briefs)" value={health.strategy} />
              <HealthItem label="Approvals" value={health.approvals} />
              <HealthItem label="Scheduling" value={health.scheduling} />
            </div>
            <div className="mt-8 rounded-xl bg-amber-50 p-4 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                <span className="font-bold">Execution Gap</span>: You have 3 approved posts that are not yet scheduled for distribution.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest">Campaign Briefs</h3>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-brand-500 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">LinkedIn Master Strategy</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </button>
              <button className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-brand-500 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Twitter Thread Sequence</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Execution */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" /> Content Timeline
              </h3>
              <div className="flex items-center gap-2">
                <button className="text-xs font-bold text-gray-400 hover:text-gray-600">List View</button>
                <span className="text-gray-200">|</span>
                <button className="text-xs font-bold text-brand-600">Roadmap</button>
              </div>
            </div>
            
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={item.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {i !== timeline.length - 1 && (
                    <div className="absolute left-4 top-10 h-full w-px bg-gray-100 dark:bg-gray-800" />
                  )}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900 z-10 ${
                    item.status === 'published' ? 'border-emerald-500 text-emerald-500' :
                    item.status === 'approved' ? 'border-blue-500 text-blue-500' :
                    item.status === 'pending_approval' ? 'border-amber-500 text-amber-500' :
                    'border-gray-200 text-gray-300'
                  }`}>
                    {item.status === 'published' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-gray-50 bg-gray-50/30 p-4 dark:border-gray-800 dark:bg-gray-800/30 transition-all hover:bg-white hover:shadow-md dark:hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.platform}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-500">{item.date}</span>
                      <button className="text-[10px] font-bold text-brand-600 hover:underline">Edit Content</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-500" /> Campaign Assets
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                ))}
                <button className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-all">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-6 dark:border-brand-500/20 dark:bg-brand-500/5">
              <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" /> AI Suggestions
              </h3>
              <p className="text-[11px] text-brand-700/70 dark:text-brand-400/70 leading-relaxed italic mb-4">
                "Based on the 'Summer Growth' objective, adding a 'Early Bird' countdown sequence for next week could increase conversion by 15%."
              </p>
              <button className="w-full rounded-xl bg-brand-600 py-2 text-[10px] font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700">
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
        <span className="text-gray-500">{label}</span>
        <span className={`${value > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div 
          className={`h-full transition-all ${value > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
