'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { BrandWizard } from '@/components/brand/brand-wizard';
import { useToast } from '@brandflow/ui';

export default function BrandCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [initialData, setInitialData] = React.useState<any>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('brand_draft_new');
      if (stored) {
        setInitialData(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    } finally {
      setIsReady(true);
    }
  }, []);

  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const projectId = searchParams.get('projectId');

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/brands', data);
      const brand = res.data;

      if (customerId) {
        const currentCustomer = (await apiClient.get(`/customers/${customerId}`)).data as any;
        await apiClient.patch(`/customers/${customerId}`, {
          metadata: {
            ...(currentCustomer.metadata ?? {}),
            primaryBrandId: brand.id,
            primaryBrandName: brand.name,
            brandLinkedAt: new Date().toISOString(),
          },
        });
      }

      if (projectId) {
        const currentProject = (await apiClient.get(`/projects/${projectId}`)).data as any;
        await apiClient.patch(`/projects/${projectId}`, {
          metadata: {
            ...(currentProject.metadata ?? {}),
            primaryBrandId: brand.id,
            primaryBrandName: brand.name,
            brandLinkedAt: new Date().toISOString(),
          },
        });
      }

      return brand;
    },
    onSuccess: () => {
      localStorage.removeItem('brand_draft_new');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Brand created',
        description: 'New brand identity has been successfully created.',
      });

      if (projectId) {
        router.push(`/projects/${projectId}?brandCreated=1`);
        return;
      }

      if (customerId) {
        router.push(`/settings/clients/${customerId}?brandCreated=1`);
        return;
      }

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

  if (!isReady) return null;

  return (
    <div className="bg-background">
      <BrandWizard 
        title="Brand Onboarding Wizard"
        initialData={initialData}
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
        }}
        isLoading={mutation.isPending}
        onClose={() => router.push('/intelligence/brands')}
      />
    </div>
  );
}
