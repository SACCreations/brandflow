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
    // Expires in 7 days (matches refresh token lifetime)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${SESSION_COOKIE}=1; path=/; expires=${expires}; samesite=strict`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=strict`;
  }
}

interface AuthState {
  user: AuthUser | null;
  business: AuthBusiness | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, business: AuthBusiness) => void;
  updateToken: (accessToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      accessToken: null,

      setAuth: (user, accessToken, business) => {
        set({ user, accessToken, business });
        setSessionCookie('1');
      },

      updateToken: (accessToken) => set({ accessToken }),

      logout: () => {
        set({ user: null, accessToken: null, business: null });
        setSessionCookie(null);
        // Redirect after clearing state
        if (typeof window !== 'undefined') {
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
    },
  ),
);

