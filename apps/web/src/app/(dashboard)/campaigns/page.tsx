'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Copy, 
  Archive, 
  TrendingUp, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Target,
  Users,
  Clock,
  XCircle,
  Loader2,
  Trash2,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  useToast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@brandflow/ui';
import { format } from 'date-fns';
import { CampaignSummaryStats } from '@/features/campaigns/components/CampaignSummaryStats';
import { CreateCampaignModal } from '@/features/campaigns/components/CreateCampaignModal';
import { CampaignList } from '@/features/campaigns/components/CampaignList';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    contents: number;
    briefs: number;
    schedules: number;
  };
}

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaignsResponse, isLoading, isError } = useQuery({
    queryKey: ['campaigns', activeTab],
    queryFn: async () => {
      const res = await apiClient.get('/campaigns', {
        params: { includeArchived: activeTab === 'archived' }
      });
      return res.data as Campaign[];
    },
  });

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };
      const res = await apiClient.post('/campaigns', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign Created',
        description: 'Your new campaign has been successfully defined.',
      });
      setIsModalOpen(false);
      setNewCampaign({ name: '', description: '', startDate: '', endDate: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.response?.data?.message || 'Something went wrong while creating the campaign.',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(newCampaign);
  };

  // Archive campaign mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/campaigns/${id}/archive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign Archived', description: 'The campaign has been moved to archives.' });
    },
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/campaigns/${id}/delete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign Deleted', description: 'The campaign has been permanently removed.' });
    },
  });

  // Clone campaign mutation
  const cloneMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      const res = await apiClient.post(`/campaigns/${id}/clone`, { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign Cloned', description: 'A new copy has been created.' });
    },
  });

  const campaigns = campaignsResponse || [];
  const avgHealthScore = Math.round(campaigns.reduce((acc, c) => acc + c.healthScore, 0) / (campaigns.length || 1));

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
        <h2 className="text-xl font-bold">Failed to load campaigns</h2>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })}
          className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-foreground"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaign Management</h1>
          <p className="mt-2 text-muted-foreground">Organize your brand strategy, content, and distribution in one place.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>


      {/* Tabs & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-4 border-border">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('active')}
            className={`text-sm font-bold transition-all ${activeTab === 'active' ? 'text-primary border-b-2 border-brand-600 pb-4 -mb-4' : 'text-muted-foreground hover:text-gray-600'}`}
          >
            Active Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('archived')}
            className={`text-sm font-bold transition-all ${activeTab === 'archived' ? 'text-primary border-b-2 border-brand-600 pb-4 -mb-4' : 'text-muted-foreground hover:text-gray-600'}`}
          >
            Archived
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              className="rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 border-border bg-background"
            />
          </div>
          <button className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-surface-1 bg-background border-border dark:hover:bg-surface-1">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
