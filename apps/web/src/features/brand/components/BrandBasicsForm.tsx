'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, Input, Textarea, Button, useToast } from '@brandflow/ui';
import { Sparkles } from 'lucide-react';

export function BrandBasicsForm({ isSectionVisible, values }: { isSectionVisible: (id: string) => boolean, values: any }) {
  const { register, setValue, formState: { errors } } = useFormContext();
  const { toast } = useToast();

  if (!isSectionVisible('basics')) return null;

  const buildTaglineSuggestion = (data: any): string | null => {
    const candidate = [data.tagline, data.identity?.promise, data.positioning]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim())[0];

    if (!candidate) return null;

    const firstSentence = candidate.split(/(?<=[.!?])\s+/)[0]?.trim() || candidate;
    return firstSentence.length <= 120 ? firstSentence : `${firstSentence.slice(0, 117).trimEnd()}...`;
  };

  const buildDescriptionSuggestion = (data: any): string | null => {
    const parts = [data.description, data.positioning, data.identity?.mission, data.differentiators]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());

    if (parts.length === 0) return null;

    return Array.from(new Set(parts)).join(' ').slice(0, 500);
  };

  return (
    <section id="basics" className="space-y-6 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-foreground shadow-xl shadow-brand-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Brand Foundation</h2>
            <p className="text-sm font-medium text-muted-foreground">Company identity & core business details</p>
          </div>
        </div>
      </div>
      
      <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">Brand Name <span className="text-red-500">*</span></label>
            <Input {...register('name')} placeholder="e.g. Acme Corp" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-primary/20 transition-all" />
            {errors['name'] && <p className="text-xs text-red-500 font-bold">{errors['name'].message as string}</p>}
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">Industry <span className="text-red-500">*</span></label>
            <Input {...register('industry')} placeholder="e.g. Technology" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-primary/20 transition-all" />
            {errors['industry'] && <p className="text-xs text-red-500 font-bold">{errors['industry']?.message as string}</p>}
          </div>
        </div>
        
        <div className="space-y-3 group relative bg-brand-50/30 dark:bg-primary/100/5 p-6 rounded-3xl border border-brand-100/50 dark:border-primary/10 transition-colors hover:bg-brand-50/50 dark:hover:bg-primary/100/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">Tagline</label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-8 rounded-full border-primary/20 dark:border-brand-800 text-primary bg-background/50 bg-background/50 backdrop-blur hover:bg-brand-100 transition-all"
              onClick={() => {
                const suggestion = buildTaglineSuggestion(values);
                if (!suggestion) {
                  toast({ title: 'AI Copilot', description: 'Not enough analysed brand context yet to suggest a tagline.' });
                  return;
                }
                toast({ title: 'AI Copilot', description: 'Generated a tagline from the analysed brand evidence already in the form.' });
                setValue('tagline', suggestion, { shouldDirty: true });
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" /> Generate with AI
            </Button>
          </div>
          <Input {...register('tagline')} placeholder="The future of branding..." className="h-14 bg-background/80 bg-background/80 border-primary/10 border-border rounded-2xl text-base shadow-sm focus-visible:ring-primary/20" />
          {errors['tagline'] && <p className="text-xs text-red-500 font-bold">{errors['tagline']?.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website</label>
            <Input {...register('website')} placeholder="https://acme.com" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-primary/20 transition-all" />
            {errors['website'] && <p className="text-xs text-red-500 font-bold">{errors['website']?.message as string}</p>}
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slug</label>
            <Input {...register('slug')} placeholder="acme-corp" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-primary/20 transition-all" />
            {errors['slug'] && <p className="text-xs text-red-500 font-bold">{errors['slug']?.message as string}</p>}
          </div>
        </div>

        <div className="space-y-3 group relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-8 rounded-full text-primary hover:bg-primary/10 transition-all"
              onClick={() => {
                const suggestion = buildDescriptionSuggestion(values);
                if (!suggestion) {
                  toast({ title: 'AI Copilot', description: 'Not enough analysed brand context yet to expand the description.' });
                  return;
                }
                toast({ title: 'AI Copilot', description: 'Expanded the description using analysed brand evidence already present in the form.' });
                setValue('description', suggestion, { shouldDirty: true });
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-2" /> Expand with AI
            </Button>
          </div>
          <Textarea 
            {...register('description')} 
            placeholder="Tell us about your brand..." 
            className="min-h-[140px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-4 shadow-sm focus-visible:ring-primary/20 transition-all leading-relaxed"
          />
          {errors['description'] && <p className="text-xs text-red-500 font-bold">{errors['description']?.message as string}</p>}
        </div>

        <div className="pt-8 border-t border-border/50 dark:border-gray-800/50 space-y-6">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Contact (Internal)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Input {...register('contactInfo.personName')} placeholder="Full Name" className="h-12 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-xl" />
                  {(errors['contactInfo'] as any)?.personName && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).personName.message as string}</p>}
              </div>
              <div className="space-y-2">
                  <Input {...register('contactInfo.phoneNumber')} placeholder="Phone (+1...)" className="h-12 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-xl" />
                  {(errors['contactInfo'] as any)?.phoneNumber && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).phoneNumber.message as string}</p>}
              </div>
              <div className="space-y-2">
                  <Input {...register('contactInfo.email')} placeholder="Email Address" className="h-12 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-xl" />
                  {(errors['contactInfo'] as any)?.email && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).email.message as string}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Input {...register('contactInfo.officeAddress')} placeholder="Office Address (123 Business St, Suite 400...)" className="h-12 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-xl" />
              {(errors['contactInfo'] as any)?.officeAddress && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).officeAddress.message as string}</p>}
            </div>
        </div>
      </Card>
    </section>
  );
}
