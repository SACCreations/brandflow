import React from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@brandflow/ui';

interface QueueProgressMonitorProps {
  loading: boolean;
  jobStatus: string;
  jobProgress: number;
  completedContents: any[];
  generateMutation: any;
}

export function QueueProgressMonitor({
  loading,
  jobStatus,
  jobProgress,
  completedContents,
  generateMutation,
}: QueueProgressMonitorProps) {
  return (
    <>
      {/* Active Generation Runner UI */}
      {loading && (
        <div className="glass-panel p-6 border-primary/30 bg-primary/100/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-brand-400" />
              <span className="text-sm font-extrabold text-brand-900 dark:text-brand-300">
                {jobStatus === 'generating' ? 'Running batch queue process...' : 'Sending transaction request...'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-primary bg-primary/100/20 px-2 py-0.5 rounded dark:text-brand-400">
              {jobProgress}% Done
            </span>
          </div>

          <div className="w-full bg-primary/100/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
            <div 
              className="bg-primary dark:bg-primary h-2 rounded-full transition-all duration-500 shadow-md shadow-brand-500/50"
              style={{ width: `${jobProgress}%` }}
            />
          </div>

          <div className="text-[10px] font-semibold text-primary/70 dark:text-brand-400/70 uppercase tracking-wider flex justify-between">
            <span>Concurrently processing items</span>
            <span>Do not close this tab</span>
          </div>
        </div>
      )}

      {/* Queue completed variants results list */}
      {completedContents.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
                Generated Batch Outputs ({completedContents.length})
              </h3>
            </div>
            {completedContents.length > 1 && completedContents.some((c) => c.status === 'success') && (
              <Link href={`/create/content/compare?groupId=${completedContents[0]?.generationGroupId || ''}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold backdrop-blur-sm bg-background/50 bg-background/50">
                  Compare Variants <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-4">
            {completedContents.map((c, idx) => (
              <div key={idx} className={`glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                c.status === 'success' 
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground line-clamp-1">{c.topic}</div>
                  <div className="text-[10px] flex items-center gap-2">
                    <span className="text-muted-foreground">Index: {idx + 1}</span>
                    <span className="text-muted-foreground">•</span>
                    {c.status === 'success' ? (
                      <span className="text-emerald-700 bg-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider text-[9px] dark:text-emerald-400">Draft created</span>
                    ) : (
                      <span className="text-red-700 bg-red-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider text-[9px] dark:text-red-400">Failed: {c.error || 'Unknown error'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {c.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-bold text-amber-700 border-amber-500/30 hover:bg-amber-500/10 dark:text-amber-400 bg-background/50 bg-background/50 backdrop-blur-sm"
                      onClick={() => {
                        // Re-trigger generation for failed item
                        generateMutation.mutate();
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </Button>
                  )}
                  {c.status === 'success' && c.contentId && (
                    <Link href={`/create/content/${c.contentId}`}>
                      <Button variant="outline" className="gap-1.5 text-xs font-bold backdrop-blur-sm bg-background/50 bg-background/50">
                        Open in Editor <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
