import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const apiClient = axios.create({
  baseURL: process.env['NEXT_PUBLIC_API_URL']?.includes('3001') ? 'http://localhost:4000/api/v1' : (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api/v1'),
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s timeout
});

// Attach access token from store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 interceptor: attempt silent token refresh, then redirect to login
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function drainQueue(token: string | null, err: unknown = null) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (res) => {
    // Automatically unwrap standard API envelope
    if (res.data && typeof res.data === 'object' && 'data' in res.data && 'success' in res.data) {
      return {
        ...res,
        data: res.data.data,

      };
    }
    return res;
  },
  async (error: import('axios').AxiosError) => {
    const original = error.config as import('axios').InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry refresh endpoint itself to avoid loops
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // refreshToken is sent automatically as httpOnly cookie
        // The interceptor above will unwrap this to { accessToken, refreshToken, expiresIn }
        const res = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>('/auth/refresh', {});
        const newToken = res.data.accessToken;
        
        useAuthStore.getState().updateToken(newToken);
        drainQueue(newToken);
        
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        drainQueue(null, refreshError);
        useAuthStore.getState().logout({ redirect: true });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

