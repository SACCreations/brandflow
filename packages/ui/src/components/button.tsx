import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 interactive-scale [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-elevation-1 hover:bg-primary/95 hover:shadow-elevation-2 hover:-translate-y-[2px]',
        destructive: 'bg-destructive text-destructive-foreground shadow-elevation-1 hover:bg-destructive/90 hover:-translate-y-[2px] hover:shadow-elevation-2',
        error: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:-translate-y-[1px]',
        success: 'bg-[hsl(var(--success))] text-success-foreground shadow-elevation-1 hover:brightness-110 hover:-translate-y-[2px]',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:-translate-y-[1px]',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-[1px]',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-[2px] hover:brightness-110',
        ai: 'bg-[hsl(var(--ai))] text-ai-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-[2px] animate-pulse-glow',
        glass: 'glass hover:glass-panel text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as any}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
