'use client';

import React, { useState } from 'react';
import { 
  Send, 
  Calendar, 
  Clock, 
  Filter, 
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
  ExternalLink
} from 'lucide-react';

export default function PublishQueuePage() {
  const [view, setView] = useState('queue');

  const scheduledPosts = [
    { 
      id: 1, 
      content: "Brandflow increases marketing productivity by 40%. #SaaS #AI", 
      platforms: ['linkedin', 'twitter'], 
      scheduledAt: "Today, 4:00 PM",
      status: 'approved',
      author: "Alex Rivers"
    },
    { 
      id: 2, 
      content: "Why strategic briefs are the secret to AI consistency.", 
      platforms: ['linkedin', 'instagram'], 
      scheduledAt: "Tomorrow, 10:00 AM",
      status: 'pending_approval',
      author: "Sarah Chen"
    },
    { 
      id: 3, 
      content: "Check out our new Intelligence Layer walkthrough!", 
      platforms: ['twitter', 'facebook'], 
      scheduledAt: "May 15, 2:00 PM",
      status: 'draft',
      author: "Alex Rivers"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Publishing Hub</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage, tailor, and schedule your global content distribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            <Calendar className="h-4 w-4" /> Calendar View
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
            <Send className="h-4 w-4" /> Compose Multi-Post
          </button>
        </div>
      </div>

      {/* Analytics Mini-Bar */}
      <div className="grid gap-6 md:grid-cols-4">
        <PublishStat label="Scheduled" value="12" icon={<Clock className="h-4 w-4 text-blue-500" />} />
        <PublishStat label="Published" value="142" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        <PublishStat label="Avg. Engagement" value="4.8%" icon={<Activity className="h-4 w-4 text-brand-500" />} />
        <PublishStat label="Errors" value="0" icon={<AlertCircle className="h-4 w-4 text-gray-400" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Main List Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button className="text-sm font-bold text-brand-600 border-b-2 border-brand-600 pb-1">Queue</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-700">History</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-700">Drafts</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search posts..." 
                  className="rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
            </div>
          </div>

          {scheduledPosts.map((post) => (
            <div key={post.id} className="group relative rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {post.platforms.map((p) => (
                      <div key={p} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-600 dark:border-gray-900 dark:bg-gray-800">
                        {p === 'linkedin' && <Linkedin className="h-3.5 w-3.5 text-blue-700" />}
                        {p === 'twitter' && <Twitter className="h-3.5 w-3.5 text-sky-500" />}
                        {p === 'instagram' && <Instagram className="h-3.5 w-3.5 text-pink-600" />}
                        {p === 'facebook' && <Facebook className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{post.scheduledAt}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                        post.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        post.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {post.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Created by {post.author}</p>
                  </div>
                </div>
                <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                {post.content}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">
                    <Sparkles className="h-3.5 w-3.5" /> AI Tailor
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                    Reschedule
                  </button>
                  <button className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-bold text-white dark:bg-brand-600">
                    Edit Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-6 dark:border-brand-500/20 dark:bg-brand-500/5">
            <h3 className="text-sm font-bold text-brand-900 dark:text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-brand-600" />
              Smart Scheduling
            </h3>
            <p className="text-xs text-brand-700/70 dark:text-brand-400/70 mb-6 leading-relaxed">
              Based on your audience in <span className="font-bold">San Francisco</span>, the optimal time for LinkedIn tomorrow is:
            </p>
            <div className="rounded-xl bg-white p-4 text-center border border-brand-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="text-2xl font-black text-brand-600">9:45 AM</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Expected Reach: High</div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-brand-600 py-2 text-xs font-bold text-white transition-all hover:bg-brand-700">
              Apply to All Queue
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layout className="h-4 w-4 text-purple-500" />
              Platform Limits
            </h3>
            <div className="space-y-4">
              <LimitItem label="LinkedIn" value={3000} used={142} />
              <LimitItem label="Twitter" value={280} used={54} />
              <LimitItem label="Instagram" value={2200} used={89} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PublishStat({ label, value, icon }: any) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">{icon}</div>
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
