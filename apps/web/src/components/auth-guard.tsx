'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

/**
 * Client-side auth guard. Redirects to /login if there is no access token
 * in the Zustand store. Works in tandem with the middleware cookie check.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isRefreshingSession = useAuthStore((s) => s.isRefreshingSession);

  useEffect(() => {
    if (hasHydrated && !isRefreshingSession && !accessToken) {
      router.replace('/login');
    }
  }, [accessToken, hasHydrated, isRefreshingSession, router]);

  if (!hasHydrated || isRefreshingSession || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
