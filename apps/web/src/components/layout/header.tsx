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
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        {business && (
          <span className="text-sm font-semibold text-foreground">
            {business.name}
          </span>
        )}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="ml-4 hidden items-center gap-2 rounded-xl border border-border/60 bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-300 hover:bg-surface-2 hover:border-border-strong sm:flex shadow-sm"
        >
          <Search className="h-3.5 w-3.5" />
          Search...
          <kbd className="ml-2 rounded-md border border-border/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleDark}
          className="rounded-xl p-2.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-all duration-300"
          title="Toggle dark mode"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <NotificationCenter />
        <div className="h-6 w-px bg-border/60 mx-1" />
        {user && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-foreground text-xs font-bold shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground">
              {displayName}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-all duration-300 ml-2"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

