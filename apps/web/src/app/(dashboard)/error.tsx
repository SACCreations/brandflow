'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-2xl border border-red-500/20 bg-surface-1 p-8 shadow-xl shadow-red-500/5">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-center text-xl font-extrabold text-foreground">
            Something went wrong
          </h2>
          <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-surface-2 px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-surface-3 hover:border-border shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </a>
          </div>
          {error.digest && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
