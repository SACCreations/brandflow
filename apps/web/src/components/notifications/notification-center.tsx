'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Loader2, Info, AlertCircle, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@brandflow/ui';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data as Notification[];
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-40 w-80 max-h-[480px] flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-300 dark:bg-gray-900">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-gray-500">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-900">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "group relative flex gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900/50",
                        !n.isRead && "bg-brand-50/30 dark:bg-brand-500/5"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        n.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' :
                        n.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
                      )}>
                        {n.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                         n.type === 'success' ? <Check className="h-4 w-4" /> :
                         n.type === 'ai' ? <Sparkles className="h-4 w-4" /> :
                         <Info className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-xs font-bold leading-none text-gray-900 dark:text-white",
                            !n.isRead && "text-brand-700 dark:text-brand-400"
                          )}>
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-gray-400 font-medium">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-[11px] leading-relaxed text-gray-500 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead.mutate(n.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:bg-gray-900 hover:text-brand-600 shadow-sm transition-all"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 px-4 py-2 text-center dark:border-gray-800 dark:bg-gray-900/50">
              <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                Notification Settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
