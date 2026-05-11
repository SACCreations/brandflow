'use client';

import { useAuthStore } from '@/store/auth.store';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </span>
        )}
        <button
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
