'use client';

import React from 'react';
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
  ShieldAlert
} from 'lucide-react';

export default function ReviewQueuePage() {
  const pendingReviews = [
    { 
      id: 1, 
      content: "Brandflow increases marketing productivity by 40%.", 
      type: "Product Claim", 
      source: "Whitepaper_2024.pdf", 
      confidence: 0.94,
      aiReasoning: "Extracted from performance summary table. High semantic match with previous claims.",
      status: 'pending'
    },
    { 
      id: 2, 
      content: "Our primary audience is mid-market SaaS founders in EMEA.", 
      type: "Audience Fact", 
      source: "Website Crawl", 
      confidence: 0.72,
      aiReasoning: "Inferred from case studies and hero section messaging. Moderate confidence due to varying phrasing.",
      status: 'conflict'
    },
    { 
      id: 3, 
      content: "Enterprise plan starts at $2,499/month.", 
      type: "Pricing", 
      source: "Sales Deck V4", 
      confidence: 0.98,
      aiReasoning: "Explicit value found in pricing slide. Matches historical data.",
      status: 'pending'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Review Queue</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Validate AI-extracted knowledge atoms to ensure brand truth.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl">
          <AlertCircle className="h-4 w-4" />
          {pendingReviews.length} items require attention
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Filter By</h3>
            <div className="space-y-2">
              <FilterItem label="All Items" count={12} active />
              <FilterItem label="Low Confidence" count={4} />
              <FilterItem label="Conflicts Found" count={3} />
              <FilterItem label="Compliance Risk" count={2} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <h3 className="mb-2 text-sm font-bold text-emerald-800 dark:text-emerald-400">Quick Actions</h3>
            <p className="mb-4 text-xs text-emerald-700/70 dark:text-emerald-400/60">Batch validate high-confidence items to save time.</p>
            <button className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700">
              Bulk Approve (8)
            </button>
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-3 space-y-4">
          {pendingReviews.map((item) => (
            <div key={item.id} className={`group relative rounded-2xl border bg-white p-6 transition-all hover:shadow-lg dark:bg-gray-900 ${
              item.status === 'conflict' ? 'border-amber-200 dark:border-amber-500/30 ring-1 ring-amber-500/10' : 'border-gray-200 dark:border-gray-800'
            }`}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight ${
                    item.type === 'Pricing' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
                    item.type === 'Product Claim' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10' :
                    'bg-purple-100 text-purple-700 dark:bg-purple-500/10'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Source: {item.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${item.confidence > 0.9 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {(item.confidence * 100).toFixed(0)}% Match
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed italic">
                  "{item.content}"
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* AI Reasoning */}
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-brand-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">AI Reasoning</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.aiReasoning}
                  </p>
                </div>

                {/* Conflict/Warning */}
                {item.status === 'conflict' && (
                  <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="text-xs font-bold">Conflict Detected</span>
                    </div>
                    <p className="text-xs text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
                      Source B says audience is "Enterprise SaaS". Resolve manual to update brand truth.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <button className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors dark:hover:text-white">
                    <Eye className="h-3.5 w-3.5" /> View Source Snippet
                  </button>
                  <button className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors dark:hover:text-white">
                    <MessageSquare className="h-3.5 w-3.5" /> Add Note
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-red-500/10">
                    <X className="h-4 w-4 mr-1 inline" /> Reject
                  </button>
                  <button className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                    <Check className="h-4 w-4 mr-1 inline" /> Validate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterItem({ label, count, active }: any) {
  return (
    <button className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
      active ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}>
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-brand-200 text-brand-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500'}`}>
        {count}
      </span>
    </button>
  );
}
