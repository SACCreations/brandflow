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
  FolderKanban,
  Globe,
  Loader2,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  status: string;
  metadata?: {
    primaryBrandId?: string;
    primaryBrandName?: string;
    brandLinkedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    projects: number;
  };
  projects: Array<{
    id: string;
    name: string;
    status: string;
    endDate: string | null;
    updatedAt: string;
  }>;
}

interface BrandSummary {
  id: string;
  name: string;
  healthScore: number;
  updatedAt: string;
  industry: string | null;
}

export default function ClientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params['id'] as string;

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => {
      const res = await apiClient.get(`/customers/${clientId}`);
      return res.data as ClientDetail;
    },
    enabled: !!clientId,
  });

  const linkedBrandId = client?.metadata?.primaryBrandId;

  const { data: linkedBrand } = useQuery({
    queryKey: ['client-linked-brand', linkedBrandId],
    queryFn: async () => {
      const res = await apiClient.get(`/brands/${linkedBrandId}`);
      return res.data as BrandSummary;
    },
    enabled: !!linkedBrandId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="space-y-6">
        <Link href="/settings/clients" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Link>
        <Card className="p-10 text-center">
          <h1 className="text-xl font-bold text-foreground">Client not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This client either no longer exists or you do not have access to it.</p>
        </Card>
      </div>
    );
  }

  const brandCreated = searchParams.get('brandCreated') === '1';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href="/settings/clients" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to clients
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{client.name}</h1>
              <Badge className={client.status === 'active' ? 'bg-emerald-50 text-emerald-600' : client.status === 'lead' ? 'bg-amber-50 text-amber-600' : 'bg-surface-2 text-muted-foreground'}>
                {client.status}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              {client.company || 'Private client'} • {client._count.projects} linked project{client._count.projects === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/projects?customerId=${client.id}&open=new`}>
            <Button variant="outline" className="gap-2">
              <FolderKanban className="h-4 w-4" /> New project
            </Button>
          </Link>
          <Link href={`/intelligence/brands/analyse?customerId=${client.id}`}>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" /> Analyse brand
            </Button>
          </Link>
        </div>
      </div>

      {brandCreated && (
        <Card className="border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          Brand analysis was saved and linked back to this client. Nice little workflow loop, neatly tied with a bow.
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Client overview</h2>
            <span className="text-xs font-medium text-muted-foreground">Updated {formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={client.email || 'Not provided'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={client.phone || 'Not provided'} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company" value={client.company || 'Private client'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={format(new Date(client.createdAt), 'MMM d, yyyy')} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground">Primary brand</h2>
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
              No brand linked yet. Launch the analyzer to create a primary brand profile for this client.
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent projects</h2>
          <Link href={`/projects?customerId=${client.id}`} className="text-sm font-semibold text-primary hover:text-brand-700">
            View all
          </Link>
        </div>

        {client.projects.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {client.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-2xl border border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg border-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{project.name}</p>
                  <Badge className={project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : project.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-surface-2 text-muted-foreground'}>
                    {project.status}
                  </Badge>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {project.endDate ? `Deadline ${format(new Date(project.endDate), 'MMM d, yyyy')}` : 'No deadline set'}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground border-border">
            No projects yet for this client.
          </div>
        )}
      </Card>
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