'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Badge, Button, Card, useToast } from '@brandflow/ui';
import {
  ArrowLeft,
  CheckCircle2,
  Building2,
  Calendar,
  Clock3,
  DollarSign,
  FileText,
  FolderKanban,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  customerId: string | null;
  metadata?: {
    primaryBrandId?: string;
    primaryBrandName?: string;
    brandLinkedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

interface BrandSummary {
  id: string;
  name: string;
  healthScore: number;
  updatedAt: string;
  industry: string | null;
}

interface BriefSummary {
  id: string;
  campaignId: string | null;
  objective: string;
  platform: string | null;
  contentType: string | null;
  format: string | null;
  campaignTheme: string | null;
  isComplete: boolean;
  createdAt: string;
  metadata?: {
    status?: 'draft' | 'in_review' | 'approved';
  } | null;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params['id'] as string;
  const { toast } = useToast();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data as ProjectDetail;
    },
    enabled: !!projectId,
  });

  const linkedBrandId = project?.metadata?.primaryBrandId;

  const { data: linkedBrand } = useQuery({
    queryKey: ['project-linked-brand', linkedBrandId],
    queryFn: async () => {
      const res = await apiClient.get(`/brands/${linkedBrandId}`);
      return res.data as BrandSummary;
    },
    enabled: !!linkedBrandId,
  });

  const { data: latestBrief } = useQuery({
    queryKey: ['project-latest-brief', projectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/briefs/project/${projectId}/latest`);
        return (res.data ?? null) as BriefSummary | null;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null;
        }

        throw error;
      }
    },
    enabled: !!projectId,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (briefId: string) => {
      const res = await apiClient.post(`/campaigns/from-brief/${briefId}`);
      return res.data as { id: string };
    },
    onSuccess: (campaign) => {
      window.location.href = `/campaigns/${campaign.id}`;
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to create campaign',
        description: error?.response?.data?.message || 'Approve the brief first, then try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <Card className="p-10 text-center">
          <h1 className="text-xl font-bold text-foreground">Project not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This project either no longer exists or you do not have access to it.</p>
        </Card>
      </div>
    );
  }

  const brandCreated = searchParams.get('brandCreated') === '1';
  const briefSaved = searchParams.get('briefSaved') === '1';


  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <Badge className={project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : project.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-surface-2 text-muted-foreground'}>
                {project.status}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              {project.customer ? `${project.customer.name}${project.customer.company ? ` • ${project.customer.company}` : ''}` : 'Internal project'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {project.customer && (
            <Link href={`/settings/clients/${project.customer.id}`}>
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" /> View client
              </Button>
            </Link>
          )}
          <Link href={`/intelligence/brands/analyse?projectId=${project.id}${project.customerId ? `&customerId=${project.customerId}` : ''}`}>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" /> Analyse brand
            </Button>
          </Link>
          <Link href={`/create/brief?projectId=${project.id}`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" /> Create brief
            </Button>
          </Link>
          {latestBrief && (
            <Link href={`/create/brief?projectId=${project.id}&briefId=${latestBrief.id}`}>
              <Button variant="outline" className="gap-2">
                <Clock3 className="h-4 w-4" /> View latest brief
              </Button>
            </Link>
          )}
        </div>
      </div>

      {brandCreated && (
        <Card className="border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          The new brand draft was saved and linked back to this project.
        </Card>
      )}

      {briefSaved && (
        <Card className="border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          The project brief is saved and ready to guide content, campaigns, and approvals.
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Project snapshot</h2>
            <span className="text-xs font-medium text-muted-foreground">Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Budget" value={project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Start date" value={project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="End date" value={project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Not set'} />
            <InfoRow icon={<FolderKanban className="h-4 w-4" />} label="Created" value={format(new Date(project.createdAt), 'MMM d, yyyy')} />
          </div>

          <div className="mt-6 rounded-xl border border-border/60 p-5 text-sm text-muted-foreground border-border text-foreground">
            {project.description || 'No project description yet. Add objectives, deliverables, and constraints to make this workflow smarter.'}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground">Linked brand</h2>
            {linkedBrand ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{linkedBrand.name}</p>
                  <p className="text-xs text-muted-foreground">{linkedBrand.industry || 'Industry not set'}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4 border-border">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Health score</div>
                  <div className="mt-2 text-2xl font-black text-primary">{linkedBrand.healthScore}%</div>
                </div>
                <Link href={`/intelligence/brands/${linkedBrand.id}`}>
                  <Button variant="outline" className="w-full">Open linked brand</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground border-border">
                This project does not have a linked brand yet. Run the analyzer to create one from client or project sources.
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">Latest brief</h2>
              <Badge className={getBriefStatusClass(latestBrief?.metadata?.status)}>
                {formatBriefStatus(latestBrief?.metadata?.status)}
              </Badge>
            </div>

            {latestBrief ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{latestBrief.objective}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {latestBrief.platform || 'platform not set'} • {latestBrief.contentType || 'content type not set'} • {latestBrief.format || 'format not set'}
                  </p>
                </div>

                {latestBrief.campaignTheme && (
                  <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground border-border text-foreground">
                    {latestBrief.campaignTheme}
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-border/60 p-4 border-border">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Readiness</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {latestBrief.isComplete ? 'Complete and ready for delivery' : 'Still missing a few required fields'}
                    </div>
                  </div>
                  {latestBrief.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock3 className="h-5 w-5 text-amber-500" />
                  )}
                </div>

                <div className="flex gap-3">
                  {latestBrief.metadata?.status === 'approved' && !latestBrief.campaignId && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => createCampaignMutation.mutate(latestBrief.id)}
                      disabled={createCampaignMutation.isPending}
                    >
                      {createCampaignMutation.isPending ? 'Creating…' : 'Create campaign'}
                    </Button>
                  )}
                  {latestBrief.metadata?.status === 'approved' && (
                    <Link href={`/create/content?briefId=${latestBrief.id}${latestBrief.campaignId ? `&campaignId=${latestBrief.campaignId}` : ''}`} className="flex-1">
                      <Button variant="outline" className="w-full">Generate content</Button>
                    </Link>
                  )}
                  {latestBrief.campaignId && (
                    <Link href={`/campaigns/${latestBrief.campaignId}`} className="flex-1">
                      <Button variant="outline" className="w-full">Open campaign</Button>
                    </Link>
                  )}
                  <Link href={`/create/brief?projectId=${project.id}&briefId=${latestBrief.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">Open brief</Button>
                  </Link>
                  <Link href={`/create/brief?projectId=${project.id}`} className="flex-1">
                    <Button className="w-full">New version</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground border-border">
                <p>No brief exists for this project yet. Create one to define goals, audience, tone, and delivery constraints.</p>
                <Link href={`/create/brief?projectId=${project.id}`}>
                  <Button className="w-full gap-2">
                    <FileText className="h-4 w-4" /> Create first brief
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-4 border-border">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function formatBriefStatus(status?: 'draft' | 'in_review' | 'approved') {
  if (status === 'in_review') return 'In review';
  if (status === 'approved') return 'Approved';
  return 'Draft';
}

function getBriefStatusClass(status?: 'draft' | 'in_review' | 'approved') {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'in_review') return 'bg-amber-50 text-amber-700';
  return 'bg-surface-2 text-foreground';
}