'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  ExternalLink,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  Eye,
  ArrowRight,
  Zap,
  Info,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';

interface Approval {
  id: string;
  contentId: string;
  status: string;
  reviewType: string;
  note: string | null;
  createdAt: string;
  content: {
    id: string;
    body: string;
    type: string;
    platform: string;
    qualityScore: number;
    qualityChecks: any[];
  };
}

export default function ReviewQueuePage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeReview, setActiveReview] = useState<Approval | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue, isLoading, isError } = useQuery({
    queryKey: ['approvals', activeTab],
    queryFn: async () => {
      const res = await apiClient.get('/approvals/queue', { params: { status: activeTab } });
      return res.data.data as Approval[];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
      const res = await apiClient.post(`/approvals/${id}/decide`, { status, note });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Decision Recorded', description: 'The content has been reviewed.' });
      setActiveReview(null);
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiClient.post('/approvals/bulk-approve', { ids });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Bulk Approved', description: `${selectedItems.length} items have been approved.` });
      setSelectedItems([]);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Editorial Review Queue</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Validate AI-generated content against brand standards and quality benchmarks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            <Clock className="h-4 w-4" /> History
          </button>
          <button 
            onClick={() => bulkApproveMutation.mutate(selectedItems)}
            disabled={selectedItems.length === 0 || bulkApproveMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            {bulkApproveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Bulk Approve ({selectedItems.length})
          </button>
        </div>
      </div>

      {/* Main Review Section */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Queue List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
              <button 
                onClick={() => setActiveTab('pending')}
                className={`${activeTab === 'pending' ? 'text-brand-600 border-b-2 border-brand-600' : ''} pb-4 -mb-4`}
              >
                Awaiting Review ({queue?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('approved')}
                className={`${activeTab === 'approved' ? 'text-brand-600 border-b-2 border-brand-600' : ''} pb-4 -mb-4`}
              >
                Resolved
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter queue..." 
                  className="rounded-lg border border-gray-100 bg-white pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <button className="rounded-lg border border-gray-100 p-1.5 text-gray-500 dark:border-gray-800"><Filter className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="space-y-4">
            {queue?.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-sm font-medium text-gray-400 dark:border-gray-800">
                Queue is empty.
              </div>
            ) : (
              queue?.map((review) => (
                <div 
                  key={review.id} 
                  onClick={() => setActiveReview(review)}
                  className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg cursor-pointer ${
                    activeReview?.id === review.id ? 'border-brand-500 bg-brand-50/20 ring-1 ring-brand-500 dark:bg-brand-500/5' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 hover:border-gray-300'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(review.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedItems(prev => e.target.checked ? [...prev, review.id] : prev.filter(id => id !== review.id));
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
                        />
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {review.content.type}: {review.content.body.substring(0, 40)}...
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {review.content.platform}</span>
                            <span className="text-gray-200">|</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" /> {new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
                        review.content.qualityScore > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {Math.round(review.content.qualityScore * 100)}% SCORE
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Reviewer Side-Panel */}
        <div className="lg:col-span-5">
          {activeReview ? (
            <div className="sticky top-24 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Quality Guard Report</h3>
                  <button onClick={() => setActiveReview(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
                </div>

                <div className="space-y-6">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Brand Voice</span>
                      <div className="text-xl font-black text-emerald-500">
                        {Math.round(activeReview.content.qualityScore * 100)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Fact Accuracy</span>
                      <div className={`text-xl font-black ${activeReview.content.qualityScore < 0.7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {activeReview.content.qualityScore < 0.7 ? 'Review Needed' : 'Verified'}
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Content Body</label>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-sm text-gray-700 leading-relaxed dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-300">
                      {activeReview.content.body}
                    </div>
                  </div>

                  {/* Violations / Insights */}
                  {activeReview.content.qualityScore < 0.8 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                      <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Quality Insights</span>
                      </div>
                      <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                        This content has a slightly lower quality score. Consider checking for brand voice alignment and factual consistency.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <button 
                      onClick={() => decideMutation.mutate({ id: activeReview.id, status: 'rejected' })}
                      disabled={decideMutation.isPending}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all dark:border-red-900 dark:hover:bg-red-900/20"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject
                    </button>
                    <button 
                      onClick={() => decideMutation.mutate({ id: activeReview.id, status: 'approved' })}
                      disabled={decideMutation.isPending}
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </button>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600">
                    <MessageSquare className="h-4 w-4" /> Request Changes (Feedback)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center dark:border-gray-800">
              <div className="rounded-full bg-gray-50 p-4 dark:bg-gray-800 mb-4">
                <Eye className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-400">Select an item to review</h3>
              <p className="mt-1 text-sm text-gray-400 max-w-xs">Detailed quality reports and brand compliance checks will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
