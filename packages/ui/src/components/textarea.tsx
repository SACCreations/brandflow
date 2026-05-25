import * as React from 'react';
import { cn } from '../lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-2xl border-2 border-input/50 bg-white/50 dark:bg-black/20 px-4 py-3 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring focus-visible:bg-white dark:focus-visible:bg-black/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
