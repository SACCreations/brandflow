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
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-background/70 backdrop-blur-xl px-6 sticky top-0 z-50 transition-all duration-300">
      <div className="flex items-center gap-4">
        {business && (
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {business.name}
            </span>
          </div>
        )}
        <div className="h-4 w-px bg-border/60 mx-2 hidden sm:block" />
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="hidden items-center gap-3 rounded-full border border-border/50 bg-surface-1/50 px-4 py-1.5 text-xs text-muted-foreground transition-all duration-300 hover:bg-surface-2 hover:border-border sm:flex shadow-sm hover:shadow-md"
        >
          <Search className="h-3.5 w-3.5 text-foreground/50" />
          <span className="font-medium">Quick search...</span>
          <kbd className="ml-4 rounded bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm border border-border/50">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="rounded-full p-2.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-sm"
          title="Toggle dark mode"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <NotificationCenter />
        <div className="h-6 w-px bg-border/60 mx-1" />
        {user && (
          <div className="flex items-center gap-3 p-1 pr-3 rounded-full border border-border/50 bg-surface-1/50 shadow-sm hover:bg-surface-2 transition-colors cursor-pointer">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-xs font-bold text-foreground">
              {displayName}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="rounded-full px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 ml-1 border border-transparent hover:border-destructive/20"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

