'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AuthTokens } from '@brandflow/shared';

import { Toaster } from '@brandflow/ui';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { getJwtExpirationMs } from '@/lib/jwt';

interface SessionProfileResponse {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    mfaEnabled?: boolean;
  };
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

function hasSessionCookie() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split(';')
    .some((cookie) => {
      const [name, value] = cookie.trim().split('=');
      return name === 'bf-session' && value === '1';
    });
}

function SessionBootstrap() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isRefreshingSession = useAuthStore((state) => state.isRefreshingSession);
  const [attempted, setAttempted] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setSessionRefreshing = useAuthStore((state) => state.setSessionRefreshing);

  const isFirstRun = useRef(true);

  useEffect(() => {
    // Only run the bootstrap logic once on mount
    if (!isFirstRun.current || !hasHydrated) {
      return;
    }
    
    isFirstRun.current = false;

    const bootstrap = async () => {
      const hasSession = hasSessionCookie();
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
      console.log('[AUTH BOOTSTRAP] Starting. hasSession:', hasSession, 'path:', currentPath);

      if (!hasSession) {
        if (!accessToken && (user || business)) {
          clearAuth();
        }
        setAttempted(true);
        return;
      }

      setSessionRefreshing(true);
      setAttempted(true);

      try {
        let activeToken = accessToken;

        if (!activeToken) {
          console.log('[AUTH BOOTSTRAP] No access token, attempting refresh...');
          const refreshResponse = await apiClient.post<AuthTokens>('/auth/refresh', {});
          activeToken = refreshResponse.data.accessToken;
          console.log('[AUTH BOOTSTRAP] Refresh successful.');
        }

        console.log('[AUTH BOOTSTRAP] Fetching profile...');
        const profileResponse = await apiClient.get<SessionProfileResponse>('/auth/me', {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined,
        });

        const profile = profileResponse.data;
        console.log('[AUTH BOOTSTRAP] Profile fetched, updating store.');

        setAuth(
          {
            id: profile.user.id,
            email: profile.user.email,
            firstName: profile.user.firstName ?? null,
            lastName: profile.user.lastName ?? null,
            avatarUrl: profile.user.avatarUrl ?? null,
            mfaEnabled: profile.user.mfaEnabled ?? false,
          },
          activeToken,
          {
            id: profile.business.id,
            name: profile.business.name,
            slug: profile.business.slug,
          },
        );
      } catch (err: any) {
        console.error('[AUTH BOOTSTRAP] Error:', err.message || err);
        
        // Atomically clear authentication states and delete cookies synchronously BEFORE redirecting
        clearAuth();
        
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isPublic = ['/login', '/register', '/'].includes(path);
        
        if (!isPublic) {
          console.log('[AUTH BOOTSTRAP] Redirecting to login. Current path:', path);
          window.location.href = '/login'; // Use direct location for maximum reliability
        } else {
          console.log('[AUTH BOOTSTRAP] Already on public path:', path);
        }
      } finally {
        setSessionRefreshing(false);
      }
    };

    void bootstrap();
  }, [hasHydrated]); // Minimized dependencies to prevent re-runs


  return null;
}

function TokenRefreshScheduler() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateToken = useAuthStore((state) => state.updateToken);

  useEffect(() => {
    if (!accessToken) return;

    const expirationMs = getJwtExpirationMs(accessToken);
    if (!expirationMs) return;

    // Proactively refresh 1 minute before token expires
    const refreshTime = expirationMs - 60000;
    const now = Date.now();
    const delay = Math.max(0, refreshTime - now);

    const timerId = setTimeout(async () => {
      try {
        // Use Web Locks API to ensure only one tab refreshes concurrently
        if (typeof navigator !== 'undefined' && navigator.locks) {
          await navigator.locks.request('auth-refresh-lock', async () => {
            // Check if token was already updated by another tab while waiting for lock
            const currentToken = useAuthStore.getState().accessToken;
            if (currentToken !== accessToken) return;

            console.log('[TOKEN REFRESH] Proactively refreshing token...');
            const res = await apiClient.post<AuthTokens>('/auth/refresh', {});
            updateToken(res.data.accessToken);
            console.log('[TOKEN REFRESH] Success.');
          });
        } else {
          // Fallback if Web Locks API is not supported
          console.log('[TOKEN REFRESH] Proactively refreshing token (no lock)...');
          const res = await apiClient.post<AuthTokens>('/auth/refresh', {});
          updateToken(res.data.accessToken);
        }
      } catch (err) {
        console.error('[TOKEN REFRESH] Failed proactive refresh:', err);
        // We do not force logout here. If the proactive refresh fails,
        // the normal interceptor will catch the 401 on the next API call.
      }
    }, delay);

    return () => clearTimeout(timerId);
  }, [accessToken, updateToken]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      <TokenRefreshScheduler />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
