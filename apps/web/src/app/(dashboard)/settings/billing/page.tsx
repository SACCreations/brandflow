'use client';

import React from 'react';
import { 
  Check, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  ArrowUpRight, 
  BarChart3,
  Infinity as InfinityIcon,
  Loader2
} from 'lucide-react';

import { cn } from '@brandflow/ui';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';

export default function BillingSettingsPage() {
  const { toast } = useToast();
  const { data: billing, isLoading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/billing/subscription');
      return res.data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiClient.post('/billing/checkout', { priceId });
      return res.data as { url: string };
    },
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (err: any) => {
      toast({ 
        title: 'Checkout Error', 
        description: err.response?.data?.message || 'Could not initiate Stripe checkout.',
        variant: 'destructive'
      });
    }
  });

  const currentPlan = billing?.plan || 'Starter';
  const usage = billing?.usage || { tokensUsed: 0, tokenLimit: 100, brandsUsed: 0, brandLimit: 1 };
  
  const plans = [
    {
      name: 'Starter',
      price: '$15',
      priceId: 'price_starter_id', // Should match Stripe price IDs
      tokens: usage.tokenLimit,
      description: 'Perfect for small businesses starting their AI journey.',
      features: ['1 Active Brand', `${usage.tokenLimit} AI Tokens /mo`, 'Standard Media Library', 'Email Support'],
      highlight: false
    },
    {
      name: 'Pro',
      price: '$49',
      priceId: 'price_pro_id',
      tokens: 500,
      description: 'Advanced features for growing brands and startups.',
      features: ['5 Active Brands', '500 AI Tokens /mo', 'Advanced Intelligence', 'Priority Support', 'Custom Brand Tones'],
      highlight: true
    },
    {
      name: 'Elite',
      price: '$199',
      priceId: 'price_elite_id',
      tokens: 2500,
      description: 'Unlimited power for agencies and multi-brand enterprises.',
      features: ['Unlimited Brands', '2,500 AI Tokens /mo', 'API Access', 'Dedicated Success Manager', 'Custom Workflows'],
      highlight: false
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Billing & Subscription</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your subscription, tokens, and payment methods.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <BarChart3 className="h-4 w-4" />
          View Usage History
        </button>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 dark:bg-brand-500/10">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Token Usage</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{usage.tokensUsed}</span>
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tighter">/ {usage.tokenLimit} tokens</span>
          </div>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${(usage.tokensUsed / usage.tokenLimit) * 100}%` }} />
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Resets in {Math.max(1, 30 - new Date().getDate())} days</p>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-500/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Active Brands</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{usage.brandsUsed}</span>
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tighter">/ {usage.brandLimit} brands</span>
          </div>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${(usage.brandsUsed / usage.brandLimit) * 100}%` }} />
          </div>
          <p className="mt-4 text-[10px] font-bold text-amber-600 uppercase tracking-widest">{usage.brandsUsed >= usage.brandLimit ? 'Limit reached' : 'Available'}</p>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 dark:bg-emerald-500/10">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Next Payment</h3>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-black text-gray-900 dark:text-white">$15.00</span>
            <span className="text-gray-500 font-bold text-xs mt-1">Due on June 1st, 2026</span>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Auto-pay enabled</p>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose the right plan for your vision</h2>
          <p className="mt-2 text-gray-500">Scale your brand intelligence as you grow.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-[2.5rem] border p-8 transition-all duration-300 hover:shadow-2xl",
                plan.highlight 
                  ? "border-brand-200 bg-brand-50/30 dark:border-brand-500/20 dark:bg-brand-500/5 shadow-xl scale-105 z-10" 
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{plan.price}</span>
                  <span className="text-gray-400 font-bold text-sm">/mo</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => currentPlan !== plan.name && checkoutMutation.mutate(plan.priceId)}
                disabled={checkoutMutation.isPending || currentPlan === plan.name}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all",
                  currentPlan === plan.name
                    ? "bg-gray-100 text-gray-500 cursor-default dark:bg-gray-800"
                    : plan.highlight
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-700 hover:-translate-y-1"
                      : "bg-gray-900 text-white hover:bg-black dark:bg-white dark:bg-gray-900 dark:text-gray-900 dark:text-white dark:hover:bg-gray-200"
                )}
              >
                {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : currentPlan === plan.name ? 'Current Plan' : 'Switch Plan'}
                {currentPlan !== plan.name && !checkoutMutation.isPending && <ArrowUpRight className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 dark:border-gray-800 dark:bg-gray-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <CreditCard className="w-64 h-64 -rotate-12" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Payment Method</h3>
          <p className="mt-1 text-sm text-gray-500 mb-8">Manage your credit cards and billing information.</p>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-12 h-8 bg-black rounded flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">•••• •••• •••• 4242</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Expires 12/28</p>
              </div>
            </div>
            <button className="text-xs font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 transition-colors">Edit Method</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ title, value, helper, icon }: { title: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-2.5 dark:bg-gray-800">{icon}</div>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-xs text-gray-400">{helper}</div>
    </div>
  );
}

function ProgressPanel({ title, current, limit, percentage, description }: { title: string; current: number; limit: number; percentage: number; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
    <div className="rounded-2xl bg-gray-50 dark:bg-gray-950 p-5 dark:bg-gray-800/60">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-white dark:bg-gray-900 p-2 dark:bg-gray-900">{icon}</div>
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
