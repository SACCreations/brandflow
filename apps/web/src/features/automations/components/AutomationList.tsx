import { Search, Filter, Zap, Clock, MoreVertical, ToggleRight, ToggleLeft, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UseMutationResult } from '@tanstack/react-query';
import type { Automation } from './types';

interface AutomationListProps {
  automations?: Automation[];
  toggleMutation: UseMutationResult<any, Error, string, unknown>;
}

export function AutomationList({ automations, toggleMutation }: AutomationListProps) {
  return (
    <div className="lg:col-span-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Workflows</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search rules..." 
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 backdrop-blur-sm transition-all"
            />
          </div>
          <button className="rounded-lg border border-gray-200 dark:border-gray-800 p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {automations?.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-400">
          No automations created yet.
        </div>
      ) : (
        automations?.map((auto) => (
          <div key={auto.id} className="glass-panel group relative overflow-hidden p-6 transition-all hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${auto.isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{auto.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last run: {auto.lastRunAt ? formatDistanceToNow(new Date(auto.lastRunAt)) + ' ago' : 'Never'}
                    </span>
                    <span className="text-gray-200 dark:text-gray-700">|</span>
                    <span className="flex items-center gap-1 text-emerald-500">Runs: {auto._count.runs}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleMutation.mutate(auto.id)}
                  disabled={toggleMutation.isPending}
                  className="text-brand-600 disabled:opacity-50 transition-colors"
                >
                  {auto.isActive ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-gray-300 dark:text-gray-600" />}
                </button>
                <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-xl bg-gray-50/50 dark:bg-gray-950/50 p-4 border border-gray-100 dark:border-gray-800/50">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">When</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{auto.triggerType}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Then</span>
                <div className="flex gap-2">
                  {auto.steps.map((step, i) => (
                    <span key={i} className="rounded-md bg-white dark:bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-brand-600 shadow-sm dark:text-brand-400 border border-gray-100 dark:border-gray-800">
                      {step.type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
