import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Standardized generic GET query hook.
 */
export function useApiQuery<TData = unknown, TError = AxiosError>(
  queryKey: unknown[],
  url: string,
  config?: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TData>(url, config);
      return response.data;
    },
    ...options,
  });
}

/**
 * Standardized generic POST mutation hook.
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TError = AxiosError>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.request<TData>({
        url,
        method,
        data: variables,
      });
      return response.data;
    },
    ...options,
  });
}
