'use client';

import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  BadgeCheck,
  CreditCard,
  Coins,
  Users,
  Sparkles,
  Building2,
  FolderKanban,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface BillingSummaryResponse {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    seatLimit: number;
    tokenBudget: number;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  usage: {
    tokensUsed: number;
    tokenBudget: number;
    tokenUsagePercentage: number;
    costCents: number;
    inputTokens: number;
    outputTokens: number;
    seatsUsed: number;
    seatLimit: number;
    seatUsagePercentage: number;
    contentCreatedThisPeriod: number;
  };
  resources: {
    brands: number;
    customers: number;
    projects: number;
  };
}

export default function BillingSettingsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: BillingSummaryResponse }>('/business/billing');
      return res.data.data;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
        Billing data is temporarily unavailable. Please refresh and try again.
      </div>
    );
  }

  const subscription = data.subscription;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Billing & Subscription</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Live plan, usage, and AI spend for <span className="font-semibold text-gray-700 dark:text-gray-300">{data.workspace.name}</span>.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Current cycle</div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-white">
            {subscription?.currentPeriodEnd
              ? `Ends ${format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}`
              : 'No billing cycle set'}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-1">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plan Status</h2>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Workspace subscription and entitlement state.</p>
            </div>
            <StatusBadge status={subscription?.status ?? 'inactive'} />
          </div>

          {subscription ? (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Current plan</div>
                <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{formatLabel(subscription.plan)}</div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subscription.currentPeriodEnd
                    ? `${formatDistanceToNow(new Date(subscription.currentPeriodEnd), { addSuffix: true })}`
                    : 'Billing period unavailable'}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Stripe linkage</div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {subscription.stripeCustomerId && subscription.stripeSubscriptionId
                    ? 'Connected'
                    : 'Not connected yet — local billing mode'}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Stripe checkout and self-serve plan switching are the next billing milestones, but your live usage tracking is already here.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              No subscription record found for this workspace yet.
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <UsageCard title="Monthly AI Spend" value={formatCurrency(data.usage.costCents)} helper="Current month cost events" icon={<Coins className="h-5 w-5 text-amber-500" />} />
            <UsageCard title="Content Created" value={String(data.usage.contentCreatedThisPeriod)} helper="Generated this period" icon={<Sparkles className="h-5 w-5 text-brand-500" />} />
            <UsageCard title="Seats in Use" value={`${data.usage.seatsUsed}/${data.usage.seatLimit || 0}`} helper="Workspace members" icon={<Users className="h-5 w-5 text-blue-500" />} />
            <UsageCard title="Token Budget" value={`${data.usage.tokenUsagePercentage}%`} helper={`${formatCompactNumber(data.usage.tokensUsed)} used`} icon={<BadgeCheck className="h-5 w-5 text-emerald-500" />} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ProgressPanel title="AI Token Usage" current={data.usage.tokensUsed} limit={data.usage.tokenBudget} percentage={data.usage.tokenUsagePercentage} description="Combined input and output tokens recorded this billing period." />
            <ProgressPanel title="Seat Utilization" current={data.usage.seatsUsed} limit={data.usage.seatLimit} percentage={data.usage.seatUsagePercentage} description="How close the workspace is to its seat limit." />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Workspace Footprint</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <FootprintCard label="Brands" value={data.resources.brands} icon={<Building2 className="h-5 w-5 text-brand-600" />} />
              <FootprintCard label="Clients" value={data.resources.customers} icon={<Briefcase className="h-5 w-5 text-blue-600" />} />
              <FootprintCard label="Projects" value={data.resources.projects} icon={<FolderKanban className="h-5 w-5 text-emerald-600" />} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plan-aware next steps</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Your billing screen is now driven by live usage and subscription data. The next step is hooking this into self-serve checkout, entitlements, and upgrade prompts when token or seat thresholds are crossed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ title, value, helper, icon }: { title: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">{icon}</div>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-xs text-gray-400">{helper}</div>
    </div>
  );
}

function ProgressPanel({ title, current, limit, percentage, description }: { title: string; current: number; limit: number; percentage: number; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900 dark:text-white">{percentage}%</div>
          <div className="text-xs text-gray-400">{formatCompactNumber(current)} / {formatCompactNumber(limit)}</div>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full transition-all duration-700 ${percentage >= 85 ? 'bg-red-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
    </div>
  );
}

function FootprintCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/60">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-white p-2 dark:bg-gray-900">{icon}</div>
        <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      </div>
      <div className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'trialing'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-600';

  return <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tone}`}>{formatLabel(status)}</span>;
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valueInCents / 100);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatLabel(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}
