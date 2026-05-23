'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Badge, useToast, ErrorBoundary } from '@brandflow/ui';
import {
  ArrowLeft,
  Star,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Trophy,
  BarChart3,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface VariantContent {
  id: string;
  body: string;
  status: string;
  platform: string;
  type: string;
  qualityScore: number | null;
  createdAt: string;
  brand: { id: string; name: string };
  qualityChecks: Array<{
    passed: boolean;
    confidenceScore: number;
    overallGrade?: string;
  }>;
}

export default function VariantComparisonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const { data: variants = [], isLoading, isError } = useQuery<VariantContent[]>({
    queryKey: ['content-variants', groupId],
    queryFn: async () => {
      const res = await apiClient.get('/content', { params: { generationGroupId: groupId } });
      return res.data;
    },
    enabled: !!groupId,
  });

  const selectWinnerMutation = useMutation({
    mutationFn: async (winnerId: string) => {
      // Archive all others, keep winner as draft
      const losers = variants.filter((v) => v.id !== winnerId);
      await Promise.all(
        losers.map((l) => apiClient.delete(`/content/${l.id}`))
      );
      return winnerId;
    },
    onSuccess: (winnerId) => {
      queryClient.invalidateQueries({ queryKey: ['content-variants', groupId] });
      toast({
        title: 'Winner selected',
        description: 'Other variants have been archived. Redirecting to editor...',
      });
      setTimeout(() => router.push(`/create/content/${winnerId}`), 1000);
    },
    onError: () => {
      toast({
        title: 'Unable to select winner',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const res = await apiClient.post(`/content/${contentId}/regenerate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-variants', groupId] });
      toast({ title: 'Regenerating', description: 'A new variant is being generated.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Regeneration failed',
        description: error?.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (!groupId) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No variant group specified</h3>
        <p className="text-sm text-gray-500">Navigate here from batch generation results to compare variants.</p>
        <Link href="/create/content">
          <Button className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Generator</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError || variants.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No variants found</h3>
        <p className="text-sm text-gray-500">This generation group has no content items to compare.</p>
        <Link href="/create/content">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
      </div>
    );
  }

  const getGradeColor = (score: number) => {
    if (score >= 0.9) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10';
    if (score >= 0.7) return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10';
    if (score >= 0.5) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10';
    return 'text-red-600 bg-red-50 dark:bg-red-500/10';
  };

  const bestVariant = variants.reduce((best, v) => {
    const score = v.qualityChecks?.[0]?.confidenceScore ?? v.qualityScore ?? 0;
    const bestScore = best?.qualityChecks?.[0]?.confidenceScore ?? best?.qualityScore ?? 0;
    return score > bestScore ? v : best;
  }, variants[0]);

  return (
    <ErrorBoundary backHref="/create/content">
    <div className="mx-auto max-w-7xl px-2 py-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-6 dark:border-gray-800">
        <div className="space-y-2">
          <Link href="/create/content" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Generator
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-50 p-2.5 dark:bg-brand-500/10">
              <BarChart3 className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Variant Comparison
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Compare {variants.length} generated variants side by side. Select the best to continue.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            if (selectedWinner) selectWinnerMutation.mutate(selectedWinner);
          }}
          disabled={!selectedWinner || selectWinnerMutation.isPending}
          className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg"
        >
          {selectWinnerMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trophy className="h-4 w-4" />
          )}
          Select Winner & Archive Others
        </Button>
      </div>

      {/* Variant Grid */}
      <div className={`grid gap-6 ${variants.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {variants.map((variant) => {
          const qc = variant.qualityChecks?.[0];
          const score = qc?.confidenceScore ?? variant.qualityScore ?? 0;
          const isWinner = selectedWinner === variant.id;
          const isBest = variant.id === bestVariant?.id;

          return (
            <Card
              key={variant.id}
              className={`relative flex flex-col overflow-hidden transition-all cursor-pointer ${
                isWinner
                  ? 'ring-2 ring-brand-500 border-brand-500 shadow-lg shadow-brand-500/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
              }`}
              onClick={() => setSelectedWinner(variant.id)}
            >
              {/* Best badge */}
              {isBest && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest gap-1 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <Star className="h-3 w-3" /> Top Score
                  </Badge>
                </div>
              )}

              {/* Score Header */}
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isWinner ? 'bg-brand-600 text-white' : 'border-2 border-gray-200 text-gray-400'}`}>
                    {isWinner ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{variants.indexOf(variant) + 1}</span>}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{variant.platform}</span>
                    <p className="text-[10px] text-gray-400">{new Date(variant.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className={`rounded-lg px-2.5 py-1 text-sm font-black ${getGradeColor(score)}`}>
                  {Math.round(score * 100)}%
                </div>
              </div>

              {/* Content Body */}
              <div className="flex-1 p-5">
                <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300 line-clamp-[12]">
                  {variant.body}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${qc?.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {qc?.passed ? 'QC Passed' : 'Needs Review'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); regenerateMutation.mutate(variant.id); }}
                    disabled={regenerateMutation.isPending}
                    aria-label="Regenerate this variant"
                    className="rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <Link href={`/create/content/${variant.id}`} onClick={(e) => e.stopPropagation()}>
                    <button aria-label="Open in editor" className="rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Word count comparison row */}
      <Card className="p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Quick Metrics Comparison</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant, idx) => (
            <div key={variant.id} className="space-y-2 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Variant {idx + 1}</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{variant.body.split(' ').length}</div>
                  <div className="text-[9px] text-gray-400 uppercase">Words</div>
                </div>
                <div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{variant.body.length}</div>
                  <div className="text-[9px] text-gray-400 uppercase">Chars</div>
                </div>
                <div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">
                    {Math.round((variant.qualityChecks?.[0]?.confidenceScore ?? variant.qualityScore ?? 0) * 100)}%
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase">Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
