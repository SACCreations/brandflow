'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { BrandStudio } from '@/components/brand/brand-studio';
import { useToast } from '@brandflow/ui';

export default function BrandCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/brands', data);
    },
    onSuccess: () => {
      localStorage.removeItem('brand_draft_new');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Brand created',
        description: 'New brand identity has been successfully created.',
      });
      router.push('/intelligence/brands');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create brand.',
      });
    },
  });

  return (
    <div>
      <BrandStudio 
        title="Create New Brand"
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
        }}
        isLoading={mutation.isPending}
      />
    </div>
  );
}
