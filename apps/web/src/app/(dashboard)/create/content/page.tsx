'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Badge, Button, Card, useToast } from '@brandflow/ui';
import { ArrowLeft, Loader2, Sparkles, Target } from 'lucide-react';

type ContentPlatform = 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'tiktok';
type ContentType = 'post' | 'caption' | 'ad_copy' | 'blog_snippet' | 'hook' | 'cta' | 'email' | 'article';

interface BriefContext {
  id: string;
  campaignId: string | null;
  objective: string;
  audience: string | null;
  platform: ContentPlatform | null;
  cta: string | null;
  tone: string | null;
  format: string | null;
  contentType: string | null;
  businessGoal: string | null;
  campaignTheme: string | null;
  metadata?: {
    brandId?: string | null;
    status?: 'draft' | 'in_review' | 'approved';
    deliverables?: string[];
    constraints?: string[];
  } | null;
  campaign?: {
    id: string;
    name: string;
  } | null;
}

interface BrandContext {
  id: string;
  name: string;
}

interface CampaignContext {
  id: string;
  name: string;
  status: string;
}

export default function ContentGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const briefId = searchParams.get('briefId');
  const campaignId = searchParams.get('campaignId');
  const explicitBrandId = searchParams.get('brandId');

  const [formData, setFormData] = useState({
    topic: '',
    platform: 'linkedin' as ContentPlatform,
    type: 'post' as ContentType,
    additionalContext: '',
    tone: '',
  });

  const { data: brief, isLoading: isBriefLoading } = useQuery({
    queryKey: ['content-brief-context', briefId],
    queryFn: async () => {
      const res = await apiClient.get(`/briefs/${briefId}`);
      return res.data as BriefContext;
    },
    enabled: !!briefId,
  });

  const resolvedCampaignId = campaignId ?? brief?.campaignId ?? null;
  const resolvedBrandId = explicitBrandId ?? brief?.metadata?.brandId ?? null;

  const { data: campaign, isLoading: isCampaignLoading } = useQuery({
    queryKey: ['content-campaign-context', resolvedCampaignId],
    queryFn: async () => {
      const res = await apiClient.get(`/campaigns/${resolvedCampaignId}`);
      return res.data as CampaignContext;
    },
    enabled: !!resolvedCampaignId,
  });

  const { data: brand, isLoading: isBrandLoading } = useQuery({
    queryKey: ['content-brand-context', resolvedBrandId],
    queryFn: async () => {
      const res = await apiClient.get(`/brands/${resolvedBrandId}`);
      return res.data as BrandContext;
    },
    enabled: !!resolvedBrandId,
  });

  const briefApproved = brief?.metadata?.status === 'approved';

  const readiness = useMemo(
    () => ({
      hasBrief: !!brief,
      approved: briefApproved,
      hasBrand: !!resolvedBrandId,
    }),
    [brief, briefApproved, resolvedBrandId],
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/content/generate', {
        brandId: resolvedBrandId,
        briefId: briefId ?? null,
        campaignId: resolvedCampaignId,
        platform: formData.platform,
        type: formData.type,
        topic: formData.topic.trim(),
        additionalContext: formData.additionalContext.trim() || null,
        tone: formData.tone.trim() || null,
      });

      return res.data as { content: { id: string } };
    },
    onSuccess: (result) => {
      toast({
        title: 'Content generated',
        description: 'Your draft is ready for review and editing.',
      });
      router.push(`/create/content/${result.content.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error?.response?.data?.message || 'Please review the brief and try again.',
        variant: 'destructive',
      });
    },
  });

  const backHref = resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : briefId ? `/create/brief?briefId=${briefId}` : '/projects';

  if (isBriefLoading || isCampaignLoading || isBrandLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!readiness.hasBrief || !readiness.hasBrand) {
    return (
      <div className="space-y-6">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="p-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content generation needs a linked approved brief</h1>
          <p className="mt-3 text-sm text-gray-500">
            Start from an approved project or campaign brief so the generator has brand truth, CTA guidance, and delivery constraints.
          </p>
        </Card>
      </div>
    );
  }

  const briefContext = brief!;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Generate content from brief</h1>
              <Badge className={briefApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                {briefApproved ? 'Approved brief' : 'Needs approval'}
              </Badge>
            </div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Use the approved brief as your strategy spine and let the generator do the heavy lifting without free-styling the brand.
            </p>
          </div>
        </div>

        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !briefApproved || !formData.topic.trim()} className="gap-2">
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate draft
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Topic" required>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                value={formData.topic}
                onChange={(event) => setFormData((current) => ({ ...current, topic: event.target.value }))}
                placeholder="A precise angle for this draft"
              />
            </Field>

            <Field label="Platform" required>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                value={formData.platform}
                onChange={(event) => setFormData((current) => ({ ...current, platform: event.target.value as ContentPlatform }))}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">X / Twitter</option>
                <option value="tiktok">TikTok</option>
              </select>
            </Field>

            <Field label="Content type" required>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                value={formData.type}
                onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value as ContentType }))}
              >
                <option value="post">Post</option>
                <option value="caption">Caption</option>
                <option value="ad_copy">Ad copy</option>
                <option value="blog_snippet">Blog snippet</option>
                <option value="hook">Hook</option>
                <option value="cta">CTA</option>
                <option value="email">Email</option>
                <option value="article">Article</option>
              </select>
            </Field>

            <Field label="Tone override">
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                value={formData.tone}
                onChange={(event) => setFormData((current) => ({ ...current, tone: event.target.value }))}
                placeholder={brief?.tone || 'Optional'}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Additional context">
                <textarea
                  className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none ring-0 transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={formData.additionalContext}
                  onChange={(event) => setFormData((current) => ({ ...current, additionalContext: event.target.value }))}
                  placeholder="Add campaign specifics, offers, hooks, or launch timing that should influence the draft."
                />
              </Field>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Brief context</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <ContextItem label="Objective" value={briefContext.objective} />
              <ContextItem label="Audience" value={briefContext.audience || 'Not set'} />
              <ContextItem label="CTA" value={briefContext.cta || 'Not set'} />
              <ContextItem label="Brand" value={brand?.name || 'Not set'} />
              <ContextItem label="Campaign" value={campaign?.name || briefContext.campaign?.name || 'Standalone generation'} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Guardrails</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              {(briefContext.metadata?.deliverables ?? []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
              {(briefContext.metadata?.constraints ?? []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
              {(briefContext.metadata?.deliverables?.length ?? 0) === 0 && (briefContext.metadata?.constraints?.length ?? 0) === 0 && (
                <li>No explicit deliverables or constraints recorded on this brief.</li>
              )}
            </ul>
          </Card>

          {!briefApproved && (
            <Card className="border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
              This brief is not approved yet. Approve it in the brief composer before generating content.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-1 font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
