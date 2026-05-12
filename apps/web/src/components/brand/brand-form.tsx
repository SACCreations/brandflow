'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBrandSchema, type CreateBrandDto } from '@brandflow/shared';
import { 
  Card, 
  Input, 
  Button, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Badge,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
  useToast
} from '@brandflow/ui';
import { 
  Building2, 
  Palette, 
  Type, 
  ShieldCheck, 
  Globe, 
  Users, 
  Layout, 
  MessageSquare,
  Sparkles,
  Plus,
  X,
  PlusCircle,
  HelpCircle,
  FileText,
  Download,
  Settings,
  Info,
  Maximize2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ColorGovernance } from './color-governance';
import { TypographyGovernance } from './typography-governance';
import { GovernanceGovernance } from './governance-governance';
import { LogoAssetCard } from './logo-asset-card';
import { FileUploader } from './file-uploader';

interface BrandFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onDataChange: (data: any) => void;
  lastSaved?: Date | null;
}

const sanitizeInitialData = (data: any) => {
  if (!data) return undefined;
  
  // Recursively convert nulls to empty strings
  const clean = (obj: any): any => {
    if (obj === null) return '';
    if (Array.isArray(obj)) return obj.map(clean);
    if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = clean(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  const cleaned = clean(data);
  
  // Ensure default structures exist
  return {
    ...cleaned,
    status: cleaned.status || 'published',
    tone: Array.isArray(cleaned.tone) ? cleaned.tone : [],
    visualRules: {
      ...cleaned.visualRules,
      primaryColor: cleaned.visualRules?.primaryColor || '#6366f1',
      secondaryColor: cleaned.visualRules?.secondaryColor || '#a855f7',
      accentColor: cleaned.visualRules?.accentColor || '#f59e0b',
      headingFont: cleaned.visualRules?.headingFont || 'Inter',
      bodyFont: cleaned.visualRules?.bodyFont || 'Inter',
      fontFamily: cleaned.visualRules?.fontFamily || 'Inter',
      logoUrls: Array.isArray(cleaned.visualRules?.logoUrls) ? cleaned.visualRules.logoUrls : []
    },
    designTokens: {
      ...cleaned.designTokens,
      borderRadius: cleaned.designTokens?.borderRadius || '0.5rem',
      shadows: cleaned.designTokens?.shadows || 'sm',
      spacing: cleaned.designTokens?.spacing || 'comfortable',
    },
    assets: {
      ...cleaned.assets,
      documents: Array.isArray(cleaned.assets?.documents) ? cleaned.assets.documents : []
    },
    identity: {
      values: Array.isArray(cleaned.identity?.values) ? cleaned.identity.values : []
    },
    governance: {
      ...cleaned.governance,
      bannedPhrases: Array.isArray(cleaned.governance?.bannedPhrases) ? cleaned.governance.bannedPhrases : [],
      requiredPhrases: Array.isArray(cleaned.governance?.requiredPhrases) ? cleaned.governance.requiredPhrases : [],
      requiredDisclaimer: cleaned.governance?.requiredDisclaimer || ''
    }
  };
};

export function BrandForm({ initialData, onSubmit, isLoading, onDataChange, lastSaved }: BrandFormProps) {
  const { toast } = useToast();
  const form = useForm<any>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: sanitizeInitialData(initialData) || {
      name: '',
      status: 'published',
      tone: [],
      visualRules: {
        primaryColor: '#6366f1',
        secondaryColor: '#a855f7',
        fontFamily: 'Inter',
        logoUrls: [
          { url: '', type: 'primary', name: 'Primary Logo' },
          { url: '', type: 'dark', name: 'Dark Variant' }
        ]
      },
      identity: {
        values: []
      },
      governance: {
        bannedPhrases: [],
        requiredPhrases: []
      }
    }
  });

  const { watch, setValue, register, handleSubmit, reset, formState: { errors, isDirty } } = form;

  const values = watch();
  const lastValuesRef = React.useRef(JSON.stringify(values));

  // Explicitly register custom fields that don't use native inputs
  React.useEffect(() => {
    register('visualRules.primaryColor');
    register('visualRules.secondaryColor');
    register('visualRules.accentColor');
    register('visualRules.headingFont');
    register('visualRules.bodyFont');
    register('visualRules.logoUrls');
    register('tone');
    register('governance.bannedPhrases');
    register('governance.requiredPhrases');
    register('designTokens.borderRadius');
    register('designTokens.shadows');
    register('designTokens.spacing');
    register('assets.documents');
  }, [register]);

  React.useEffect(() => {
    const stringified = JSON.stringify(values);
    if (stringified !== lastValuesRef.current) {
      lastValuesRef.current = stringified;
      onDataChange(values);
    }
  }, [values, onDataChange]);

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onSubmit]);

  const addToArray = (path: string, value: string) => {
    const current = watch(path) || [];
    if (value && !current.includes(value)) {
      setValue(path, [...current, value], { shouldDirty: true, shouldValidate: true });
    }
  };

  const removeFromArray = (path: string, index: number) => {
    const current = watch(path) || [];
    setValue(path, current.filter((_: any, i: number) => i !== index), { shouldDirty: true, shouldValidate: true });
  };

  const [newTone, setNewTone] = React.useState('');
  const [newValue, setNewValue] = React.useState('');
  const [newBanned, setNewBanned] = React.useState('');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12 pb-32">
      {/* 1. Brand Basics */}
      <section id="basics" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Brand Basics</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Core identity and business details.</p>
          </div>
        </div>
        
        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm space-y-6 bg-white dark:bg-gray-900 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Brand Name</label>
              <Input {...register('name')} placeholder="e.g. Acme Corp" className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white" />
              {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry</label>
              <Input {...register('industry')} placeholder="e.g. Technology" className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tagline</label>
            <Input {...register('tagline')} placeholder="The future of branding..." className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Website</label>
              <Input {...register('website')} placeholder="https://acme.com" className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slug</label>
              <Input {...register('slug')} placeholder="acme-corp" className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
            <Textarea 
              {...register('description')}
              className="w-full min-h-[120px] rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Tell us about your brand..."
            />
          </div>
        </Card>
      </section>

      <section id="visuals" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">02</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Visual Identity</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Production-grade logo management and visual consistency rules.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm space-y-8 bg-white dark:bg-gray-900 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Logo Variant</label>
              <LogoAssetCard 
                label="Primary Symbol/Wordmark"
                description="Main logo for light backgrounds."
                value={values.visualRules?.logoUrls?.[0]?.url}
                onChange={(url) => {
                  const logos = [...(values.visualRules?.logoUrls || [])];
                  logos[0] = { url, type: 'primary', name: 'Primary Logo' };
                  setValue('visualRules.logoUrls', logos, { shouldDirty: true });
                }}
                onRemove={() => {
                  const logos = [...(values.visualRules?.logoUrls || [])];
                  logos[0] = { url: '', type: 'primary', name: 'Primary Logo' };
                  setValue('visualRules.logoUrls', logos, { shouldDirty: true });
                }}
                required
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dark Mode Variant</label>
              <LogoAssetCard 
                label="Inverse/Dark Variant"
                description="Optimized for dark backgrounds."
                value={values.visualRules?.logoUrls?.[1]?.url}
                onChange={(url) => {
                  const logos = [...(values.visualRules?.logoUrls || [])];
                  logos[1] = { url, type: 'dark', name: 'Dark Variant' };
                  setValue('visualRules.logoUrls', logos, { shouldDirty: true });
                }}
                onRemove={() => {
                  const logos = [...(values.visualRules?.logoUrls || [])];
                  logos[1] = { url: '', type: 'dark', name: 'Dark Variant' };
                  setValue('visualRules.logoUrls', logos, { shouldDirty: true });
                }}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Additional Asset Variants</h4>
                  <p className="text-xs text-gray-500">Add secondary layouts, monochrome versions, or app icons.</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl font-bold gap-2 border-gray-200 dark:border-gray-700"
                  onClick={() => {
                    const logos = [...(values.visualRules?.logoUrls || [])];
                    logos.push({ url: '', type: 'secondary', name: 'Secondary Variant' });
                    setValue('visualRules.logoUrls', logos);
                  }}
                >
                  <PlusCircle className="w-4 h-4" /> Add Slot
                </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {values.visualRules?.logoUrls?.slice(2).map((logo: any, idx: number) => (
                  <div key={idx + 2} className="space-y-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 group relative">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Slot #{idx + 3}</label>
                       <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        onClick={() => {
                          const logos = [...values.visualRules.logoUrls];
                          logos.splice(idx + 2, 1);
                          setValue('visualRules.logoUrls', logos);
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                       <Select 
                        value={logo.type} 
                        onValueChange={(val) => {
                          const logos = [...values.visualRules.logoUrls];
                          logos[idx + 2].type = val;
                          setValue('visualRules.logoUrls', logos);
                        }}
                      >
                        <SelectTrigger className="h-9 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 rounded-xl">
                          <SelectValue placeholder="Logo Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                          <SelectItem value="symbol">Symbol Only</SelectItem>
                          <SelectItem value="wordmark">Wordmark Only</SelectItem>
                          <SelectItem value="vertical">Vertical</SelectItem>
                          <SelectItem value="favicon">Favicon/App Icon</SelectItem>
                        </SelectContent>
                      </Select>

                      <LogoAssetCard 
                        label={logo.type || 'Secondary'}
                        value={logo.url}
                        onChange={(url) => {
                          const logos = [...values.visualRules.logoUrls];
                          logos[idx + 2].url = url;
                          setValue('visualRules.logoUrls', logos);
                        }}
                        onRemove={() => {
                          const logos = [...values.visualRules.logoUrls];
                          logos[idx + 2].url = '';
                          setValue('visualRules.logoUrls', logos);
                        }}
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </Card>
      </section>

      {/* 3. Typography */}
      <section id="typography" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">03</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Typography System</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Configure brand fonts and typography scales.</p>
        </div>

        <TypographyGovernance 
          settings={values.visualRules?.typographySettings || [
            { id: 'h', label: 'Heading Font', fontFamily: 'Inter', weight: '900', sizeScale: '1.5', lineHeight: '1.2' },
            { id: 'b', label: 'Body Font', fontFamily: 'Inter', weight: '400', sizeScale: '1', lineHeight: '1.5' }
          ]}
          scales={values.visualRules?.typographyScales || [
            { id: 'h1', label: 'H1 - Hero Title', size: '48px', spacing: '-0.02em' },
            { id: 'h2', label: 'H2 - Section Header', size: '32px', spacing: '-0.01em' },
            { id: 'body', label: 'Body - Large', size: '18px', spacing: '0' },
            { id: 'caption', label: 'Caption', size: '12px', spacing: '0.05em' },
          ]}
          onChange={(val) => setValue('visualRules.typographySettings', val, { shouldDirty: true })}
          onScaleChange={(val) => setValue('visualRules.typographyScales', val, { shouldDirty: true })}
        />
      </section>

      {/* 4. Colors */}
      <section id="colors" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">04</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Color System</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Enterprise design tokens with WCAG accessibility validation.</p>
        </div>

        <ColorGovernance 
          colors={values.visualRules?.colorTokens || [
            { id: '1', name: 'Primary Indigo', value: '#6366f1', type: 'primary' }
          ]}
          onChange={(val) => setValue('visualRules.colorTokens', val, { shouldDirty: true })}
        />
      </section>

      {/* 5. Brand Voice & Tone */}
      <section id="voice" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">05</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Brand Voice</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Define how the brand speaks and communicates.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm space-y-8 bg-white dark:bg-gray-900 rounded-3xl">
           <div className="space-y-4">
              <label className="text-sm font-black uppercase tracking-widest text-gray-400">Voice Keywords</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {values.tone?.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 gap-2 bg-brand-50 text-brand-700 border-brand-100 uppercase font-black text-[10px] rounded-lg">
                    {t}
                    <button type="button" onClick={() => removeFromArray('tone', i)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Bold, Professional, Witty" 
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('tone', newTone);
                      setNewTone('');
                    }
                  }}
                  className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white px-4"
                />
                <Button type="button" variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => { addToArray('tone', newTone); setNewTone(''); }}>Add</Button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-gray-400">Positioning</label>
                <Textarea 
                  {...register('positioning')} 
                  placeholder="Unique value proposition..." 
                  className="min-h-[120px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-4 py-3" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-gray-400">Mission Statement</label>
                <Textarea 
                  {...register('mission')} 
                  placeholder="Why do you exist?" 
                  className="min-h-[120px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-4 py-3" 
                />
              </div>
           </div>
        </Card>
      </section>

      {/* 6. Audience */}
      <section id="audience" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">06</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Target Audience</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Who are you speaking to?</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm space-y-6 bg-white dark:bg-gray-900 rounded-3xl">
           <Textarea 
             {...register('audience')} 
             placeholder="Describe your ideal customers, demographics, and pain points..." 
             className="min-h-[160px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-4 py-3" 
           />
        </Card>
      </section>

      {/* 7. Competitors */}
      <section id="competitors" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">07</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Competitors</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Market positioning and differentiation.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm space-y-6 bg-white dark:bg-gray-900 rounded-3xl">
           <div className="space-y-4">
              <label className="text-sm font-black uppercase tracking-widest text-gray-400">Main Competitors</label>
              <Textarea 
                {...register('competitors')} 
                placeholder="List your top 3-5 competitors and their strengths/weaknesses..." 
                className="min-h-[120px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-4 py-3" 
              />
           </div>
           <div className="space-y-4 pt-4">
              <label className="text-sm font-black uppercase tracking-widest text-gray-400">Market Differentiators</label>
              <Textarea 
                {...register('differentiators')} 
                placeholder="What makes you stand out from the crowd?" 
                className="min-h-[120px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-4 py-3" 
              />
           </div>
        </Card>
      </section>

      {/* 8. Knowledge Base */}
      <section id="knowledge" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">08</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Knowledge Base</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Train AI on your deep brand knowledge.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl text-center py-12">
           <div className="max-w-xs mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 mx-auto">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">AI Knowledge Training</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Index URLs, internal Wikis, and whitepapers to give your AI Co-pilot deep brand expertise.</p>
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-gray-200 dark:border-gray-700 hover:bg-brand-50 hover:text-brand-600"
                onClick={() => toast({ title: 'Knowledge Base', description: 'Source ingestion interface is being initialized.' })}
              >
                Connect Sources
              </Button>
           </div>
        </Card>
      </section>

      {/* 9. Brand Rules (Governance) */}
      <section id="rules" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">09</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Brand Governance</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Define guardrails for AI content generation.</p>
        </div>

        <GovernanceGovernance 
          rules={values.governance?.rules || []}
          onChange={(val) => setValue('governance.rules', val, { shouldDirty: true })}
        />
      </section>

      {/* 10. Compliance */}
      <section id="compliance" className="space-y-8 scroll-mt-24">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">10</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Legal & Compliance</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Disclaimers and legal requirements.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl">
           <Textarea 
            {...register('governance.requiredDisclaimer')} 
            placeholder="Legal footer, copyright info, or required disclosures..." 
            className="min-h-[120px] rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white px-4 py-3" 
          />
        </Card>
      </section>

      {/* 11. Logo Library */}
      <section id="logos" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">11</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Asset Catalog</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Quick access to all visual identity files.</p>
        </div>
        
        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {values.visualRules?.logoUrls?.filter((l: any) => l.url).map((logo: any, i: number) => (
                <div key={i} className="aspect-square rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/30 relative group overflow-hidden">
                   <img src={logo.url} className="max-w-full max-h-full object-contain z-10" />
                   <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex flex-col items-center justify-center gap-2 backdrop-blur-sm z-20">
                      <span className="text-[8px] font-black uppercase text-gray-400">{logo.type}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest" asChild>
                        <a href={logo.url} download>Download</a>
                      </Button>
                   </div>
                </div>
              ))}
              {values.visualRules?.logoUrls?.filter((l: any) => l.url).length === 0 && (
                <div className="col-span-4 py-12 text-center text-gray-400 text-xs font-medium border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  No assets uploaded in Visual Identity yet.
                </div>
              )}
           </div>
        </Card>
      </section>

      {/* 12. Documents */}
      <section id="documents" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">12</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Guidelines & Docs</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Internal brand strategy and design guidelines.</p>
        </div>

        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-8 bg-white dark:bg-gray-900 rounded-3xl">
          <div className="space-y-4">
            <FileUploader 
              label="Upload Brand Document"
              accept=".pdf,.doc,.docx,.txt"
              onUpload={(url, name) => {
                const currentDocs = values.assets?.documents || [];
                if (currentDocs.some((d: any) => d.name === name)) return;
                setValue('assets.documents', [...currentDocs, { url, name, type: 'document', createdAt: new Date() }], { shouldDirty: true });
              }}
            />
          </div>

          {values.assets?.documents?.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {values.assets.documents.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-brand-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{doc.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:text-red-500"
                        onClick={() => {
                          const newDocs = [...values.assets.documents];
                          newDocs.splice(i, 1);
                          setValue('assets.documents', newDocs, { shouldDirty: true });
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* 13. Social Accounts */}
      <section id="social" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">13</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Social Connect</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Link accounts for AI-automated publishing.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['LinkedIn', 'Instagram', 'Twitter / X', 'Facebook'].map(plat => (
                <div key={plat} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-all hover:border-brand-200 group">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                         <Globe className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-white">{plat}</span>
                   </div>
                   <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-brand-50 hover:text-brand-600"
                    onClick={() => toast({ title: 'Social Integration', description: `Redirecting to ${plat} OAuth...` })}
                   >
                    Connect
                   </Button>
                </div>
              ))}
           </div>
        </Card>
      </section>

      {/* 14. Brand Health */}
      <section id="health" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">14</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Brand Health</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Analytics and governance compliance score.</p>
        </div>

        <Card className="p-8 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden relative">
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                 <h4 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">94.2%</h4>
                 <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black px-1.5 py-0.5">OPTIMIZED</Badge>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identity Robustness</p>
                 </div>
              </div>
              <div className="w-24 h-24 bg-brand-500/10 rounded-3xl flex items-center justify-center border border-brand-500/20 shadow-inner">
                 <Sparkles className="w-8 h-8 text-brand-600 animate-pulse" />
              </div>
           </div>
           <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-500/5 blur-3xl rounded-full" />
        </Card>
      </section>

      {/* 11.5 Media Library */}
      <section id="media" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">M</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Media Library</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Centralized repository for images, icons, and videos.</p>
        </div>
        <Card className="p-12 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl text-center">
           <div className="max-w-xs mx-auto space-y-4">
              <Globe className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">The Media Library DAM (Digital Asset Management) is coming soon. Use the Logo Library for now.</p>
           </div>
        </Card>
      </section>

      {/* 13.5 Automation */}
      <section id="automation" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">A</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Automation</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">AI-driven marketing workflows and content scheduling.</p>
        </div>
        <Card className="p-12 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl text-center">
           <div className="max-w-xs mx-auto space-y-4">
              <Settings className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">Configure AI content engines and automated social posting rules.</p>
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl font-black text-[10px] tracking-widest h-10 border-gray-200 dark:border-gray-700 hover:bg-brand-50 hover:text-brand-600"
                onClick={() => toast({ title: 'Automation Engine', description: 'Configuring AI orchestration workflows...' })}
              >
                Configure Engine
              </Button>
           </div>
        </Card>
      </section>

      {/* 14.5 Performance */}
      <section id="performance" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs">P</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Performance</h2>
          </div>
          <p className="text-gray-500 font-medium px-10">Marketing ROI and brand reach metrics.</p>
        </div>
        <Card className="p-12 border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-3xl text-center">
           <div className="max-w-xs mx-auto space-y-4">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">Performance tracking will be available after connecting social and web properties.</p>
           </div>
        </Card>
      </section>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 py-4 lg:pl-64 xl:pr-96 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Sync</span>
            </div>
            
            {lastSaved && (
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-0.5">Auto-saved</span>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{lastSaved.toLocaleTimeString()}</span>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-100 uppercase font-black text-[9px] px-2 py-0.5 animate-bounce">
                {Object.keys(errors).length} Errors
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => {
                toast({ title: 'Exporting Guidelines', description: 'Generating PDF document...' });
                window.print();
              }} 
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-all rounded-xl h-11"
            >
              <Globe className="w-4 h-4" />
              Export PDF
            </Button>
            
            <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 hidden sm:block" />
            
            <Button 
              className="bg-brand-600 hover:bg-brand-700 h-12 px-10 font-black text-sm uppercase tracking-tight rounded-xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Brand Identity
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
