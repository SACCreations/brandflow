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
        <div className="rounded-2xl border border-red-100 bg-background p-8 shadow-sm dark:border-red-900/30 bg-background">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="mb-2 text-center text-lg font-bold text-foreground">
            Something went wrong
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-1 bg-background border-border bg-surface-2 text-foreground"
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
