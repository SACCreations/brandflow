'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Badge, Button, Card, useToast } from '@brandflow/ui';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import type { BriefWorkflowMetadata } from '@brandflow/shared';

type BriefPlatform = 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'tiktok' | '';
type BriefFormat = 'post' | 'carousel' | 'story' | 'reel' | 'article' | 'newsletter' | '';
type BriefContentType = 'organic' | 'ad' | 'blog' | '';
type BriefStatus = BriefWorkflowMetadata['status'];

interface ProjectContext {
  id: string;
  name: string;
  description: string | null;
  customerId: string | null;
  metadata?: {
    primaryBrandId?: string;
    primaryBrandName?: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

interface BrandContext {
  id: string;
  name: string;
  positioning: string | null;
  audience: string | null;
  tone: string[] | string | null;
  governance?: {
    ctaPreferences?: string[] | string;
  } | null;
}

interface BriefRecord {
  id: string;
  campaignId: string | null;
  objective: string;
  audience: string | null;
  platform: Exclude<BriefPlatform, ''> | null;
  cta: string | null;
  tone: string | null;
  format: Exclude<BriefFormat, ''> | null;
  contentType: Exclude<BriefContentType, ''> | null;
  businessGoal: string | null;
  campaignTheme: string | null;
  isComplete: boolean;
  metadata?: Partial<BriefWorkflowMetadata> | null;
  createdAt: string;
}

interface BriefFormState {
  objective: string;
  audience: string;
  platform: BriefPlatform;
  cta: string;
  tone: string;
  format: BriefFormat;
  contentType: BriefContentType;
  businessGoal: string;
  campaignTheme: string;
  status: BriefStatus;
  deliverablesText: string;
  constraintsText: string;
}

const emptyForm: BriefFormState = {
  objective: '',
  audience: '',
  platform: 'linkedin',
  cta: '',
  tone: '',
  format: 'post',
  contentType: 'organic',
  businessGoal: '',
  campaignTheme: '',
  status: 'draft',
  deliverablesText: '',
  constraintsText: '',
};

export default function BriefBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const projectId = searchParams.get('projectId');
  const briefId = searchParams.get('briefId');
  const campaignId = searchParams.get('campaignId');
  const initializedRef = useRef(false);
  const [formData, setFormData] = useState<BriefFormState>(emptyForm);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['brief-project-context', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data as ProjectContext;
    },
    enabled: !!projectId,
  });

  const { data: existingBrief, isLoading: isBriefLoading } = useQuery({
    queryKey: ['brief-record', briefId],
    queryFn: async () => {
      const response = await apiClient.get(`/briefs/${briefId}`);
      return response.data as BriefRecord;
    },
    enabled: !!briefId,
  });

  const linkedBrandId = project?.metadata?.primaryBrandId ?? existingBrief?.metadata?.brandId ?? null;

  const { data: linkedBrand, isLoading: isBrandLoading } = useQuery({
    queryKey: ['brief-linked-brand', linkedBrandId],
    queryFn: async () => {
      const response = await apiClient.get(`/brands/${linkedBrandId}`);
      return response.data as BrandContext;
    },
    enabled: !!linkedBrandId,
  });

  useEffect(() => {
    if (initializedRef.current) return;
    if (briefId && isBriefLoading) return;
    if (projectId && isProjectLoading) return;
    if (linkedBrandId && isBrandLoading) return;

    setFormData(buildInitialForm(existingBrief, project, linkedBrand));
    initializedRef.current = true;
  }, [briefId, existingBrief, isBriefLoading, projectId, isProjectLoading, project, linkedBrandId, isBrandLoading, linkedBrand]);

  const completionItems = useMemo(
    () => [
      { label: 'Objective', ready: !!formData.objective.trim() },
      { label: 'Audience', ready: !!formData.audience.trim() },
      { label: 'Platform', ready: !!formData.platform },
      { label: 'CTA', ready: !!formData.cta.trim() },
      { label: 'Content type', ready: !!formData.contentType },
      { label: 'Business goal', ready: !!formData.businessGoal.trim() },
    ],
    [formData],
  );

  const readyCount = completionItems.filter((item) => item.ready).length;
  const isReady = readyCount === completionItems.length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        campaignId: campaignId ?? existingBrief?.campaignId ?? null,
        objective: formData.objective.trim(),
        audience: normalizeOptionalField(formData.audience),
        platform: formData.platform || null,
        cta: normalizeOptionalField(formData.cta),
        tone: normalizeOptionalField(formData.tone),
        format: formData.format || null,
        contentType: formData.contentType || null,
        businessGoal: normalizeOptionalField(formData.businessGoal),
        campaignTheme: normalizeOptionalField(formData.campaignTheme),
        metadata: {
          projectId: projectId ?? existingBrief?.metadata?.projectId ?? null,
          customerId: project?.customerId ?? existingBrief?.metadata?.customerId ?? null,
          brandId: linkedBrandId ?? existingBrief?.metadata?.brandId ?? null,
          status: formData.status,
          source: projectId ? 'project' : campaignId ? 'campaign' : 'manual',
          deliverables: toLines(formData.deliverablesText),
          constraints: toLines(formData.constraintsText),
        },
      };

      if (briefId) {
        const response = await apiClient.patch(`/briefs/${briefId}`, payload);
        return response.data as BriefRecord;
      }

      const response = await apiClient.post('/briefs', payload);
      return response.data as BriefRecord;
    },
    onSuccess: () => {
      toast({
        title: briefId ? 'Brief updated' : 'Brief created',
        description: 'The project brief is saved and ready to guide delivery.',
      });

      if (projectId) {
        router.push(`/projects/${projectId}?briefSaved=1`);
        return;
      }

      if (campaignId) {
        router.push(`/campaigns/${campaignId}`);
        return;
      }

      router.push('/projects');
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to save brief',
        description: error?.response?.data?.message || 'Please check the form and try again.',
        variant: 'destructive',
      });
    },
  });

  const backHref = projectId ? `/projects/${projectId}` : campaignId ? `/campaigns/${campaignId}` : '/projects';

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {briefId ? 'Edit project brief' : 'Project brief composer'}
              </h1>
              <Badge className={badgeClassMap[formData.status]}>{formatStatus(formData.status)}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              Turn project and brand context into execution-ready direction before content generation starts doing jazz hands.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formData.objective.trim()}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            {briefId ? 'Update brief' : 'Save brief'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Objective" required>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-primary border-border bg-background text-foreground"
                value={formData.objective}
                onChange={(event) => updateField(setFormData, 'objective', event.target.value)}
                placeholder="What business outcome should this brief drive?"
              />
            </Field>

            <Field label="Audience" required>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-primary border-border bg-background text-foreground"
                value={formData.audience}
                onChange={(event) => updateField(setFormData, 'audience', event.target.value)}
                placeholder="Who should this message persuade or activate?"
              />
            </Field>

            <Field label="Platform" required>
              <select
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.platform}
                onChange={(event) => updateField(setFormData, 'platform', event.target.value as BriefPlatform)}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">X / Twitter</option>
                <option value="tiktok">TikTok</option>
              </select>
            </Field>

            <Field label="Format">
              <select
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.format}
                onChange={(event) => updateField(setFormData, 'format', event.target.value as BriefFormat)}
              >
                <option value="post">Post</option>
                <option value="carousel">Carousel</option>
                <option value="story">Story</option>
                <option value="reel">Reel</option>
                <option value="article">Article</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </Field>

            <Field label="Primary CTA" required>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.cta}
                onChange={(event) => updateField(setFormData, 'cta', event.target.value)}
                placeholder="Book a discovery call"
              />
            </Field>

            <Field label="Business goal" required>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.businessGoal}
                onChange={(event) => updateField(setFormData, 'businessGoal', event.target.value)}
                placeholder="Generate qualified pipeline"
              />
            </Field>

            <Field label="Tone">
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.tone}
                onChange={(event) => updateField(setFormData, 'tone', event.target.value)}
                placeholder="Confident, sharp, human"
              />
            </Field>

            <Field label="Content type" required>
              <select
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.contentType}
                onChange={(event) => updateField(setFormData, 'contentType', event.target.value as BriefContentType)}
              >
                <option value="organic">Organic</option>
                <option value="ad">Ad</option>
                <option value="blog">Blog</option>
              </select>
            </Field>

            <Field label="Campaign theme">
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.campaignTheme}
                onChange={(event) => updateField(setFormData, 'campaignTheme', event.target.value)}
                placeholder="Authority through measurable brand systems"
              />
            </Field>

            <Field label="Workflow status">
              <select
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
                value={formData.status}
                onChange={(event) => updateField(setFormData, 'status', event.target.value as BriefStatus)}
              >
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                <option value="approved">Approved</option>
              </select>
            </Field>

            <Field label="Deliverables">
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-primary border-border bg-background text-foreground"
                value={formData.deliverablesText}
                onChange={(event) => updateField(setFormData, 'deliverablesText', event.target.value)}
                placeholder={'One deliverable per line\nLinkedIn thought-leadership post\nExecutive carousel'}
              />
            </Field>

            <Field label="Constraints">
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-primary border-border bg-background text-foreground"
                value={formData.constraintsText}
                onChange={(event) => updateField(setFormData, 'constraintsText', event.target.value)}
                placeholder={'One constraint per line\nAvoid unsupported claims\nMention implementation timeline'}
              />
            </Field>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Workflow context</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground text-foreground">
              <ContextRow icon={<FolderKanban className="h-4 w-4" />} label="Project" value={project?.name || 'Standalone brief'} href={projectId ? `/projects/${projectId}` : undefined} />
              <ContextRow icon={<Building2 className="h-4 w-4" />} label="Client" value={project?.customer?.name || 'Not linked'} href={project?.customer ? `/settings/clients/${project.customer.id}` : undefined} />
              <ContextRow icon={<Sparkles className="h-4 w-4" />} label="Brand" value={linkedBrand?.name || 'No linked brand yet'} href={linkedBrand ? `/intelligence/brands/${linkedBrand.id}` : projectId ? `/intelligence/brands/analyse?projectId=${projectId}${project?.customerId ? `&customerId=${project.customerId}` : ''}` : undefined} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Brief readiness</h2>
            </div>
            <div className="mt-4 space-y-3">
              {completionItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 border-border">
                  <span className="text-sm text-foreground">{item.label}</span>
                  {item.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Needed</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-surface-1 bg-background px-4 py-3 text-sm text-muted-foreground bg-background text-foreground">
              {readyCount}/{completionItems.length} delivery inputs ready.
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Prefill notes</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground text-foreground">
              <li>Project context seeds the objective and theme.</li>
              <li>Client + linked brand fill audience, tone, and CTA hints.</li>
              <li>Status keeps handoff clean from draft to approval.</li>
            </ul>
            {!linkedBrand && projectId && (
              <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
                This project still needs a linked brand for the strongest prefill. You can save the brief now, but the analyzer would make it sharper.
              </div>
            )}
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push(backHref)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formData.objective.trim()}>
              {saveMutation.isPending ? 'Saving…' : isReady ? 'Save & hand off' : 'Save draft'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildInitialForm(
  brief: BriefRecord | undefined,
  project: ProjectContext | undefined,
  brand: BrandContext | undefined,
): BriefFormState {
  if (brief) {
    return {
      objective: brief.objective,
      audience: brief.audience || '',
      platform: brief.platform ?? 'linkedin',
      cta: brief.cta || '',
      tone: brief.tone || '',
      format: brief.format ?? 'post',
      contentType: brief.contentType ?? 'organic',
      businessGoal: brief.businessGoal || '',
      campaignTheme: brief.campaignTheme || '',
      status: brief.metadata?.status ?? 'draft',
      deliverablesText: (brief.metadata?.deliverables ?? []).join('\n'),
      constraintsText: (brief.metadata?.constraints ?? []).join('\n'),
    };
  }

  const inferredTone = Array.isArray(brand?.tone)
    ? brand?.tone.slice(0, 2).join(', ')
    : typeof brand?.tone === 'string'
      ? brand.tone
      : '';

  const ctaPreference = Array.isArray(brand?.governance?.ctaPreferences)
    ? brand.governance.ctaPreferences[0]
    : typeof brand?.governance?.ctaPreferences === 'string'
      ? brand.governance.ctaPreferences
      : '';

  return {
    ...emptyForm,
    objective: project?.description
      ? `Drive progress for ${project.name}: ${project.description}`
      : project
        ? `Drive measurable growth for ${project.name}`
        : '',
    audience: (typeof brand?.audience === 'object' && brand?.audience !== null ? (brand.audience as any).primaryAudience : brand?.audience) || project?.customer?.company || project?.customer?.name || '',
    cta: ctaPreference || '',
    tone: inferredTone,
    campaignTheme: brand?.positioning || project?.name || '',
    businessGoal: project ? `Move ${project.name} toward its next client milestone.` : '',
  };
}

function normalizeOptionalField(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function updateField<K extends keyof BriefFormState>(
  setter: React.Dispatch<React.SetStateAction<BriefFormState>>,
  key: K,
  value: BriefFormState[K],
) {
  setter((current) => ({ ...current, [key]: value }));
}

function formatStatus(status: BriefStatus) {
  return status === 'in_review' ? 'In review' : status === 'approved' ? 'Approved' : 'Draft';
}

function ContextRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 border-border">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-sm font-medium text-foreground">{value}</div>
        </div>
      </div>
      {href ? <span className="text-xs font-semibold text-primary">Open</span> : null}
    </div>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

const badgeClassMap: Record<BriefStatus, string> = {
  draft: 'bg-surface-2 text-foreground',
  in_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
};
