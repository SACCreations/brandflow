'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Play, 
  Settings, 
  MoreVertical, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Layers,
  Search,
  Filter,
  Activity,
  Trash2,
  ToggleRight,
  ToggleLeft,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import { formatDistanceToNow } from 'date-fns';

interface Automation {
  id: string;
  name: string;
  triggerType: string;
  triggerConfig: any;
  steps: any[];
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  _count: {
    runs: number;
  };
}

export default function AutomationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: automations, isLoading, isError } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const res = await apiClient.get('/automations');
      return res.data as Automation[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/automations/${id}/toggle`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast({
        title: 'Status Updated',
        description: 'Automation state has been toggled.',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold">Failed to load automations</h2>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['automations'] })}
          className="rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Workflow Automation</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Automate your brand operations with custom IF-THIS-THEN-THAT rules.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all">
          <Plus className="h-4 w-4" /> Create Automation
        </button>
      </div>

      {/* Analytics Mini-Bar */}
      <div className="grid gap-6 md:grid-cols-4">
        <AutoStat label="Active Rules" value={automations?.filter(a => a.isActive).length.toString() || '0'} icon={<Zap className="h-4 w-4 text-brand-500" />} />
        <AutoStat label="Tasks Automated" value={automations?.reduce((acc, a) => acc + a._count.runs, 0).toString() || '0'} icon={<Activity className="h-4 w-4 text-emerald-500" />} />
        <AutoStat label="Success Rate" value="99.8%" icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />} />
        <AutoStat label="Time Saved" value="14h" icon={<Clock className="h-4 w-4 text-purple-500" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Main Automation List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Workflows</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search rules..." 
                  className="rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <button className="rounded-lg border border-gray-200 p-1.5 text-gray-500 dark:border-gray-800"><Filter className="h-4 w-4" /></button>
            </div>
          </div>

          {automations?.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-sm font-medium text-gray-400 dark:border-gray-800">
              No automations created yet.
            </div>
          ) : (
            automations?.map((auto) => (
              <div key={auto.id} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${auto.isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'bg-gray-50 text-gray-400 dark:bg-gray-800'}`}>
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{auto.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last run: {auto.lastRunAt ? formatDistanceToNow(new Date(auto.lastRunAt)) + ' ago' : 'Never'}</span>
                        <span className="text-gray-200">|</span>
                        <span className="flex items-center gap-1 text-emerald-500">Runs: {auto._count.runs}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleMutation.mutate(auto.id)}
                      disabled={toggleMutation.isPending}
                      className="text-brand-600 disabled:opacity-50"
                    >
                      {auto.isActive ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
                    </button>
                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">When</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{auto.triggerType}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Then</span>
                    <div className="flex gap-2">
                      {auto.steps.map((step, i) => (
                        <span key={i} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400">
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

        {/* Sidebar Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Automation Activity
            </h3>
            <div className="space-y-4">
              <ActivityItem 
                title="LinkedIn Scheduled" 
                detail="Rule: Auto-Schedule Approved LinkedIn" 
                time="2m ago" 
                status="success" 
              />
              <ActivityItem 
                title="SLA Alert Sent" 
                detail="Rule: Approval SLA Monitor" 
                time="1h ago" 
                status="success" 
              />
              <ActivityItem 
                title="Failed to Archive" 
                detail="Rule: Weekly Cleanup" 
                time="1d ago" 
                status="failed" 
              />
            </div>
            <button className="mt-6 w-full rounded-xl border border-gray-100 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:border-gray-800">
              View All Logs
            </button>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-6 dark:border-brand-500/20 dark:bg-brand-500/5">
            <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
              <Play className="h-4 w-4 text-brand-600" />
              Dry Run Mode
            </h3>
            <p className="text-xs text-brand-700/70 dark:text-brand-400/70 leading-relaxed mb-6">
              Test your automations without affecting real data. Every rule runs in a virtual environment.
            </p>
            <button className="w-full rounded-xl bg-brand-600 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700">
              Enable Global Dry Run
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function AutoStat({ label, value, icon }: any) {
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

function ActivityItem({ title, detail, time, status }: any) {
  return (
    <div className="flex gap-3">
      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 dark:text-white">{title}</span>
          <span className="text-[10px] text-gray-400 font-medium">{time}</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

