'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  backHref?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/30 p-12 text-center dark:border-red-900/30 dark:bg-red-950/10">
          <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">Something went wrong</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Your work has been preserved — try refreshing or going back.
          </p>
          {this.state.error?.message && (
            <p className="mt-2 max-w-md rounded-lg bg-red-100/50 px-3 py-1.5 text-xs font-mono text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            {this.props.backHref && (
              <a
                href={this.props.backHref}
                className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-1 border-border text-foreground dark:hover:bg-surface-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </a>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
