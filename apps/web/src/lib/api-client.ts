import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, attempt refresh then retry once
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await apiClient.post('/auth/refresh');
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          data.data.accessToken,
        );
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
