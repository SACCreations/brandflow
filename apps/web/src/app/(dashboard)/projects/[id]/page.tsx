'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Badge, Button, Card } from '@brandflow/ui';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
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

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params['id'] as string;

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data.data as ProjectDetail;
    },
    enabled: !!projectId,
  });

  const linkedBrandId = project?.metadata?.primaryBrandId;

  const { data: linkedBrand } = useQuery({
    queryKey: ['project-linked-brand', linkedBrandId],
    queryFn: async () => {
      const res = await apiClient.get(`/brands/${linkedBrandId}`);
      return res.data.data as BrandSummary;
    },
    enabled: !!linkedBrandId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <Card className="p-10 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project not found</h1>
          <p className="mt-2 text-sm text-gray-500">This project either no longer exists or you do not have access to it.</p>
        </Card>
      </div>
    );
  }

  const brandCreated = searchParams.get('brandCreated') === '1';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{project.name}</h1>
              <Badge className={project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : project.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}>
                {project.status}
              </Badge>
            </div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
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
        </div>
      </div>

      {brandCreated && (
        <Card className="border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          The new brand draft was saved and linked back to this project.
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Project snapshot</h2>
            <span className="text-xs font-medium text-gray-400">Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Budget" value={project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Start date" value={project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="End date" value={project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Not set'} />
            <InfoRow icon={<FolderKanban className="h-4 w-4" />} label="Created" value={format(new Date(project.createdAt), 'MMM d, yyyy')} />
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 p-5 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            {project.description || 'No project description yet. Add objectives, deliverables, and constraints to make this workflow smarter.'}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Linked brand</h2>
          {linkedBrand ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{linkedBrand.name}</p>
                <p className="text-xs text-gray-500">{linkedBrand.industry || 'Industry not set'}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Health score</div>
                <div className="mt-2 text-2xl font-black text-brand-600">{linkedBrand.healthScore}%</div>
              </div>
              <Link href={`/intelligence/brands/${linkedBrand.id}`}>
                <Button variant="outline" className="w-full">Open linked brand</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-gray-800">
              This project does not have a linked brand yet. Run the analyzer to create one from client or project sources.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}