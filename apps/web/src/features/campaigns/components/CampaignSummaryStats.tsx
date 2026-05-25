import React from 'react';
import { Target, AlertCircle, TrendingUp } from 'lucide-react';

interface CampaignSummaryStatsProps {
  campaignsCount: number;
  avgHealthScore: number;
}

export function CampaignSummaryStats({ campaignsCount, avgHealthScore }: CampaignSummaryStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <CampaignSummaryCard 
        title="Active Campaigns" 
        value={campaignsCount.toString()} 
        subValue="+2 this month" 
        icon={<Target className="text-blue-500" />} 
      />
      <CampaignSummaryCard 
        title="Avg. Health Score" 
        value={`${avgHealthScore}%`} 
        subValue="Critical: 1" 
        icon={<AlertCircle className="text-amber-500" />} 
      />
      <CampaignSummaryCard 
        title="Scheduled Reach" 
        value="45.2K" 
        subValue="Next 7 days" 
        icon={<TrendingUp className="text-emerald-500" />} 
      />
    </div>
  );
}

function CampaignSummaryCard({ title, value, subValue, icon }: any) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="rounded-xl bg-white/50 dark:bg-gray-800/50 p-3 shadow-sm backdrop-blur-sm border border-border/50">{icon}</div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full dark:text-emerald-400 border border-emerald-500/20">
          {subValue}
        </span>
      </div>
      <div className="relative z-10 text-3xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="relative z-10 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{title}</div>
    </div>
  );
}
