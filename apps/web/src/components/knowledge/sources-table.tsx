'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Link as LinkIcon, 
  MoreVertical, 
  RefreshCw, 
  Trash2, 
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator 
} from '@brandflow/ui';
import { format } from 'date-fns';

export default function SourcesTable() {
  const queryClient = useQueryClient();

  // Fetch sources from API
  const { data: sources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['knowledge-sources'],
    queryFn: async () => {
      const res = await apiClient.get('/knowledge/sources');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/knowledge/sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
    },
  });

  const resyncMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/knowledge/sources/${id}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/knowledge/sources/sync-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center border border-border rounded-2xl bg-background mt-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-900/20 mt-8">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
        <h3 className="text-md font-bold text-red-900 dark:text-red-400">Failed to load sources</h3>
        <button onClick={() => refetch()} className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-xs hover:bg-red-200 transition-all">Try Again</button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-background border-border bg-background">
      <div className="p-6 border-b border-border/60 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Active Knowledge Sources</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => syncAllMutation.mutate()} 
            disabled={syncAllMutation.isPending} 
            className="flex items-center gap-2 rounded-lg bg-surface-3 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-3 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Re-sync all knowledge sources"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
            Re-sync All
          </button>
          <button 
            onClick={() => refetch()} 
            className="rounded-lg p-1.5 text-muted-foreground hover:text-gray-600 dark:hover:text-gray-200 hover:bg-surface-2 dark:hover:bg-surface-1 transition-colors"
            title="Refresh table"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/60 bg-surface-1 dark:bg-gray-950/50 bg-surface-2/20">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Entries</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Health</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Trust</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Sync</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {sources.map((source: any) => (
              <tr key={source.id} className="group transition-colors hover:bg-surface-1 dark:bg-gray-950/50 dark:hover:bg-surface-1/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground bg-surface-2 text-muted-foreground">
                      {source.type === 'url' ? <Globe className="h-5 w-5" /> :
                       source.type === 'pdf' ? <FileText className="h-5 w-5" /> :
                       source.type === 'api' ? <LinkIcon className="h-5 w-5" /> :
                       <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{source.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{source.sourceUrl}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {source.status === 'completed' || source.status === 'active' ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : source.status === 'processing' || source.status === 'pending' ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 animate-pulse">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Ingesting
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                        <XCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground font-black">
                  {source._count?.entries || 0}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
                      <div 
                        className={`h-full ${source.healthScore > 80 ? 'bg-emerald-500' : source.healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${source.healthScore || 85}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{source.healthScore || 85}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${
                    source.trustLevel === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
                    source.trustLevel === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-500/10'
                  }`}>
                    <Shield className="h-3 w-3" />
                    {source.trustLevel || 'high'}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] font-medium text-muted-foreground">
                  {source.lastIngested ? format(new Date(source.lastIngested), 'MMM d, HH:mm') : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => resyncMutation.mutate(source.id)}
                      disabled={resyncMutation.isPending || !['url', 'api', 'manual'].includes(source.type)}
                      title={!['url', 'api', 'manual'].includes(source.type) ? "Cannot re-sync files without re-uploading" : "Re-sync"}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-gray-600 dark:hover:bg-surface-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${resyncMutation.isPending && resyncMutation.variables === source.id ? 'animate-spin' : ''}`} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-2 text-muted-foreground hover:bg-surface-2 dark:hover:bg-surface-1 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => resyncMutation.mutate(source.id)} 
                          disabled={resyncMutation.isPending || !['url', 'api', 'manual'].includes(source.type)}
                          title={!['url', 'api', 'manual'].includes(source.type) ? "Cannot re-sync files without re-uploading" : ""}
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${resyncMutation.isPending && resyncMutation.variables === source.id ? 'animate-spin' : ''}`} /> Re-sync Now
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(source.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove Source
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-surface-2 rounded-3xl flex items-center justify-center text-muted-foreground">
                      <Database className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Knowledge Sources</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">Start by connecting a website or uploading a brand guideline PDF.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
