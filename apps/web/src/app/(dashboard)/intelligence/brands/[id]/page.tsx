'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { BrandStudio } from '@/components/brand/brand-studio';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button, useToast } from '@brandflow/ui';

export default function BrandEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params['id'] as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: brand, isLoading } = useQuery({
    queryKey: ['brand', id],
    queryFn: async () => {
      const res = await apiClient.get(`/brands/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.patch(`/brands/${id}`, data);
    },
    onSuccess: () => {
      localStorage.removeItem(`brand_draft_${id}`);
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['brand', id] });
      toast({
        title: 'Brand updated',
        description: 'Your changes have been saved successfully.',
      });
      router.push('/intelligence/brands');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update brand.',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading brand studio...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <p className="text-gray-500 text-lg font-medium">Brand not found.</p>
        <Button variant="outline" onClick={() => router.push('/intelligence/brands')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>
      </div>
    );
  }

  return (
    <div>
      <BrandStudio 
        title="Edit Brand"
        initialData={brand}
        onSubmit={(data) => mutation.mutateAsync(data)}
        isLoading={mutation.isPending}
      />
    </div>
  );
}
