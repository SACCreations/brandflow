'use client';

import React from 'react';
import { BrainCircuit, Activity, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api';
import { Card } from '@brandflow/ui';
import { motion } from 'framer-motion';

export function AiInsightsWidget() {
  const { data, isLoading, isError } = useApiQuery<any>(
    ['knowledge-stats'],
    '/knowledge/stats', // For now, using knowledge stats as proxy for AI insight
    { },
    { staleTime: 60_000 }
  );

  return (
    <Card className="glass-premium border border-[hsl(var(--ai))]/20 shadow-[0_0_40px_-10px_rgba(200,50,255,0.1)] dark:shadow-[0_0_40px_-10px_rgba(200,50,255,0.15)] relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[hsl(var(--ai))]/15 blur-3xl rounded-full pointer-events-none" />
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between relative z-10">
        <h2 className="font-bold flex items-center gap-2 text-gradient-ai">
          <BrainCircuit className="w-5 h-5 text-[hsl(var(--ai))]" />
          AI Synthesis
        </h2>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--ai))] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--ai))]"></span>
        </span>
      </div>
      <div className="p-6 relative z-10">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive font-medium">Could not generate insights at this time.</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <div className="flex items-start gap-4">
               <div className="mt-0.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20">
                  <Activity className="w-4 h-4" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-foreground">Workspace Health is {(data as any)?.healthScore || 0}%</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">Based on brand completeness and knowledge base quality. Your AI confidence is very high across current sources.</p>
               </div>
             </div>
             <div className="flex items-start gap-4">
               <div className="mt-0.5 p-2 rounded-xl bg-amber-500/10 text-amber-500 shadow-sm border border-amber-500/20">
                  <Zap className="w-4 h-4" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-foreground">{(data as any)?.pendingReviews || 0} items pending human review</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">Clearing your review queue will immediately increase downstream output quality for connected brands.</p>
               </div>
             </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
