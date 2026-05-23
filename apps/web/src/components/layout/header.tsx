'use client';

import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { NotificationCenter } from '../notifications/notification-center';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const business = useAuthStore((s) => s.business);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore — clear local state regardless
    } finally {
      logout();
    }
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.email ?? '';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        {business && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {business.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <NotificationCenter />
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
              {displayName}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

