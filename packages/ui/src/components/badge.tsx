import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary/80 backdrop-blur-md text-secondary-foreground hover:bg-secondary/60',
        destructive:
          'border-transparent bg-destructive/10 text-destructive dark:text-red-400 hover:bg-destructive/20',
        outline: 'text-foreground border-white/20 dark:border-white/10',
        success:
          'border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
        warning:
          'border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
        gradient: 'border-transparent bg-gradient-to-r from-primary to-indigo-500 text-white shadow-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
