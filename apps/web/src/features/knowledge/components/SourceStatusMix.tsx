'use client';

import React from 'react';
import { Card } from '@brandflow/ui';
import { BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_COLORS = ['bg-blue-500', 'bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];

interface SourceStatusMixProps {
  statusMix: [string, unknown][];
  totalStatusCount: number;
  pendingReviews: number;
}

export function SourceStatusMix({ statusMix, totalStatusCount, pendingReviews }: SourceStatusMixProps) {
  return (
    <Card className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Source Status Mix</h3>
      
      <div className="space-y-5 flex-1">
        {statusMix.length > 0 ? (
          statusMix.map(([status, count], index) => (
            <ProgressItem
              key={status}
              label={status.replace(/_/g, ' ')}
              percentage={totalStatusCount > 0 ? Math.round(((count as number) / totalStatusCount) * 100) : 0}
              color={STATUS_COLORS[index % STATUS_COLORS.length] || 'bg-gray-500'}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500 font-medium">
            Add a source to see ingestion status distribution.
          </p>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-xl bg-brand-500/5 border border-brand-500/10 p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />
        <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-brand-500" />
          AI Insight
        </p>
        <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 relative z-10">
          {pendingReviews > 0
            ? `${pendingReviews} knowledge item${pendingReviews === 1 ? '' : 's'} still need human review. Clearing the queue will improve trust in downstream generation.`
            : 'Your review queue is clear. Keep feeding high-quality sources to improve generation grounding.'}
        </p>
      </motion.div>
    </Card>
  );
}

function ProgressItem({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border/50 shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}
