'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  X, 
  Database, 
  Layers, 
  ShieldCheck, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Globe, 
  Brain,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
// Removed @brandflow/ui Dialog import

interface KnowledgeEntry {
  id: string;
  classification: string | null;
  content: string;
  confidence: number;
  isStale: boolean;
  staleAt: string | null;
  metadata: any;
  locale: string | null;
  createdAt: string;
  source: {
    name: string | null;
    type: string;
    sourceUrl: string | null;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All Atoms' },
  { id: 'product', label: 'Product' },
  { id: 'feature', label: 'Feature' },
  { id: 'faq', label: 'FAQs' },
  { id: 'claim', label: 'Claims' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'testimonial', label: 'Testimonials' },
  { id: 'guideline', label: 'Guidelines' },
  { id: 'fact', label: 'Facts' }
];

export default function KnowledgeExplorer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classification, setClassification] = useState('all');
  const queryClient = useQueryClient();
  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string } | null>(null);
  const toast = ({ title, description }: { title: string, description: string }) => {
    setToastMessage({ title, description });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch entries
  const { data: entries = [], isLoading, isError, refetch } = useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge-entries', debouncedSearch, classification],
    queryFn: async () => {
      const response = await apiClient.get('/knowledge/entries', {
        params: {
          search: debouncedSearch || undefined,
          classification: classification !== 'all' ? classification : undefined
        }
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Stale mutation
  const markStaleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/knowledge/entries/${id}/stale`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
      toast({
        title: 'Atom Marked Stale',
        description: 'The knowledge fact has been flagged for deprecation.'
      });
    }
  });

  // Get dynamic tag styling
  const getCategoryStyles = (cat: string | null) => {
    switch (cat?.toLowerCase()) {
      case 'product': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'feature': return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400';
      case 'faq': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400';
      case 'claim': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'pricing': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'testimonial': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
      case 'guideline': return 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-900 shadow-2xl border border-slate-800 text-white rounded-3xl animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-800 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Brand Brain Explorer
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore, filter, and audit extracted semantic facts used in content generation.
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-6 pb-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facts, guidelines, testimonials or citations..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Categories Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setClassification(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all capitalize shrink-0 ${
                  classification === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries scrollable area */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 min-h-0">
          {isLoading ? (
            <div className="flex flex-col h-[40vh] items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-500 font-medium">Scanning brand brain cells...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col h-[40vh] items-center justify-center gap-3 text-red-400 bg-red-950/10 border border-red-900/20 rounded-2xl p-6">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <h3 className="font-bold">Error loading brain cells</h3>
              <p className="text-xs text-slate-400">Failed to connect to the indexing service.</p>
              <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-xs font-bold hover:bg-red-900/50">
                Retry Query
              </button>
            </div>
          ) : entries.length > 0 ? (
            classification === 'all' ? (
              <div className="space-y-8">
                {CATEGORIES.filter(c => c.id !== 'all').map((category) => {
                  const categoryEntries = entries.filter(
                    e => (e.classification || 'unclassified').toLowerCase().includes(category.id.toLowerCase())
                  );
                  
                  // Also capture unclassified in the 'fact' or 'unclassified' category if needed, but let's stick to standard logic
                  if (categoryEntries.length === 0) return null;

                  return (
                    <div key={category.id} className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                          {category.label}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                          {categoryEntries.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {categoryEntries.map((entry) => (
                          <div 
                            key={entry.id} 
                            className={`relative p-5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 transition-all ${
                              entry.isStale ? 'opacity-50 grayscale border-slate-900' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-3">
                                {/* Badge header */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getCategoryStyles(entry.classification)}`}>
                                    {entry.classification || 'Unclassified'}
                                  </span>
                                  
                                  <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-lg">
                                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                                    {(entry.confidence * 100).toFixed(0)}% extraction confidence
                                  </span>

                                  {entry.isStale && (
                                    <span className="bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-lg">
                                      Stale / Deprecated
                                    </span>
                                  )}
                                </div>

                                {/* Content statement */}
                                <p className="text-slate-200 text-sm font-medium leading-relaxed font-sans pr-6 select-all">
                                  {entry.content}
                                </p>

                                {/* Source footer */}
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40 text-[10px] text-slate-500 font-semibold">
                                  <span className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md text-slate-400">
                                    {entry.source.type === 'url' ? <Globe className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                    {entry.source.name || 'Anonymous Source'}
                                  </span>
                                  {entry.source.sourceUrl && entry.source.sourceUrl.startsWith('http') && (
                                    <a 
                                      href={entry.source.sourceUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-slate-400 hover:text-white flex items-center gap-0.5"
                                    >
                                      Source link <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Manage actions */}
                              {!entry.isStale && (
                                <button 
                                  onClick={() => markStaleMutation.mutate(entry.id)}
                                  disabled={markStaleMutation.isPending}
                                  title="Mark fact as stale"
                                  className="p-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 self-start"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Fallback for unclassified or other categories */}
                {entries.filter(e => !CATEGORIES.some(c => (e.classification || '').toLowerCase().includes(c.id.toLowerCase()))).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Other</h3>
                    </div>
                    <div className="space-y-4">
                      {entries.filter(e => !CATEGORIES.some(c => (e.classification || '').toLowerCase().includes(c.id.toLowerCase()))).map((entry) => (
                        <div 
                          key={entry.id} 
                          className={`relative p-5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 transition-all ${
                            entry.isStale ? 'opacity-50 grayscale border-slate-900' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3">
                              {/* Badge header */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getCategoryStyles(entry.classification)}`}>
                                  {entry.classification || 'Unclassified'}
                                </span>
                                
                                <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-lg">
                                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                                  {(entry.confidence * 100).toFixed(0)}% extraction confidence
                                </span>

                                {entry.isStale && (
                                  <span className="bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-lg">
                                    Stale / Deprecated
                                  </span>
                                )}
                              </div>

                              {/* Content statement */}
                              <p className="text-slate-200 text-sm font-medium leading-relaxed font-sans pr-6 select-all">
                                {entry.content}
                              </p>

                              {/* Source footer */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40 text-[10px] text-slate-500 font-semibold">
                                <span className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md text-slate-400">
                                  {entry.source.type === 'url' ? <Globe className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                  {entry.source.name || 'Anonymous Source'}
                                </span>
                                {entry.source.sourceUrl && entry.source.sourceUrl.startsWith('http') && (
                                  <a 
                                    href={entry.source.sourceUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-white flex items-center gap-0.5"
                                  >
                                    Source link <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Manage actions */}
                            {!entry.isStale && (
                              <button 
                                onClick={() => markStaleMutation.mutate(entry.id)}
                                disabled={markStaleMutation.isPending}
                                title="Mark fact as stale"
                                className="p-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 self-start"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`relative p-5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 transition-all ${
                      entry.isStale ? 'opacity-50 grayscale border-slate-900' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        {/* Badge header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getCategoryStyles(entry.classification)}`}>
                            {entry.classification || 'Unclassified'}
                          </span>
                          
                          <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-lg">
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                            {(entry.confidence * 100).toFixed(0)}% extraction confidence
                          </span>

                          {entry.isStale && (
                            <span className="bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-lg">
                              Stale / Deprecated
                            </span>
                          )}
                        </div>

                        {/* Content statement */}
                        <p className="text-slate-200 text-sm font-medium leading-relaxed font-sans pr-6 select-all">
                          {entry.content}
                        </p>

                        {/* Source footer */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40 text-[10px] text-slate-500 font-semibold">
                          <span className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md text-slate-400">
                            {entry.source.type === 'url' ? <Globe className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            {entry.source.name || 'Anonymous Source'}
                          </span>
                          {entry.source.sourceUrl && entry.source.sourceUrl.startsWith('http') && (
                            <a 
                              href={entry.source.sourceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-slate-400 hover:text-white flex items-center gap-0.5"
                            >
                              Source link <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Manage actions */}
                      {!entry.isStale && (
                        <button 
                          onClick={() => markStaleMutation.mutate(entry.id)}
                          disabled={markStaleMutation.isPending}
                          title="Mark fact as stale"
                          className="p-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 self-start"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col h-[40vh] items-center justify-center gap-4 text-center">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl text-slate-600">
                <Database className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">No Matching Atoms</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  We couldn't find any extraction atoms matching your current search parameters.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
