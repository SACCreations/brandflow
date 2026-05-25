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
  Loader2,
  X,
  Bell,
  FileText,
  Send,
  Calendar,
  UserCheck,
  Webhook,
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
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
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
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <button className="rounded-lg border border-gray-200 dark:border-gray-800 p-1.5 text-gray-500 dark:border-gray-800"><Filter className="h-4 w-4" /></button>
            </div>
          </div>

          {automations?.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-400 dark:border-gray-800">
              No automations created yet.
            </div>
          ) : (
            automations?.map((auto) => (
              <div key={auto.id} className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${auto.isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'bg-gray-50 dark:bg-gray-950 text-gray-400 dark:bg-gray-800'}`}>
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

                <div className="mt-6 flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">When</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{auto.triggerType}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Then</span>
                    <div className="flex gap-2">
                      {auto.steps.map((step, i) => (
                        <span key={i} className="rounded-md bg-white dark:bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400">
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
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
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
            <button className="mt-6 w-full rounded-xl border border-gray-100 dark:border-gray-800 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
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

      {/* Create Automation Modal */}
      {showCreateModal && (
        <CreateAutomationModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['automations'] });
            toast({ title: 'Automation Created', description: 'Your new workflow is ready.' });
          }}
        />
      )}
    </div>
  );
}

function AutoStat({ label, value, icon }: any) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-950 p-2 dark:bg-gray-800">{icon}</div>
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

const TRIGGER_TYPES = [
  { id: 'content_created', label: 'Content Created', description: 'When new content is generated', icon: FileText },
  { id: 'content_approved', label: 'Content Approved', description: 'When content passes approval', icon: CheckCircle2 },
  { id: 'schedule_time', label: 'Scheduled Time', description: 'At a specific time or recurring', icon: Calendar },
  { id: 'webhook', label: 'Webhook Received', description: 'When an external webhook fires', icon: Webhook },
];

const ACTION_TYPES = [
  { id: 'send_notification', label: 'Send Notification', icon: Bell },
  { id: 'publish_content', label: 'Publish Content', icon: Send },
  { id: 'assign_reviewer', label: 'Assign Reviewer', icon: UserCheck },
  { id: 'generate_content', label: 'Generate Content', icon: FileText },
];

function CreateAutomationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<'trigger' | 'actions' | 'name'>('trigger');
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [actions, setActions] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/automations', {
        name,
        triggerType,
        triggerConfig: {},
        steps: actions.map((type, i) => ({ type, order: i, config: {} })),
        isActive: true,
      });
    },
    onSuccess: onCreated,
  });

  const toggleAction = (actionId: string) => {
    setActions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-300">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Automation</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {['trigger', 'actions', 'name'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === s ? 'bg-brand-600 text-white' : i < ['trigger', 'actions', 'name'].indexOf(step) ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 rounded ${i < ['trigger', 'actions', 'name'].indexOf(step) ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Trigger */}
        {step === 'trigger' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">When should this automation trigger?</p>
            {TRIGGER_TYPES.map((trigger) => (
              <button
                key={trigger.id}
                onClick={() => setTriggerType(trigger.id)}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  triggerType === trigger.id
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:bg-brand-500/10'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className={`rounded-lg p-2 ${triggerType === trigger.id ? 'bg-brand-100 dark:bg-brand-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <trigger.icon className={`h-5 w-5 ${triggerType === trigger.id ? 'text-brand-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{trigger.label}</span>
                  <p className="text-xs text-gray-500">{trigger.description}</p>
                </div>
              </button>
            ))}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep('actions')}
                disabled={!triggerType}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next: Choose Actions
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Actions */}
        {step === 'actions' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">What actions should execute? (select one or more)</p>
            {ACTION_TYPES.map((action) => (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  actions.includes(action.id)
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:bg-brand-500/10'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className={`rounded-lg p-2 ${actions.includes(action.id) ? 'bg-brand-100 dark:bg-brand-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <action.icon className={`h-5 w-5 ${actions.includes(action.id) ? 'text-brand-600' : 'text-gray-500'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</span>
                {actions.includes(action.id) && <CheckCircle2 className="ml-auto h-5 w-5 text-brand-600" />}
              </button>
            ))}
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep('trigger')} className="rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Back
              </button>
              <button
                onClick={() => setStep('name')}
                disabled={actions.length === 0}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next: Name it
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Name */}
        {step === 'name' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Give your automation a name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Auto-publish approved content"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              autoFocus
            />
            <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Summary</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">When</span> {TRIGGER_TYPES.find(t => t.id === triggerType)?.label} → {' '}
                <span className="font-semibold">Then</span> {actions.map(a => ACTION_TYPES.find(at => at.id === a)?.label).join(', ')}
              </p>
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep('actions')} className="rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Back
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!name.trim() || createMutation.isPending}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Automation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

