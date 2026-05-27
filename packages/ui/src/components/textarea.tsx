import * as React from 'react';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2 } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: boolean;
  isLoading?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, isLoading, ...props }, ref) => {
    return (
      <div className="w-full relative">
        <textarea
          className={cn(
            'flex min-h-[120px] w-full rounded-lg border border-input bg-background/50 hover:bg-surface-2/50 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out font-medium',
            error && 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive',
            success && !error && 'border-success focus-visible:ring-success/30 focus-visible:border-success',
            (isLoading || success) && 'pr-10', // make room for icon
            className
          )}
          ref={ref}
          disabled={isLoading || props.disabled}
          {...props}
        />
        {isLoading && (
          <div className="absolute top-3 right-3 flex items-center pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {success && !isLoading && !error && (
          <div className="absolute top-3 right-3 flex items-center pointer-events-none">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
