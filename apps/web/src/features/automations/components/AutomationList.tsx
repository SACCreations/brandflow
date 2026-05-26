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
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Workflows</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search rules..." 
              className="rounded-lg border border-border bg-background/50 bg-background/50 pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 backdrop-blur-sm transition-all"
            />
          </div>
          <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-surface-1 dark:hover:bg-surface-1 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {automations?.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-border/60 text-sm font-medium text-muted-foreground">
          No automations created yet.
        </div>
      ) : (
        automations?.map((auto) => (
          <div key={auto.id} className="glass-panel group relative overflow-hidden p-6 transition-all hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${auto.isActive ? 'bg-primary/10 text-primary dark:bg-primary/100/10' : 'bg-surface-2 text-muted-foreground'}`}>
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{auto.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs font-medium text-muted-foreground">
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
                  className="text-primary disabled:opacity-50 transition-colors"
                >
                  {auto.isActive ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-muted-foreground dark:text-gray-600" />}
                </button>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-surface-2 dark:hover:bg-surface-1 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-xl bg-surface-1/50 dark:bg-gray-950/50 p-4 border border-border/60/50">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">When</span>
                <span className="text-xs font-bold text-foreground">{auto.triggerType}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-gray-600" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Then</span>
                <div className="flex gap-2">
                  {auto.steps.map((step, i) => (
                    <span key={i} className="rounded-md bg-background px-2 py-0.5 text-[10px] font-bold text-primary shadow-sm dark:text-brand-400 border border-border/60">
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
