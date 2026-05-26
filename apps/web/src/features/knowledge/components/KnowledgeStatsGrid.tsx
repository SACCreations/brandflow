'use client';

import React from 'react';
import { Database, Clock, ShieldCheck, BrainCircuit, ArrowUpRight } from 'lucide-react';
import { Card } from '@brandflow/ui';
import { motion } from 'framer-motion';

interface KnowledgeStatsGridProps {
  stats: {
    totalEntries: number;
    pendingReviews: number;
    healthScore: number;
    avgConfidence: number;
  };
  isLoading: boolean;
}

export function KnowledgeStatsGrid({ stats, isLoading }: KnowledgeStatsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Intelligence Health" 
        value={isLoading ? '—' : `${stats.healthScore}%`} 
        description="Global accuracy & freshness"
        icon={<BrainCircuit className="h-6 w-6 text-primary" />}
        trend={isLoading ? undefined : `${stats.pendingReviews} pending`}
        trendUp={stats.pendingReviews < 5}
      />
      <StatCard 
        title="Knowledge Atoms" 
        value={isLoading ? '—' : stats.totalEntries.toLocaleString()} 
        description="Classified facts & claims"
        icon={<Database className="h-6 w-6 text-blue-500" />}
      />
      <StatCard 
        title="Avg. Confidence" 
        value={isLoading ? '—' : `${(stats.avgConfidence * 100).toFixed(0)}%`} 
        description="AI extraction certainty"
        icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
      />
      <StatCard 
        title="Review Queue" 
        value={isLoading ? '—' : stats.pendingReviews} 
        description="Requires human validation"
        icon={<Clock className="h-6 w-6 text-amber-500" />}
        alert={stats.pendingReviews > 10}
      />
    </div>
  );
}

function StatCard({ title, value, description, icon, trend, trendUp, alert }: any) {
  return (
    <Card className={`glass-premium border-border/60 rounded-[1.25rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 micro-hover ${alert ? 'ring-2 ring-amber-500/50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-background p-3 border border-border shadow-sm">
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>
            {trend}
            <ArrowUpRight className="ml-0.5 h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        <h4 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</h4>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}
