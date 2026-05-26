'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-1 bg-background p-6 bg-background">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-2xl border border-red-100 bg-background p-8 shadow-lg dark:border-red-900/30 bg-background">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-center text-xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-1 bg-background border-border bg-surface-2 text-foreground dark:hover:bg-gray-700"
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </a>
          </div>
          {error.digest && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
