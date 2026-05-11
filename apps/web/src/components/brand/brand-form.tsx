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
  cn
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
  HelpCircle
} from 'lucide-react';
import { ColorPicker } from './color-picker';
import { FontPicker } from './font-picker';
import { FileUploader } from './file-uploader';
import { FileText, Download } from 'lucide-react';

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
        logoUrls: []
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
        
        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-6 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
              <Input {...register('name')} placeholder="e.g. Acme Corp" className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label>
              <Input {...register('industry')} placeholder="e.g. Technology" className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
            <Input {...register('tagline')} placeholder="The future of branding..." className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
              <Input {...register('website')} placeholder="https://acme.com" className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
              <Input {...register('slug')} placeholder="acme-corp" className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea 
              {...register('description')}
              className="w-full min-h-[100px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Tell us about your brand..."
            />
          </div>
        </Card>
      </section>

      {/* 2. Visual Identity */}
      <section id="visuals" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Visual Identity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Colors, typography and design tokens.</p>
          </div>
        </div>

        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-8 bg-white dark:bg-gray-900">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Primary Logo</h3>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">Main Mark</Badge>
            </div>
            <div className="flex gap-8 items-start">
              <div className="w-36 h-36 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group shadow-inner shrink-0">
                {values.visualRules?.logoUrls?.[0] ? (
                  <>
                    <img src={values.visualRules.logoUrls[0]} alt="Brand Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                    <button 
                      type="button"
                      onClick={() => setValue('visualRules.logoUrls', [], { shouldDirty: true })}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <FileUploader 
                  accept="image/*"
                  onUpload={(url) => setValue('visualRules.logoUrls', [url], { shouldDirty: true })}
                  className="bg-white dark:bg-gray-950"
                />
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Direct Link</label>
                  <Input 
                    value={values.visualRules?.logoUrls?.[0] || ''} 
                    onChange={(e) => setValue('visualRules.logoUrls', [e.target.value], { shouldDirty: true })}
                    placeholder="https://example.com/logo.png" 
                    className="h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 font-mono text-[10px]" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo Variants</h4>
                <p className="text-[10px] text-gray-400">Dark mode, monochromatic, or icon-only versions.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => {
                  const url = values.visualRules?.logoUrls?.[i + 1];
                  return (
                    <div key={i} className="space-y-2">
                      <div className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group shadow-sm">
                        {url ? (
                          <>
                            <img src={url} alt={`Variant ${i + 1}`} className="w-full h-full object-contain p-3" />
                            <button 
                              type="button"
                              onClick={() => {
                                const newLogos = [...(values.visualRules?.logoUrls || [])];
                                newLogos[i + 1] = '';
                                setValue('visualRules.logoUrls', newLogos, { shouldDirty: true });
                              }}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div 
                            className="flex flex-col items-center gap-1 cursor-pointer"
                            onClick={() => document.getElementById(`logo-variant-${i}`)?.click()}
                          >
                            <Plus className="w-5 h-5 text-gray-300" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Variant {i + 1}</span>
                          </div>
                        )}
                        <input 
                          id={`logo-variant-${i}`} 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const mockUrl = URL.createObjectURL(file);
                              const newLogos = [...(values.visualRules?.logoUrls || [])];
                              newLogos[i + 1] = mockUrl;
                              setValue('visualRules.logoUrls', newLogos, { shouldDirty: true });
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Color System</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ColorPicker 
                label="Primary Color" 
                value={values.visualRules?.primaryColor} 
                onChange={(val) => setValue('visualRules.primaryColor', val, { shouldDirty: true, shouldValidate: true })}
                description="The main color used for headings and buttons."
              />
              <ColorPicker 
                label="Secondary Color" 
                value={values.visualRules?.secondaryColor} 
                onChange={(val) => setValue('visualRules.secondaryColor', val, { shouldDirty: true, shouldValidate: true })}
                description="Used for accents and gradients."
              />
              <ColorPicker 
                label="Accent Color" 
                value={values.visualRules?.accentColor} 
                onChange={(val) => setValue('visualRules.accentColor', val, { shouldDirty: true, shouldValidate: true })}
                description="Used for highlights and CTAs."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Design Tokens</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Border Radius</label>
                <Select value={values.designTokens?.borderRadius} onValueChange={(val) => setValue('designTokens.borderRadius', val, { shouldDirty: true })}>
                  <SelectTrigger className="bg-gray-50/50">
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0px">Sharp (0px)</SelectItem>
                    <SelectItem value="0.25rem">Small (4px)</SelectItem>
                    <SelectItem value="0.5rem">Medium (8px)</SelectItem>
                    <SelectItem value="1rem">Large (16px)</SelectItem>
                    <SelectItem value="9999px">Pill (9999px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shadow Style</label>
                <Select value={values.designTokens?.shadows} onValueChange={(val) => setValue('designTokens.shadows', val, { shouldDirty: true })}>
                  <SelectTrigger className="bg-gray-50/50">
                    <SelectValue placeholder="Select shadows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Flat (None)</SelectItem>
                    <SelectItem value="sm">Subtle (Small)</SelectItem>
                    <SelectItem value="md">Elevated (Medium)</SelectItem>
                    <SelectItem value="lg">Floating (Large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Spacing Scale</label>
                <Select value={values.designTokens?.spacing} onValueChange={(val) => setValue('designTokens.spacing', val, { shouldDirty: true })}>
                  <SelectTrigger className="bg-gray-50/50">
                    <SelectValue placeholder="Select spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Typography Scale</h3>
            <div className="grid grid-cols-2 gap-8">
              <FontPicker 
                label="Heading Font" 
                value={values.visualRules?.headingFont} 
                onChange={(val) => setValue('visualRules.headingFont', val)}
              />
              <FontPicker 
                label="Body Font" 
                value={values.visualRules?.bodyFont} 
                onChange={(val) => setValue('visualRules.bodyFont', val)}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Tone & Personality */}
      <section id="identity" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tone & Personality</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">How your brand sounds and behaves.</p>
          </div>
        </div>

        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-8 bg-white dark:bg-gray-900">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tone Keywords</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {values.tone?.map((t: string, i: number) => (
                <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 gap-2 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800 uppercase font-bold text-[10px]">
                  {t}
                  <button type="button" onClick={() => removeFromArray('tone', i)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Professional, Bold, Witty" 
                value={newTone}
                onChange={(e) => setNewTone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('tone', newTone);
                    setNewTone('');
                  }
                }}
                className="bg-gray-50/50 dark:bg-gray-800/50"
              />
              <Button type="button" variant="outline" onClick={() => {
                addToArray('tone', newTone);
                setNewTone('');
              }} className="dark:border-gray-700">Add</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Positioning Statement</label>
              <textarea 
                {...register('positioning')}
                className="w-full min-h-[100px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="What makes your brand unique?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Audience</label>
              <textarea 
                {...register('audience')}
                className="w-full min-h-[100px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Who are you speaking to?"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Governance */}
      <section id="governance" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Governance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Compliance and content rules.</p>
          </div>
        </div>

        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-6 bg-white dark:bg-gray-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Banned Phrases</label>
                <p className="text-xs text-gray-400 italic">AI will never use these phrases in generated content.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {values.governance?.bannedPhrases?.map((p: string, i: number) => (
                <Badge key={i} variant="outline" className="pl-3 pr-1 py-1 gap-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 uppercase font-bold text-[10px]">
                  {p}
                  <button type="button" onClick={() => removeFromArray('governance.bannedPhrases', i)} className="hover:text-red-800">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Cheap, Best in class" 
                value={newBanned}
                onChange={(e) => setNewBanned(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('governance.bannedPhrases', newBanned);
                    setNewBanned('');
                  }
                }}
                className="bg-gray-50/50 dark:bg-gray-800/50"
              />
              <Button type="button" variant="outline" onClick={() => {
                addToArray('governance.bannedPhrases', newBanned);
                setNewBanned('');
              }} className="dark:border-gray-700">Add</Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Required Disclaimer</label>
            <textarea 
              {...register('governance.requiredDisclaimer')}
              className="w-full min-h-[80px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Terms and conditions apply..."
            />
          </div>
        </Card>
      </section>

      {/* 4. Assets & Documents */}
      <section id="assets" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assets & Documents</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Guidelines, legal docs, and brand assets.</p>
          </div>
        </div>

        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-8 bg-white dark:bg-gray-900">
          <div className="space-y-4">
            <FileUploader 
              label="Upload Brand Document"
              accept=".pdf,.doc,.docx,.txt"
              onUpload={(url, name) => {
                const currentDocs = values.assets?.documents || [];
                // Check if document already exists to prevent duplicates
                if (currentDocs.some((d: any) => d.name === name)) return;
                setValue('assets.documents', [...currentDocs, { url, name, type: 'document', createdAt: new Date() }], { shouldDirty: true });
              }}
            />
          </div>

          {values.assets?.documents?.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Uploaded Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {values.assets.documents.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-brand-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-medium">Document</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-brand-600" asChild>
                        <a href={doc.url} download={doc.name}>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                      <Button 
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

      {/* 5. Competitor Comparison (New Feature) */}
      <section id="competitors" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Competitor Comparison</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Position your brand against the market.</p>
          </div>
        </div>

        <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm space-y-6 bg-white dark:bg-gray-900">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Differentiators</label>
            <textarea 
              {...register('differentiators')}
              className="w-full min-h-[100px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="What makes you different from competitors?"
            />
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
              onClick={() => window.print()} 
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
