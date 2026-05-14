'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { BrandWizard } from '@/components/brand/brand-wizard';
import { useToast } from '@brandflow/ui';

export default function BrandOnboardingPage() {
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
        title: 'Brand onboarding complete',
        description: 'Your brand identity has been successfully initialized.',
      });
      router.push('/intelligence/brands');
    },
    onError: (error: any) => {
      console.error('Onboarding Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const validationErrors = error.response?.data?.errors;
      const detailMessage = Array.isArray(validationErrors) 
        ? validationErrors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        : error.response?.data?.message;

      toast({
        variant: 'destructive',
        title: 'Onboarding failed',
        description: detailMessage || 'Something went wrong during onboarding.',
      });
    },
  });

  return (
    <div className="bg-white dark:bg-gray-950">
      <BrandWizard 
        title="Enterprise Brand Onboarding"
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
        }}
        isLoading={mutation.isPending}
      />
    </div>
  );
}
