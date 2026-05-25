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
    <section id="basics" className="space-y-6 scroll-mt-24">
      <div className="space-y-3 mb-6 px-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white dark:bg-gray-900 text-white dark:text-gray-900 dark:text-white flex items-center justify-center font-black text-sm shadow-2xl shadow-gray-900/20 dark:shadow-white/10">01</div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none">Brand Foundation</h2>
            <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Company identity & core business details</p>
          </div>
        </div>
      </div>
      
      <Card className=" border-transparent dark:border-transparent shadow-2xl shadow-gray-200/40 dark:shadow-none  bg-white dark:bg-gray-900/40 rounded-3xl ring-1 ring-gray-200/50 dark:ring-white/10 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Brand Name</label>
            <Input {...register('name')} placeholder="e.g. Acme Corp" className="h-12 bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800/60 dark:border-gray-700/50 rounded-2xl shadow-inner text-gray-900 dark:text-white" />
            {errors['name'] && <p className="text-xs text-red-500 font-bold">{errors['name'].message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry</label>
            <Input {...register('industry')} placeholder="e.g. Technology" className="h-12 bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800/60 dark:border-gray-700/50 rounded-2xl shadow-inner text-gray-900 dark:text-white" />
            {errors['industry'] && <p className="text-xs text-red-500 font-bold">{errors['industry']?.message as string}</p>}
          </div>
        </div>
        
        <div className="space-y-2 group relative">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tagline</label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[9px] font-black uppercase tracking-widest text-brand-600 hover:bg-brand-50 rounded-lg group-hover:opacity-100 opacity-0 transition-opacity"
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
              <Sparkles className="w-3 h-3 mr-1" /> Generate with AI
            </Button>
          </div>
          <Input {...register('tagline')} placeholder="The future of branding..." className="h-12 bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800/60 dark:border-gray-700/50 rounded-2xl shadow-inner text-gray-900 dark:text-white" />
          {errors['tagline'] && <p className="text-xs text-red-500 font-bold">{errors['tagline']?.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Website</label>
            <Input {...register('website')} placeholder="https://acme.com" className="h-12 bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800/60 dark:border-gray-700/50 rounded-2xl shadow-inner text-gray-900 dark:text-white" />
            {errors['website'] && <p className="text-xs text-red-500 font-bold">{errors['website']?.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slug</label>
            <Input {...register('slug')} placeholder="acme-corp" className="h-12 bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800/60 dark:border-gray-700/50 rounded-2xl shadow-inner text-gray-900 dark:text-white" />
            {errors['slug'] && <p className="text-xs text-red-500 font-bold">{errors['slug']?.message as string}</p>}
          </div>
        </div>

        <div className="space-y-2 group relative">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[9px] font-black uppercase tracking-widest text-brand-600 hover:bg-brand-50 rounded-lg group-hover:opacity-100 opacity-0 transition-opacity"
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
              <Sparkles className="w-3 h-3 mr-1" /> Expand with AI
            </Button>
          </div>
          <Textarea 
            {...register('description')} 
            placeholder="Tell us about your brand..." 
            className="min-h-[100px] bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800/60 dark:border-gray-700/50 rounded-2xl shadow-inner"
          />
          {errors['description'] && <p className="text-xs text-red-500 font-bold">{errors['description']?.message as string}</p>}
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Contact (Internal)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 ml-1">Contact Person</label>
                  <Input {...register('contactInfo.personName')} placeholder="Full Name" className="h-10 bg-gray-50 dark:bg-gray-950/30 dark:bg-gray-800/30 rounded-xl" />
                  {(errors['contactInfo'] as any)?.personName && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).personName.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 ml-1">Phone</label>
                  <Input {...register('contactInfo.phoneNumber')} placeholder="+1..." className="h-10 bg-gray-50 dark:bg-gray-950/30 dark:bg-gray-800/30 rounded-xl" />
                  {(errors['contactInfo'] as any)?.phoneNumber && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).phoneNumber.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 ml-1">Email</label>
                  <Input {...register('contactInfo.email')} placeholder="contact@brand.com" className="h-10 bg-gray-50 dark:bg-gray-950/30 dark:bg-gray-800/30 rounded-xl" />
                  {(errors['contactInfo'] as any)?.email && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).email.message as string}</p>}
              </div>
            </div>
            <div className="space-y-1.5 mt-4">
              <label className="text-[9px] font-bold text-gray-500 ml-1">Office Address</label>
              <Input {...register('contactInfo.officeAddress')} placeholder="123 Business St, Suite 400..." className="h-10 bg-gray-50 dark:bg-gray-950/30 dark:bg-gray-800/30 rounded-xl" />
              {(errors['contactInfo'] as any)?.officeAddress && <p className="text-xs text-red-500 font-bold">{(errors['contactInfo'] as any).officeAddress.message as string}</p>}
            </div>
        </div>
      </Card>
    </section>
  );
}
