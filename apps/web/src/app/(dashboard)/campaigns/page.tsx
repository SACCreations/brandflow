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
  Trash2
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
  const filteredCampaigns = campaigns; // Filtering is handled by API query params now

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
        <h2 className="text-xl font-bold">Failed to load campaigns</h2>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })}
          className="rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white"
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Campaign Management</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Organize your brand strategy, content, and distribution in one place.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Campaign</h2>
                <p className="text-sm text-gray-500">Define your next strategic initiative.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q3 Product Launch"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Objective / Description</label>
                <textarea 
                  placeholder="What is the primary goal of this campaign?"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                  rows={3}
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-100 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:border-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!newCampaign.name || createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <CampaignSummaryCard title="Active Campaigns" value={campaigns.length.toString()} subValue="+2 this month" icon={<Target className="text-blue-500" />} />
        <CampaignSummaryCard title="Avg. Health Score" value={`${Math.round(campaigns.reduce((acc, c) => acc + c.healthScore, 0) / (campaigns.length || 1))}%`} subValue="Critical: 1" icon={<AlertCircle className="text-amber-500" />} />
        <CampaignSummaryCard title="Scheduled Reach" value="45.2K" subValue="Next 7 days" icon={<TrendingUp className="text-emerald-500" />} />
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('active')}
            className={`text-sm font-bold transition-all ${activeTab === 'active' ? 'text-brand-600 border-b-2 border-brand-600 pb-4 -mb-4' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Active Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('archived')}
            className={`text-sm font-bold transition-all ${activeTab === 'archived' ? 'text-brand-600 border-b-2 border-brand-600 pb-4 -mb-4' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Archived
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              className="rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
          <button className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Campaign List */}
      <div className="grid gap-6">
        {filteredCampaigns.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-sm font-medium text-gray-400 dark:border-gray-800">
            No campaigns found for this view.
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-brand-600`}>
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <Link href={`/campaigns/${campaign.id}`} className="text-lg font-bold text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                      {campaign.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> System</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {format(new Date(campaign.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* Health Score */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Health Score</span>
                      <span className={`text-sm font-black ${campaign.healthScore > 80 ? 'text-emerald-500' : campaign.healthScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {campaign.healthScore}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div 
                        className={`h-full transition-all ${campaign.healthScore > 80 ? 'bg-emerald-500' : campaign.healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${campaign.healthScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => cloneMutation.mutate({ id: campaign.id, name: `${campaign.name} (Copy)` })}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Clone Campaign"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => archiveMutation.mutate(campaign.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Archive Campaign"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => cloneMutation.mutate({ id: campaign.id, name: `${campaign.name} (Copy)` })}>
                          <Copy className="mr-2 h-4 w-4" /> Clone Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveMutation.mutate(campaign.id)}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(campaign.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-8 border-t border-gray-50 pt-6 dark:border-gray-800">
                <CampaignStat label="Strategy Briefs" value={campaign._count?.briefs || 0} icon={<Target className="h-3.5 w-3.5" />} />
                <CampaignStat label="Total Content" value={campaign._count?.contents || 0} icon={<Plus className="h-3.5 w-3.5" />} />
                <CampaignStat label="Scheduled" value={campaign._count?.schedules || 0} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} />
                <div className="flex justify-end items-center">
                  <Link href={`/campaigns/${campaign.id}`} className="text-xs font-bold text-brand-600 flex items-center gap-1 hover:underline">
                    Open Campaign <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CampaignSummaryCard({ title, value, subValue, icon }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">{icon}</div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-500/10">
          {subValue}
        </span>
      </div>
      <div className="text-3xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{title}</div>
    </div>
  );
}

function CampaignStat({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-gray-50 p-1.5 text-gray-400 dark:bg-gray-800">{icon}</div>
      <div>
        <div className="text-sm font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{label}</div>
      </div>
    </div>
  );
}
