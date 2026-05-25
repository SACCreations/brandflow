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
    <Card className="glass-panel rounded-2xl overflow-hidden relative">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-brand-500" />
          AI Synthesis
        </h2>
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
        </span>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500">Could not generate insights at this time.</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
             <div className="flex items-start gap-3">
               <div className="mt-1 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Activity className="w-3.5 h-3.5" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Workspace Health is {(data as any)?.healthScore || 0}%</h4>
                  <p className="text-xs text-gray-500 mt-1">Based on brand completeness and knowledge base quality. Your AI confidence is very high across current sources.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <div className="mt-1 p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Zap className="w-3.5 h-3.5" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{(data as any)?.pendingReviews || 0} items pending human review</h4>
                  <p className="text-xs text-gray-500 mt-1">Clearing your review queue will immediately increase downstream output quality for connected brands.</p>
               </div>
             </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
