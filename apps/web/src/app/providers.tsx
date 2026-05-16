'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AuthTokens } from '@brandflow/shared';

import { Toaster } from '@brandflow/ui';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

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
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isRefreshingSession = useAuthStore((state) => state.isRefreshingSession);
  const [attempted, setAttempted] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setSessionRefreshing = useAuthStore((state) => state.setSessionRefreshing);

  useEffect(() => {
    if (!hasHydrated || isRefreshingSession || attempted) {
      return;
    }

    const hasSession = hasSessionCookie();

    if (!hasSession) {
      if (!accessToken && (user || business)) {
        clearAuth();
      }
      setAttempted(true);
      return;
    }

    if (accessToken && user && business) {
      setAttempted(true);
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('bf-bootstrap-attempted')) {
        return;
      }

      setSessionRefreshing(true);
      setAttempted(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('bf-bootstrap-attempted', 'true');
      }

      try {
        let activeToken = accessToken;

        if (!activeToken) {
          const refreshResponse = await apiClient.post<AuthTokens>('/auth/refresh', {});
          activeToken = refreshResponse.data.accessToken;
        }

        const profileResponse = await apiClient.get<SessionProfileResponse>('/auth/me', {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined,
        });

        if (cancelled || !activeToken) {
          return;
        }

        const profile = profileResponse.data;

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
        // Silently handle 401s during bootstrap as they just mean the session is dead/expired
        if (err?.response?.status !== 401) {
          console.error('[AUTH BOOTSTRAP] Session restoration failed:', err);
        }
        
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setSessionRefreshing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [accessToken, business, clearAuth, hasHydrated, isRefreshingSession, setAuth, setSessionRefreshing, user, attempted]);


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
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
