import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  mfaEnabled?: boolean;
}

export interface AuthBusiness {
  id: string;
  name: string;
  slug: string;
}

const SESSION_COOKIE = 'bf-session';

function setSessionCookie(value: string | null) {
  if (typeof document === 'undefined') return;
  if (value) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${SESSION_COOKIE}=1; path=/; expires=${expires}; samesite=strict`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; samesite=strict`;
  }
}

interface AuthState {
  user: AuthUser | null;
  business: AuthBusiness | null;
  accessToken: string | null;
  hasHydrated: boolean;
  isRefreshingSession: boolean;
  setAuth: (user: AuthUser, accessToken: string, business: AuthBusiness) => void;
  updateToken: (accessToken: string) => void;
  clearAuth: () => void;
  markHydrated: () => void;
  setSessionRefreshing: (isRefreshingSession: boolean) => void;
  logout: (options?: { redirect?: boolean }) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      accessToken: null,
      hasHydrated: false,
      isRefreshingSession: false,

      setAuth: (user, accessToken, business) => {
        set({ user, accessToken, business, hasHydrated: true });
        setSessionCookie('1');
      },

      updateToken: (accessToken) => {
        set({ accessToken, hasHydrated: true });
        setSessionCookie(accessToken ? '1' : null);
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, business: null, isRefreshingSession: false });
        setSessionCookie(null);
      },

      markHydrated: () => set({ hasHydrated: true }),

      setSessionRefreshing: (isRefreshingSession) => set({ isRefreshingSession }),

      logout: (options) => {
        set({ user: null, accessToken: null, business: null, isRefreshingSession: false, hasHydrated: true });
        setSessionCookie(null);
        // Redirect after clearing state
        if (typeof window !== 'undefined' && options?.redirect !== false) {
          window.location.href = '/login';
        }
      },

      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'brandflow-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        business: state.business,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

