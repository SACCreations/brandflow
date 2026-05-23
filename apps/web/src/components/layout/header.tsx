'use client';

import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { NotificationCenter } from '../notifications/notification-center';
import { Moon, Sun, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const business = useAuthStore((s) => s.business);
  const logout = useAuthStore((s) => s.logout);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

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
      <div className="flex items-center gap-3">
        {business && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {business.name}
          </span>
        )}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="ml-4 hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-gray-300 sm:flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        >
          <Search className="h-3 w-3" />
          Search...
          <kbd className="ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] font-medium dark:border-gray-600 dark:bg-gray-700">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title="Toggle dark mode"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
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

