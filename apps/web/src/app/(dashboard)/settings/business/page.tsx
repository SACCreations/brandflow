'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Globe, Clock, Upload, Save, Shield, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  website?: string;
  timezone?: string;
  logoUrl?: string;
  description?: string;
  defaultLanguage?: string;
}

export default function BusinessSettingsPage() {
  const queryClient = useQueryClient();
  const business = useAuthStore((s) => s.business);

  const { data: profile, isLoading } = useQuery<BusinessProfile>({
    queryKey: ['business', 'profile'],
    queryFn: async () => {
      const res = await apiClient.get('/business/profile');
      return res.data;
    },
  });

  const [form, setForm] = useState<Partial<BusinessProfile>>({});

  const currentValues = { ...profile, ...form };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<BusinessProfile>) => {
      await apiClient.patch('/business/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      setForm({});
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(form).length === 0) return;
    updateMutation.mutate(form);
  };

  const updateField = (field: keyof BusinessProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-3 bg-surface-2" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-surface-3" />
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-surface-3" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Business Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your workspace profile and preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Section */}
        <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 dark:bg-brand-900/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Workspace Profile</h2>
              <p className="text-sm text-muted-foreground">Basic information about your business</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Business Name</label>
              <input
                type="text"
                value={currentValues.name ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20/20 border-border bg-surface-2 text-foreground"
                placeholder="Your business name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Industry</label>
              <select
                value={currentValues.industry ?? ''}
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20/20 border-border bg-surface-2 text-foreground"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="marketing">Marketing & Advertising</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="finance">Finance & Banking</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="realestate">Real Estate</option>
                <option value="food">Food & Beverage</option>
                <option value="fashion">Fashion & Beauty</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Website</label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  value={currentValues.website ?? ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20/20 border-border bg-surface-2 text-foreground"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Timezone</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <select
                  value={currentValues.timezone ?? 'UTC'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20/20 border-border bg-surface-2 text-foreground"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (US)</option>
                  <option value="America/Chicago">Central Time (US)</option>
                  <option value="America/Los_Angeles">Pacific Time (US)</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris / Berlin</option>
                  <option value="Asia/Dubai">Dubai</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Riyadh">Riyadh</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={currentValues.description ?? ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20/20 border-border bg-surface-2 text-foreground"
                placeholder="Brief description of your business"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-900/20">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
              <p className="text-sm text-muted-foreground">Default settings for your workspace</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default Language</label>
              <select
                value={currentValues.defaultLanguage ?? 'en'}
                onChange={(e) => updateField('defaultLanguage', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20/20 border-border bg-surface-2 text-foreground"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Workspace Slug</label>
              <input
                type="text"
                value={currentValues.slug ?? ''}
                disabled
                className="w-full rounded-xl border border-border bg-surface-1 bg-background px-4 py-2.5 text-sm text-muted-foreground border-border bg-surface-2/50 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Used in URLs. Cannot be changed.</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={Object.keys(form).length === 0 || updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>

          {updateMutation.isSuccess && (
            <span className="text-sm font-medium text-emerald-600 animate-in fade-in duration-300">
              Settings saved successfully
            </span>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-red-100 p-2.5 dark:bg-red-900/30">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">Danger Zone</h2>
            <p className="text-sm text-red-600/70 dark:text-red-400/70">Irreversible actions</p>
          </div>
        </div>
        <p className="mb-4 text-sm text-red-700/80 dark:text-red-300/80">
          Deleting your workspace will permanently remove all brands, content, knowledge, and settings. This cannot be undone.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-background px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
              // Handle workspace deletion
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete Workspace
        </button>
      </div>
    </div>
  );
}
