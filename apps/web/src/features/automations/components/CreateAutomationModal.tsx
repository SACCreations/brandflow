import React, { useState } from 'react';
import { X, CheckCircle2, FileText, Calendar, Webhook, Bell, Send, UserCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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

interface CreateAutomationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAutomationModal({ onClose, onCreated }: CreateAutomationModalProps) {
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
      <div className="w-full max-w-lg glass-panel p-8 animate-in zoom-in-95 duration-300">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Automation</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {['trigger', 'actions', 'name'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${step === s ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : i < ['trigger', 'actions', 'name'].indexOf(step) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-100 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 rounded transition-colors ${i < ['trigger', 'actions', 'name'].indexOf(step) ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'}`} />}
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
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:border-brand-500/50'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white/50 dark:bg-gray-900/50'
                }`}
              >
                <div className={`rounded-lg p-2 transition-colors ${triggerType === trigger.id ? 'bg-brand-100 dark:bg-brand-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <trigger.icon className={`h-5 w-5 ${triggerType === trigger.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{trigger.label}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{trigger.description}</p>
                </div>
              </button>
            ))}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep('actions')}
                disabled={!triggerType}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
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
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:border-brand-500/50'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white/50 dark:bg-gray-900/50'
                }`}
              >
                <div className={`rounded-lg p-2 transition-colors ${actions.includes(action.id) ? 'bg-brand-100 dark:bg-brand-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <action.icon className={`h-5 w-5 ${actions.includes(action.id) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</span>
                {actions.includes(action.id) && <CheckCircle2 className="ml-auto h-5 w-5 text-brand-600 dark:text-brand-400" />}
              </button>
            ))}
            <div className="mt-6 flex justify-between">
              <button 
                onClick={() => setStep('trigger')} 
                className="rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('name')}
                disabled={actions.length === 0}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
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
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:text-white backdrop-blur-sm transition-all"
              autoFocus
            />
            <div className="rounded-xl bg-gray-50/50 dark:bg-gray-950/50 p-4 border border-gray-100 dark:border-gray-800/50 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Summary</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">When</span> {TRIGGER_TYPES.find(t => t.id === triggerType)?.label} → {' '}
                <span className="font-semibold text-gray-900 dark:text-white">Then</span> {actions.map(a => ACTION_TYPES.find(at => at.id === a)?.label).join(', ')}
              </p>
            </div>
            <div className="mt-6 flex justify-between">
              <button 
                onClick={() => setStep('actions')} 
                className="rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!name.trim() || createMutation.isPending}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
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
