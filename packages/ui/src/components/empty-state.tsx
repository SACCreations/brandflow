import * as React from 'react';
import { cn } from '../lib/utils';
import {
  FolderOpen,
  AlertCircle,
  ShieldAlert,
  Ban,
  Loader2,
  Hourglass,
  ServerCrash,
} from 'lucide-react';

export type EmptyStateVariant =
  | 'no-data'
  | 'api-failure'
  | 'unauthorized'
  | 'forbidden'
  | 'loading'
  | 'timeout'
  | 'server-unavailable';

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  variant,
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  // Define default values based on the variant
  let defaultIcon: React.ReactNode = icon;
  let defaultTitle = title || '';
  let defaultDescription = description || '';

  if (variant) {
    switch (variant) {
      case 'no-data':
        defaultIcon = icon || <FolderOpen className="h-8 w-8 text-muted-foreground" />;
        defaultTitle = title || 'No Data Available';
        defaultDescription =
          description || 'We couldn\'t find any records here right now.';
        break;
      case 'api-failure':
        defaultIcon = icon || <AlertCircle className="h-8 w-8 text-destructive" />;
        defaultTitle = title || 'API Request Failed';
        defaultDescription =
          description || 'Failed to retrieve data from the server. Please try again.';
        break;
      case 'unauthorized':
        defaultIcon = icon || <ShieldAlert className="h-8 w-8 text-warning" />;
        defaultTitle = title || 'Unauthorized Access';
        defaultDescription =
          description || 'You must be logged in with appropriate credentials to see this page.';
        break;
      case 'forbidden':
        defaultIcon = icon || <Ban className="h-8 w-8 text-destructive" />;
        defaultTitle = title || 'Access Denied';
        defaultDescription =
          description || 'You do not have the required permissions to access this resource.';
        break;
      case 'loading':
        defaultIcon = icon || <Loader2 className="h-8 w-8 text-primary animate-spin" />;
        defaultTitle = title || 'Loading...';
        defaultDescription =
          description || 'Please wait while we retrieve the latest content.';
        break;
      case 'timeout':
        defaultIcon = icon || <Hourglass className="h-8 w-8 text-warning" />;
        defaultTitle = title || 'Request Timeout';
        defaultDescription =
          description || 'The server took too long to respond. Please check your network and retry.';
        break;
      case 'server-unavailable':
        defaultIcon = icon || <ServerCrash className="h-8 w-8 text-destructive" />;
        defaultTitle = title || 'Server Offline';
        defaultDescription =
          description || 'The backend services are currently unreachable. Please try again later.';
        break;
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed rounded-xl bg-card text-card-foreground',
        className,
      )}
    >
      {defaultIcon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          {defaultIcon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
        {defaultTitle}
      </h3>
      {defaultDescription && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {defaultDescription}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
