'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  BrainCircuit, 
  Filter, 
  Plus,
  FileText,
  Globe
} from 'lucide-react';
import AddSourceModal from '@/components/knowledge/add-source-modal';

export default function KnowledgeDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Mock data for UI preview (in production this would be fetched from /api/knowledge/stats)
  const stats = {
    totalSources: 42,
    totalEntries: 1248,
    pendingReviews: 12,
    healthScore: 92,
    avgConfidence: 0.88,
    recentActivity: [
      { id: 1, type: 'url', name: 'processdrive.com/pricing', status: 'completed', time: '2m ago' },
      { id: 2, type: 'pdf', name: 'Q4_Strategy.pdf', status: 'processing', time: '5m ago' },
      { id: 3, type: 'api', name: 'Notion: Marketing Wiki', status: 'failed', time: '15m ago' },
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Knowledge Hub</h1>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            The operational brain and truth source for your enterprise AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            <Search className="h-4 w-4" />
            Explorer
          </button>
          
          <div className="relative group">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add Knowledge
            </button>
            
            {/* Quick Actions Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 transition-all opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto dark:border-gray-800 dark:bg-gray-900 z-50">
              <button onClick={() => setIsModalOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                <FileText className="h-4 w-4 text-brand-500" />
                Upload File
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                <Globe className="h-4 w-4 text-blue-500" />
                Add URL
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 border-t border-gray-50 dark:border-gray-800 mt-1 pt-2">
                <Search className="h-4 w-4 text-purple-500" />
                Full Connector Hub
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Intelligence Health" 
          value={`${stats.healthScore}%`} 
          description="Global accuracy & freshness"
          icon={<BrainCircuit className="h-6 w-6 text-brand-500" />}
          trend="+2.4%"
          trendUp={true}
        />
        <StatCard 
          title="Knowledge Atoms" 
          value={stats.totalEntries.toLocaleString()} 
          description="Classified facts & claims"
          icon={<Database className="h-6 w-6 text-blue-500" />}
        />
        <StatCard 
          title="Avg. Confidence" 
          value={`${(stats.avgConfidence * 100).toFixed(0)}%`} 
          description="AI extraction certainty"
          icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
        />
        <StatCard 
          title="Review Queue" 
          value={stats.pendingReviews} 
          description="Requires human validation"
          icon={<Clock className="h-6 w-6 text-amber-500" />}
          alert={stats.pendingReviews > 10}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Ingestion Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Ingestion Activity</h3>
            <button className="text-sm font-medium text-brand-600 hover:underline">View Monitor</button>
          </div>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/50 p-4 dark:border-gray-800/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    activity.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' :
                    activity.status === 'processing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' :
                    'bg-red-100 text-red-600 dark:bg-red-500/10'
                  }`}>
                    {activity.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> :
                     activity.status === 'processing' ? <Activity className="h-5 w-5 animate-pulse" /> :
                     <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{activity.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{activity.type} • {activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    activity.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                    'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Classification Mix</h3>
          <div className="space-y-5">
            <ProgressItem label="Product Features" percentage={45} color="bg-blue-500" />
            <ProgressItem label="Marketing Claims" percentage={28} color="bg-brand-500" />
            <ProgressItem label="Customer FAQ" percentage={15} color="bg-emerald-500" />
            <ProgressItem label="Compliance/Legal" percentage={12} color="bg-amber-500" />
          </div>
          <div className="mt-8 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-brand-500" />
              AI Insight
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Your "Marketing Claims" area is growing fast. Consider running a human validation cycle to ensure brand alignment.
            </p>
          </div>
        </div>
      </div>

      <AddSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function StatCard({ title, value, description, icon, trend, trendUp, alert }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${alert ? 'ring-2 ring-amber-500/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
            <ArrowUpRight className="ml-0.5 h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function ProgressItem({ label, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div 
          className={`h-full transition-all duration-1000 ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
