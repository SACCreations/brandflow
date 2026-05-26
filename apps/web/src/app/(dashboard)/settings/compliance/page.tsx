'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  ShieldCheck, 
  History, 
  User, 
  Database, 
  Search, 
  ArrowUpDown,
  Lock,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  Badge, 
  Button, 
  Input, 
  Skeleton,
  cn
} from '@brandflow/ui';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  before: any;
  after: any;
  hash: string;
  previousHash: string;
  createdAt: string;
}

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/business/audit-logs');
      return res.data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance & Governance</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor all sensitive actions within your workspace. These logs are tamper-evident and cryptographically chained.
        </p>
      </div>

      {/* Stats / Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Log Integrity</p>
            <h3 className="text-xl font-bold">Verified</h3>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> Chained SHA-256
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary dark:bg-brand-900/20 dark:text-brand-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
            <h3 className="text-xl font-bold">{logs?.length || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </Card>
        <Card className="p-6 flex items-start gap-4 opacity-50 grayscale cursor-not-allowed">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">PII Redaction</p>
            <h3 className="text-xl font-bold text-muted-foreground">Inactive</h3>
            <p className="text-xs text-muted-foreground mt-1">Enterprise Add-on</p>
          </div>
        </Card>
      </div>

      {/* Main Table Section */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search actions, entities, or users..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="w-4 h-4" /> Sort
            </Button>
            <Button variant="outline" size="sm">Export CSV</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-1 bg-background/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">User</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">Action</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">Entity</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-1 bg-background dark:hover:bg-surface-1/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold uppercase">
                          {log.userId?.substring(0, 2) || 'S'}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                          {log.userId || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "capitalize border-none bg-transparent font-medium",
                        log.action.includes('delete') ? "text-red-600" : 
                        log.action.includes('update') ? "text-blue-600" : "text-green-600"
                      )}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground capitalize">{log.entityType}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">{log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 group-hover:opacity-100 opacity-60 transition-opacity">
                        <span className="text-[10px] font-mono text-muted-foreground">{log.hash.substring(0, 8)}...</span>
                        <FileCheck className="w-4 h-4 text-green-500" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
