'use client';

import Link from 'next/link';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, useToast, ErrorBoundary, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@brandflow/ui';

interface Approval {
  id: string;
  contentId: string;
  status: string;
  reviewType: string;
  note: string | null;
  reason?: string | null;
  routeReason?: string | null;
  createdAt: string;
  content: {
    id: string;
    body: string;
    type: string;
    platform: string;
    qualityScore: number | null;
    brand?: {
      name: string;
    };
    brief?: {
      objective: string;
      cta: string | null;
    } | null;
    campaign?: {
      id: string;
      name: string;
    } | null;
    qualityChecks: Array<{
      confidenceScore: number;
      remediation?: string | null;
    }>;
  };
}

export default function ReviewQueuePage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeReview, setActiveReview] = useState<Approval | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [reviewNote, setReviewNote] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue, isLoading, isError } = useQuery({
    queryKey: ['approvals', activeTab],
    queryFn: async () => {
      const res = await apiClient.get('/approvals/queue', { params: { status: activeTab } });
      return res.data as Approval[];
    },
  });

  const handleSelectReview = (review: Approval) => {
    setActiveReview(review);
    setReviewNote(review.note || review.reason || '');
  };

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
      const res = await apiClient.post(`/approvals/${id}/decide`, { status, note });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      const actionMap: Record<string, string> = { approved: 'approved', rejected: 'rejected', revision_requested: 'sent back for revisions' };
      toast({ title: 'Decision Recorded', description: `Content has been ${actionMap[variables.status] || 'reviewed'}.` });
      setActiveReview(null);
      setReviewNote('');
    },
    onError: (error: any) => {
      toast({
        title: 'Review action failed',
        description: error?.response?.data?.message || 'Unable to submit decision. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiClient.post('/approvals/bulk-approve', { ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Bulk Approved', description: `${selectedItems.length} items have been approved.` });
      setSelectedItems([]);
      setShowBulkConfirm(false);
      setActiveReview(null);
    },
    onError: (error: any) => {
      setShowBulkConfirm(false);
      toast({
        title: 'Bulk approve failed',
        description: error?.response?.data?.message || 'Some items could not be approved. Please try again.',
        variant: 'destructive',
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
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Unable to load review queue</h3>
        <p className="max-w-sm text-sm text-gray-500">There was a problem fetching pending approvals. Please try again.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['approvals'] })} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const filteredQueue = searchFilter
    ? queue?.filter((r) =>
        r.content.body.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.content.brand?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.content.platform.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : queue;

  return (
    <ErrorBoundary backHref="/projects">
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Bulk Approve Confirmation Dialog */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Approve</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are about to approve <strong>{selectedItems.length}</strong> content item{selectedItems.length > 1 ? 's' : ''}. 
            This action will move them to the publishing queue and cannot be easily undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => bulkApproveMutation.mutate(selectedItems)}
              disabled={bulkApproveMutation.isPending}
              className="gap-2"
            >
              {bulkApproveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve {selectedItems.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Editorial Review Queue</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Validate AI-generated content against brand standards and quality benchmarks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            <Clock className="h-4 w-4" /> History
          </button>
          <button 
            onClick={() => setShowBulkConfirm(true)}
            disabled={selectedItems.length === 0 || bulkApproveMutation.isPending}
            aria-label={`Bulk approve ${selectedItems.length} selected items`}
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
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 dark:border-gray-800">
            <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
              <button 
                onClick={() => setActiveTab('pending')}
                role="tab"
                aria-selected={activeTab === 'pending'}
                className={`${activeTab === 'pending' ? 'text-brand-600 border-b-2 border-brand-600' : ''} pb-4 -mb-4 px-2 min-h-[44px]`}
              >
                Awaiting Review ({queue?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('approved')}
                role="tab"
                aria-selected={activeTab === 'approved'}
                className={`${activeTab === 'approved' ? 'text-brand-600 border-b-2 border-brand-600' : ''} pb-4 -mb-4 px-2 min-h-[44px]`}
              >
                Approved
              </button>
              <button 
                onClick={() => setActiveTab('revision_requested')}
                role="tab"
                aria-selected={activeTab === 'revision_requested'}
                className={`${activeTab === 'revision_requested' ? 'text-brand-600 border-b-2 border-brand-600' : ''} pb-4 -mb-4 px-2 min-h-[44px]`}
              >
                Revisions
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter queue..." 
                  aria-label="Filter review queue"
                  className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <button aria-label="Advanced filters" className="rounded-lg border border-gray-100 dark:border-gray-800 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 dark:border-gray-800"><Filter className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQueue?.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-400 dark:border-gray-800">
                {searchFilter ? 'No items match your filter.' : 'All caught up — queue is empty!'}
              </div>
            ) : (
              filteredQueue?.map((review) => (
                <div 
                  key={review.id} 
                  onClick={() => handleSelectReview(review)}
                  className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg cursor-pointer ${
                    activeReview?.id === review.id ? 'border-brand-500 bg-brand-50/20 ring-1 ring-brand-500 dark:bg-brand-500/5' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900 hover:border-gray-300'
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
                            {review.content.brand?.name && (
                              <>
                                <span className="text-gray-200">|</span>
                                <span>{review.content.brand.name}</span>
                              </>
                            )}
                            {review.routeReason && (
                              <>
                                <span className="text-gray-200">|</span>
                                <span className="text-amber-600 dark:text-amber-400">Auto-routed</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
                        (review.content.qualityScore ?? 0) > 0.8 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {Math.round((review.content.qualityScore ?? 0) * 100)}% SCORE
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
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Quality Guard Report</h3>
                  <button onClick={() => setActiveReview(null)} aria-label="Close review panel" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"><XCircle className="h-5 w-5" /></button>
                </div>

                <div className="space-y-6">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Brand Voice</span>
                      <div className="text-xl font-black text-emerald-500">
                        {Math.round((activeReview.content.qualityScore ?? 0) * 100)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Fact Accuracy</span>
                      <div className={`text-xl font-black ${(activeReview.content.qualityScore ?? 0) < 0.7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {(activeReview.content.qualityScore ?? 0) < 0.7 ? 'Review Needed' : 'Verified'}
                      </div>
                    </div>
                  </div>

                  {activeReview.content.brief && (
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 p-4 text-sm dark:border-gray-800 dark:bg-gray-800/20">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Brief context</div>
                      <div className="mt-2 font-medium text-gray-900 dark:text-white">{activeReview.content.brief.objective}</div>
                      {activeReview.content.brief.cta && (
                        <div className="mt-1 text-xs text-gray-500">CTA: {activeReview.content.brief.cta}</div>
                      )}
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Content Body</label>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 p-4 text-sm text-gray-700 leading-relaxed dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-300">
                      {activeReview.content.body}
                    </div>
                  </div>

                  {/* Violations / Insights */}
                  {(activeReview.content.qualityScore ?? 0) < 0.8 && (
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

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reviewer note</label>
                    <textarea
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      className="min-h-[96px] w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 p-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
                      placeholder="Add revision guidance, risk notes, or approval context..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <button 
                      onClick={() => decideMutation.mutate({ id: activeReview.id, status: 'rejected', note: reviewNote })}
                      disabled={decideMutation.isPending}
                      aria-label="Reject content"
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 min-h-[44px] py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all dark:border-red-900 dark:hover:bg-red-900/20"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject
                    </button>
                    <button 
                      onClick={() => decideMutation.mutate({ id: activeReview.id, status: 'revision_requested', note: reviewNote })}
                      disabled={decideMutation.isPending}
                      aria-label="Request changes on content"
                      className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 min-h-[44px] py-3 text-sm font-bold text-amber-700 hover:bg-amber-50 transition-all dark:border-amber-900 dark:hover:bg-amber-900/20"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                      Changes
                    </button>
                    <button 
                      onClick={() => decideMutation.mutate({ id: activeReview.id, status: 'approved', note: reviewNote })}
                      disabled={decideMutation.isPending}
                      aria-label="Approve content"
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 min-h-[44px] py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/create/content/${activeReview.content.id}`}>
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="h-4 w-4" /> Open editor
                      </Button>
                    </Link>
                    {activeReview.content.campaign?.id ? (
                      <Link href={`/campaigns/${activeReview.content.campaign.id}`}>
                        <Button variant="outline" className="w-full gap-2">
                          <ArrowRight className="h-4 w-4" /> Open campaign
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" disabled>
                        <Info className="h-4 w-4" /> No campaign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-12 text-center dark:border-gray-800">
              <div className="rounded-full bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800 mb-4">
                <Eye className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-400">Select an item to review</h3>
              <p className="mt-1 text-sm text-gray-400 max-w-xs">Detailed quality reports and brand compliance checks will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
    </ErrorBoundary>
  );
}
