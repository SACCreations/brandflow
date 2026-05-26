'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Link2, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, useToast } from '@brandflow/ui';

interface SocialAccount {
  id: string;
  platform: string;
  name: string;
  externalId: string;
  accountType: string;
  tokenExpiresAt?: string | null;
  scopes?: string[] | null;
  _count?: {
    schedules: number;
    publishJobs: number;
  };
}

const platforms = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', color: 'bg-blue-700', desc: 'Company pages & personal profiles' },
  { id: 'instagram', label: 'Instagram', icon: 'IG', color: 'bg-pink-600', desc: 'Posts, Stories & Reels' },
  { id: 'twitter', label: 'X / Twitter', icon: 'X', color: 'bg-background', desc: 'Tweets & threads' },
  { id: 'facebook', label: 'Facebook', icon: 'f', color: 'bg-blue-600', desc: 'Pages & groups' },
  { id: 'tiktok', label: 'TikTok', icon: 'TT', color: 'bg-black', desc: 'Short-form videos & teasers' },
] as const;

export default function SocialAccountsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    platform: 'linkedin',
    accountType: 'company',
    externalId: '',
    name: '',
    accessToken: '',
    refreshToken: '',
    tokenExpiresAt: '',
    scopes: '',
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await apiClient.get('/social/accounts');
      return res.data as SocialAccount[];
    },
  });

  const accountCounts = useMemo(() => {
    return accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.platform] = (acc[account.platform] ?? 0) + 1;
      return acc;
    }, {});
  }, [accounts]);

  useEffect(() => {
    const linkedinStatus = searchParams.get('linkedin');
    const linkedinMessage = searchParams.get('linkedin_message');

    if (!linkedinStatus) {
      return;
    }

    toast({
      title: linkedinStatus === 'connected' ? 'LinkedIn connected' : 'LinkedIn connection failed',
      description: linkedinMessage || (linkedinStatus === 'connected'
        ? 'The LinkedIn account is now available for scheduling and publishing.'
        : 'Please review your LinkedIn app settings and try again.'),
      variant: linkedinStatus === 'connected' ? 'default' : 'destructive',
    });

    queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    router.replace('/publish/social');
  }, [queryClient, router, searchParams, toast]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        platform: form.platform,
        accountType: form.accountType,
        externalId: form.externalId,
        name: form.name,
        accessToken: form.accessToken,
        refreshToken: form.refreshToken || undefined,
        tokenExpiresAt: form.tokenExpiresAt ? new Date(form.tokenExpiresAt).toISOString() : undefined,
        scopes: form.scopes.split(',').map((value) => value.trim()).filter(Boolean),
      };
      const res = await apiClient.post('/social/accounts', payload);
      return res.data as SocialAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setForm((current) => ({
        ...current,
        externalId: '',
        name: '',
        accessToken: '',
        refreshToken: '',
        tokenExpiresAt: '',
        scopes: '',
      }));
      toast({
        title: 'Social account connected',
        description: 'This account is now available in the publishing workflow.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to connect account',
        description: error?.response?.data?.message || 'Please review the connection details.',
        variant: 'destructive',
      });
    },
  });

  const linkedinOauthMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.get('/social/linkedin/auth-url', {
        params: { returnTo: '/publish/social' },
      });
      return res.data as { authUrl: string };
    },
    onSuccess: ({ authUrl }) => {
      window.location.assign(authUrl);
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to start LinkedIn OAuth',
        description: error?.response?.data?.message || 'Please confirm the LinkedIn app is configured in the API environment.',
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/social/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({
        title: 'Social account disconnected',
        description: 'The account was removed from your publishing workspace.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to disconnect account',
        description: error?.response?.data?.message || 'Please cancel pending schedules first.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Social Accounts</h1>
          <p className="mt-2 text-muted-foreground">Connect publishing destinations so approved content can move from editor to queue without handoffs falling through the floorboards.</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-brand-50/70 px-4 py-3 text-sm text-brand-700 dark:border-primary/20 dark:bg-primary/100/10 dark:text-brand-300">
          LinkedIn OAuth is now wired end to end. The manual form stays here for test environments and upcoming platform connectors.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {platforms.map((platform) => (
          <div key={platform.id} className="rounded-2xl border border-border bg-background p-5 border-border bg-background">
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${platform.color} text-sm font-black text-foreground`}>
                {platform.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{platform.label}</p>
                <p className="text-xs text-muted-foreground">{platform.desc}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Connected</span>
              <span className="rounded-full bg-surface-2 px-2 py-1 font-bold text-foreground bg-surface-2 text-foreground">
                {accountCounts[platform.id] ?? 0}
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full gap-2"
              onClick={() => {
                if (platform.id === 'linkedin') {
                  linkedinOauthMutation.mutate();
                  return;
                }

                toast({
                  title: `${platform.label} is next in line`,
                  description: 'LinkedIn is the first production connector; the other OAuth flows are queued behind it.',
                });
              }}
              disabled={linkedinOauthMutation.isPending && platform.id === 'linkedin'}
            >
              {linkedinOauthMutation.isPending && platform.id === 'linkedin'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Link2 className="h-4 w-4" />}
              {platform.id === 'linkedin' ? 'Connect with OAuth' : 'Coming next'}
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Connect an account</h2>
              <p className="text-sm text-muted-foreground">Store account access securely so scheduling can use it later.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Platform">
              <select
                value={form.platform}
                onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              >
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>{platform.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Account type">
              <input
                value={form.accountType}
                onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value }))}
                placeholder="company"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>

            <Field label="Account name">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="BrandFlow LinkedIn"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>

            <Field label="External ID">
              <input
                value={form.externalId}
                onChange={(event) => setForm((current) => ({ ...current, externalId: event.target.value }))}
                placeholder="company-123456"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>

            <Field label="Access token">
              <input
                type="password"
                value={form.accessToken}
                onChange={(event) => setForm((current) => ({ ...current, accessToken: event.target.value }))}
                placeholder="Paste provider token"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>

            <Field label="Refresh token (optional)">
              <input
                type="password"
                value={form.refreshToken}
                onChange={(event) => setForm((current) => ({ ...current, refreshToken: event.target.value }))}
                placeholder="Provider refresh token"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>

            <Field label="Token expires at">
              <input
                type="datetime-local"
                value={form.tokenExpiresAt}
                onChange={(event) => setForm((current) => ({ ...current, tokenExpiresAt: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>

            <Field label="Scopes (comma-separated)">
              <input
                value={form.scopes}
                onChange={(event) => setForm((current) => ({ ...current, scopes: event.target.value }))}
                placeholder="w_member_social, r_organization_social"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary border-border bg-background text-foreground"
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || !form.name || !form.externalId || !form.accessToken}
              className="gap-2"
            >
              {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connect account
            </Button>
            <div className="text-xs text-muted-foreground">
              Tokens are encrypted at rest in the API service.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background border-border bg-background overflow-hidden">
          <div className="border-b border-border px-6 py-4 border-border">
            <h2 className="font-semibold text-foreground">Connected Accounts</h2>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No social accounts connected yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {accounts.map((account) => (
                <div key={account.id} className="space-y-4 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{account.name}</h3>
                        <span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-surface-2 text-foreground">
                          {account.platform}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{account.accountType} • {account.externalId}</div>
                    </div>
                    <button
                      onClick={() => disconnectMutation.mutate(account.id)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-red-600 dark:hover:bg-surface-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoPill icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="Schedules" value={String(account._count?.schedules ?? 0)} />
                    <InfoPill icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />} label="Publish jobs" value={String(account._count?.publishJobs ?? 0)} />
                    <InfoPill icon={<AlertCircle className="h-4 w-4 text-amber-500" />} label="Expiry" value={account.tokenExpiresAt ? new Date(account.tokenExpiresAt).toLocaleString() : 'No expiry set'} />
                    <InfoPill icon={<ShieldCheck className="h-4 w-4 text-primary" />} label="Scopes" value={account.scopes?.length ? account.scopes.join(', ') : 'Not provided'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 px-4 py-3 border-border">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm text-foreground">{value}</div>
    </div>
  );
}
