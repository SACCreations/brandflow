'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import {
  AutomationStats,
  AutomationList,
  AutomationSidebar,
  CreateAutomationModal,
  Automation
} from '@/features/automations/components';

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-foreground"
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Workflow Automation</h1>
          <p className="mt-2 text-muted-foreground">Automate your brand operations with custom IF-THIS-THEN-THAT rules.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" /> Create Automation
        </button>
      </div>

      <AutomationStats automations={automations} />

      <div className="grid gap-8 lg:grid-cols-12">
        <AutomationList automations={automations} toggleMutation={toggleMutation} />
        <AutomationSidebar />
      </div>

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

