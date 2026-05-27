'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBrandSchema, type CreateBrandDto } from '@brandflow/shared';
import { apiClient } from '@/lib/api-client';
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
import { BrandBasicsForm } from '@/features/brand/components/BrandBasicsForm';

interface BrandFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onDataChange: (data: any) => void;
  lastSaved?: Date | null;
  wizardMode?: boolean;
  activeStepId?: string;
  triggerValidationRef?: React.MutableRefObject<(() => Promise<boolean>) | undefined>;
}

const defaultBrandFormValues = {
  name: '',
  status: 'published',
  tone: [],
  visualRules: {
    logoUrls: [
      { url: '', type: 'primary', name: 'Primary Logo' },
      { url: '', type: 'dark', name: 'Dark Variant' }
    ],
    colorTokens: [],
    typographySettings: [],
    typographyScales: [],
  },
  identity: {
    values: []
  },
  governance: {
    bannedPhrases: [],
    requiredPhrases: []
  },
  competitors: [],
  assets: {
    documents: []
  },
  strategy: {
    preferredTypes: []
  },
  designPreferences: {
    referenceLinks: []
  },
  approvalWorkflow: {
    processSteps: []
  },
  campaignDetails: {
    adPlatforms: []
  }
};

const sanitizeInitialData = (data: any) => {
  if (!data) return undefined;
  
  // Recursively normalize nulls so optional fields stay unset instead of being turned into fake defaults.
  const clean = (obj: any): any => {
    if (obj === null) return undefined;
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
    slug: (cleaned.slug || cleaned.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    status: cleaned.status || 'published',
    description: cleaned.description || '',
    industry: cleaned.industry || '',
    website: cleaned.website || '',
    differentiators: cleaned.differentiators || '',
    positioning: cleaned.positioning || '',
    audience: typeof cleaned.audience === 'object' && cleaned.audience !== null ? cleaned.audience : { primaryAudience: cleaned.audience || '' },
    tone: Array.isArray(cleaned.tone) ? cleaned.tone : [],
    visualRules: {
      ...cleaned.visualRules,
      primaryColor: cleaned.visualRules?.primaryColor || '',
      secondaryColor: cleaned.visualRules?.secondaryColor || '',
      accentColor: cleaned.visualRules?.accentColor || '',
      headingFont: cleaned.visualRules?.headingFont,
      bodyFont: cleaned.visualRules?.bodyFont,
      fontFamily: cleaned.visualRules?.fontFamily,
      logoUrls: (() => {
        const arr = Array.isArray(cleaned.visualRules?.logoUrls) ? [...cleaned.visualRules.logoUrls.filter(Boolean)] : [];
        if (!arr[0]) arr[0] = { url: '', type: 'primary', name: 'Primary Logo' };
        if (!arr[1]) arr[1] = { url: '', type: 'dark', name: 'Dark Variant' };
        return arr;
      })(),
      colorTokens: Array.isArray(cleaned.visualRules?.colorTokens) && cleaned.visualRules.colorTokens.length > 0
        ? cleaned.visualRules.colorTokens
        : [
            cleaned.visualRules?.primaryColor ? { id: '1', name: 'Primary', value: cleaned.visualRules.primaryColor, type: 'primary' } : null,
            cleaned.visualRules?.secondaryColor ? { id: '2', name: 'Secondary', value: cleaned.visualRules.secondaryColor, type: 'secondary' } : null,
            cleaned.visualRules?.accentColor ? { id: '3', name: 'Accent', value: cleaned.visualRules.accentColor, type: 'accent' } : null,
            cleaned.visualRules?.neutralColor ? { id: '4', name: 'Neutral', value: cleaned.visualRules.neutralColor, type: 'neutral' } : null,
            cleaned.visualRules?.semanticColor ? { id: '5', name: 'Semantic', value: cleaned.visualRules.semanticColor, type: 'semantic' } : null,
          ].filter(Boolean),
      typographySettings: Array.isArray(cleaned.visualRules?.typographySettings) && cleaned.visualRules.typographySettings.length > 0
        ? cleaned.visualRules.typographySettings
        : [
            cleaned.visualRules?.headingFont || cleaned.visualRules?.fontFamily
              ? { id: 'h', label: 'Heading Font', fontFamily: cleaned.visualRules?.headingFont || cleaned.visualRules?.fontFamily, weight: '900', sizeScale: '1.5', lineHeight: '1.2' }
              : null,
            cleaned.visualRules?.bodyFont || cleaned.visualRules?.fontFamily
              ? { id: 'b', label: 'Body Font', fontFamily: cleaned.visualRules?.bodyFont || cleaned.visualRules?.fontFamily, weight: '400', sizeScale: '1', lineHeight: '1.5' }
              : null,
            cleaned.visualRules?.supportingFont
              ? { id: 's', label: 'Supporting Font', fontFamily: cleaned.visualRules?.supportingFont, weight: '400', sizeScale: '0.875', lineHeight: '1.4' }
              : null,
            cleaned.visualRules?.backupFont
              ? { id: 'bs', label: 'Backup/System Font', fontFamily: cleaned.visualRules?.backupFont, weight: '400', sizeScale: '1', lineHeight: '1.5' }
              : null,
          ].filter(Boolean),
      typographyScales: Array.isArray(cleaned.visualRules?.typographyScales) ? cleaned.visualRules.typographyScales : []
    },
    designTokens: {
      ...cleaned.designTokens,
      borderRadius: cleaned.designTokens?.borderRadius,
      shadows: cleaned.designTokens?.shadows,
      spacing: cleaned.designTokens?.spacing,
    },
    assets: {
      ...cleaned.assets,
      documents: Array.isArray(cleaned.assets?.documents) ? cleaned.assets.documents : []
    },
    identity: {
      ...cleaned.identity,
      mission: cleaned.identity?.mission || '',
      vision: cleaned.identity?.vision || '',
      promise: cleaned.identity?.promise || '',
      personality: cleaned.identity?.personality || '',
      values: Array.isArray(cleaned.identity?.values) ? cleaned.identity.values : []
    },
    governance: {
      ...cleaned.governance,
      bannedPhrases: Array.isArray(cleaned.governance?.bannedPhrases) ? cleaned.governance.bannedPhrases : [],
      requiredPhrases: Array.isArray(cleaned.governance?.requiredPhrases) ? cleaned.governance.requiredPhrases : [],
      requiredDisclaimer: cleaned.governance?.requiredDisclaimer || ''
    },
    strategy: {
      targetLocation: cleaned.strategy?.targetLocation || '',
      ageGroup: cleaned.strategy?.ageGroup || '',
      interests: cleaned.strategy?.interests || '',
      postingFrequency: cleaned.strategy?.postingFrequency,
      festivalPosts: cleaned.strategy?.festivalPosts,
      offerPosts: cleaned.strategy?.offerPosts,
      contentLanguage: cleaned.strategy?.contentLanguage,
      preferredTypes: Array.isArray(cleaned.strategy?.preferredTypes) ? cleaned.strategy.preferredTypes : [],
      ctaPreference: cleaned.strategy?.ctaPreference
    },
    designPreferences: {
      preferredStyle: cleaned.designPreferences?.preferredStyle,
      referenceLinks: Array.isArray(cleaned.designPreferences?.referenceLinks) ? cleaned.designPreferences.referenceLinks : [],
      imageStyle: cleaned.designPreferences?.imageStyle,
      animationRequirement: cleaned.designPreferences?.animationRequirement
    },
    approvalWorkflow: {
      reviewerName: cleaned.approvalWorkflow?.reviewerName || '',
      finalApproverName: cleaned.approvalWorkflow?.finalApproverName || '',
      processSteps: Array.isArray(cleaned.approvalWorkflow?.processSteps) ? cleaned.approvalWorkflow.processSteps : [],
      approvalTiming: cleaned.approvalWorkflow?.approvalTiming || '',
      revisionLimit: cleaned.approvalWorkflow?.revisionLimit
    },
    campaignDetails: {
      marketingGoal: cleaned.campaignDetails?.marketingGoal,
      monthlyBudget: cleaned.campaignDetails?.monthlyBudget,
      duration: cleaned.campaignDetails?.duration || '',
      targetLeads: cleaned.campaignDetails?.targetLeads,
      adPlatforms: Array.isArray(cleaned.campaignDetails?.adPlatforms) ? cleaned.campaignDetails.adPlatforms : []
    },
    analyticsConfig: {
      monthlyReport: cleaned.analyticsConfig?.monthlyReport,
      kpiExpectations: cleaned.analyticsConfig?.kpiExpectations || '',
      leadTracking: cleaned.analyticsConfig?.leadTracking,
      engagementTracking: cleaned.analyticsConfig?.engagementTracking
    },
    competitors: Array.isArray(cleaned.competitors) ? cleaned.competitors : [],
    contactInfo: {
      personName: cleaned.contactInfo?.personName || '',
      phoneNumber: cleaned.contactInfo?.phoneNumber || '',
      email: cleaned.contactInfo?.email || '',
      officeAddress: cleaned.contactInfo?.officeAddress || ''
    },
    socialAccess: {
      metaBusinessManagerId: cleaned.socialAccess?.metaBusinessManagerId || '',
      adAccountId: cleaned.socialAccess?.adAccountId || '',
      instagramHandle: cleaned.socialAccess?.instagramHandle || '',
      facebookPage: cleaned.socialAccess?.facebookPage || '',
      linkedinPage: cleaned.socialAccess?.linkedinPage || '',
      youtubeChannel: cleaned.socialAccess?.youtubeChannel || '',
      twitterHandle: cleaned.socialAccess?.twitterHandle || ''
    }
  };
};

// Extracted functions are now in their respective feature components

export function BrandForm({ initialData, onSubmit, isLoading, onDataChange, lastSaved, wizardMode, activeStepId, triggerValidationRef }: BrandFormProps) {
  const { toast } = useToast();

  const form = useForm<any>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: sanitizeInitialData(initialData) || defaultBrandFormValues
  });

  const { watch, setValue, register, handleSubmit, reset, formState: { errors, isDirty } } = form;

  const values = watch();
  const lastValuesRef = React.useRef(JSON.stringify(values));

  // Explicitly register custom fields that don't use native inputs
  React.useEffect(() => {
    register('visualRules.primaryColor');
    register('visualRules.secondaryColor');
    register('visualRules.accentColor');
    register('visualRules.neutralColor');
    register('visualRules.semanticColor');
    register('visualRules.headingFont');
    register('visualRules.bodyFont');
    register('visualRules.supportingFont');
    register('visualRules.backupFont');
    register('visualRules.logoUrls');
    register('tone');
    register('governance.bannedPhrases');
    register('governance.requiredPhrases');
    register('designTokens.borderRadius');
    register('designTokens.shadows');
    register('designTokens.spacing');
    register('assets.documents');
    register('strategy.postingFrequency');
    register('strategy.festivalPosts');
    register('strategy.offerPosts');
    register('strategy.contentLanguage');
    register('strategy.preferredTypes');
    register('strategy.ctaPreference');
    register('designPreferences.preferredStyle');
    register('designPreferences.referenceLinks');
    register('designPreferences.imageStyle');
    register('designPreferences.animationRequirement');
    register('approvalWorkflow.processSteps');
    register('campaignDetails.marketingGoal');
    register('campaignDetails.adPlatforms');
    register('analyticsConfig.monthlyReport');
    register('analyticsConfig.leadTracking');
    register('analyticsConfig.engagementTracking');
    register('socialAccess.metaBusinessManagerId');
    register('socialAccess.adAccountId');
    register('socialAccess.instagramHandle');
    register('socialAccess.facebookPage');
    register('socialAccess.linkedinPage');
    register('socialAccess.youtubeChannel');
    register('socialAccess.twitterHandle');
    register('competitors');
  }, [register]);

  React.useEffect(() => {
    const stringified = JSON.stringify(values);
    if (stringified !== lastValuesRef.current) {
      lastValuesRef.current = stringified;
      onDataChange(values);
    }
  }, [values, onDataChange]);

  React.useEffect(() => {
    reset(sanitizeInitialData(initialData) || defaultBrandFormValues);
  }, [initialData, reset]);

  const getFieldsForStep = (stepId: string): string[] => {
    switch (stepId) {
      case 'basics':
        return ['name', 'slug', 'tagline', 'description', 'industry', 'website', 'foundedYear', 'headquarters', 'contactInfo.personName', 'contactInfo.phoneNumber', 'contactInfo.email', 'contactInfo.officeAddress'];
      case 'visuals':
        return ['visualRules.primaryColor', 'visualRules.secondaryColor', 'visualRules.accentColor', 'visualRules.neutralColor', 'visualRules.semanticColor', 'visualRules.fontFamily', 'visualRules.headingFont', 'visualRules.bodyFont', 'visualRules.supportingFont', 'visualRules.backupFont', 'visualRules.logoUrls'];
      case 'voice':
        return ['tone', 'positioning', 'differentiators', 'identity.mission', 'identity.vision', 'identity.promise', 'identity.personality', 'identity.values'];
      case 'strategy':
        return ['audience', 'strategy.targetLocation', 'strategy.ageGroup', 'strategy.interests', 'strategy.postingFrequency', 'strategy.contentLanguage', 'strategy.ctaPreference', 'competitors'];
      case 'design-prefs':
        return ['designPreferences.preferredStyle', 'designPreferences.imageStyle', 'designPreferences.referenceLinks', 'designPreferences.animationRequirement'];
      case 'rules':
        return ['governance.bannedPhrases', 'governance.requiredPhrases', 'governance.requiredDisclaimer', 'approvalWorkflow.reviewerName', 'approvalWorkflow.finalApproverName', 'approvalWorkflow.revisionLimit'];
      case 'social':
        return ['socialAccess.metaBusinessManagerId', 'socialAccess.adAccountId', 'socialAccess.instagramHandle', 'socialAccess.facebookPage', 'socialAccess.linkedinPage', 'socialAccess.youtubeChannel', 'socialAccess.twitterHandle', 'campaignDetails.marketingGoal', 'campaignDetails.monthlyBudget', 'campaignDetails.duration', 'campaignDetails.targetLeads', 'campaignDetails.adPlatforms'];
      case 'finish':
        return ['analyticsConfig.monthlyReport', 'analyticsConfig.kpiExpectations', 'analyticsConfig.leadTracking', 'analyticsConfig.engagementTracking'];
      default:
        return [];
    }
  };

  React.useEffect(() => {
    if (triggerValidationRef) {
      triggerValidationRef.current = async () => {
        if (!activeStepId) return true;
        const fields = getFieldsForStep(activeStepId);
        return await form.trigger(fields);
      };
    }
  }, [activeStepId, form, triggerValidationRef]);

  // Keyboard Shortcuts
  const handleFormSubmit = React.useCallback((data: any) => {
    const submitData = { ...data };
    if (submitData.visualRules) {
       const colors = submitData.visualRules.colorTokens || [];
       const primary = colors.find((c: any) => c.type === 'primary')?.value || submitData.visualRules.primaryColor;
       const secondary = colors.find((c: any) => c.type === 'secondary')?.value || submitData.visualRules.secondaryColor;
       const accent = colors.find((c: any) => c.type === 'accent')?.value || submitData.visualRules.accentColor;
       const neutral = colors.find((c: any) => c.type === 'neutral')?.value || submitData.visualRules.neutralColor;
       const semantic = colors.find((c: any) => c.type === 'semantic')?.value || submitData.visualRules.semanticColor;
       
       const fonts = submitData.visualRules.typographySettings || [];
       const heading = fonts.find((f: any) => f.id === 'h')?.fontFamily || submitData.visualRules.headingFont;
       const body = fonts.find((f: any) => f.id === 'b')?.fontFamily || submitData.visualRules.bodyFont;
       const supporting = fonts.find((f: any) => f.id === 's')?.fontFamily || submitData.visualRules.supportingFont;
       const backup = fonts.find((f: any) => f.id === 'bs')?.fontFamily || submitData.visualRules.backupFont;

       submitData.visualRules.primaryColor = primary;
       submitData.visualRules.secondaryColor = secondary;
       submitData.visualRules.accentColor = accent;
       submitData.visualRules.neutralColor = neutral;
       submitData.visualRules.semanticColor = semantic;
       submitData.visualRules.headingFont = heading;
       submitData.visualRules.bodyFont = body;
       submitData.visualRules.supportingFont = supporting;
       submitData.visualRules.backupFont = backup;
    }
    onSubmit(submitData);
  }, [onSubmit]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(handleFormSubmit)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, handleFormSubmit]);


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

  const isSectionVisible = (sectionId: string) => {
    if (!wizardMode || !activeStepId) return true;
    
    const mapping: Record<string, string[]> = {
      basics: ['basics'],
      visuals: ['visuals', 'typography', 'colors', 'logos', 'documents'],
      voice: ['voice', 'knowledge'],
      strategy: ['audience', 'competitors', 'content-strategy'],
      'design-prefs': ['design-prefs'],
      rules: ['rules', 'compliance', 'approval'],
      social: ['social', 'campaigns', 'automation'],
      finish: ['health', 'performance', 'analytics']
    };

    return mapping[activeStepId]?.includes(sectionId) ?? false;
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-12", !wizardMode && "pb-32")}>
        {/* 1. Brand Basics */}
        <BrandBasicsForm isSectionVisible={isSectionVisible} values={values} />

      {isSectionVisible('visuals') && (
        <section id="visuals" className="space-y-8 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="space-y-3 mb-6 px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background dark:bg-background text-foreground dark:text-foreground flex items-center justify-center font-black text-sm shadow-2xl shadow-gray-900/20 dark:shadow-white/10">02</div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">Visual Identity</h2>
              <p className="text-[10px] font-black text-primary dark:text-brand-400 uppercase tracking-widest">Production-grade logo management & assets</p>
            </div>
          </div>
        </div>

        <Card className="glass-panel p-6 sm:p-8 space-y-6 border border-white/20 dark:border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Logo Variant</label>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dark Mode Variant</label>
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

          <div className="pt-8 border-t border-border/60">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Additional Asset Variants</h4>
                  <p className="text-xs text-muted-foreground">Add secondary layouts, monochrome versions, or app icons.</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl font-bold gap-2 border-border"
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
                  <div key={idx + 2} className="space-y-4 p-5 rounded-2xl bg-surface-1 dark:bg-gray-950/50 bg-surface-2/30 border border-border/60 group relative">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Slot #{idx + 3}</label>
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
                        <SelectTrigger className="h-9 text-[10px] font-black uppercase tracking-widest bg-background border-border/60 border-border rounded-xl">
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
      )}

      {/* 3. Typography */}
      {isSectionVisible('typography') && (
        <section id="typography" className="space-y-8 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="space-y-3 mb-6 px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background dark:bg-background text-foreground dark:text-foreground flex items-center justify-center font-black text-sm shadow-2xl shadow-gray-900/20 dark:shadow-white/10">03</div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">Typography System</h2>
              <p className="text-[10px] font-black text-primary dark:text-brand-400 uppercase tracking-widest">Global font scales & primary typefaces</p>
            </div>
          </div>
        </div>

        <TypographyGovernance 
          settings={values.visualRules?.typographySettings ?? []}
          scales={values.visualRules?.typographyScales ?? []}
          onChange={(val) => setValue('visualRules.typographySettings', val, { shouldDirty: true })}
          onScaleChange={(val) => setValue('visualRules.typographyScales', val, { shouldDirty: true })}
        />
      </section>
      )}

      {/* 4. Colors */}
      {isSectionVisible('colors') && (
        <section id="colors" className="space-y-8 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="space-y-3 mb-6 px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background dark:bg-background text-foreground dark:text-foreground flex items-center justify-center font-black text-sm shadow-2xl shadow-gray-900/20 dark:shadow-white/10">04</div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">Color Governance</h2>
              <p className="text-[10px] font-black text-primary dark:text-brand-400 uppercase tracking-widest">Enterprise tokens with accessibility validation</p>
            </div>
          </div>
        </div>

        <ColorGovernance 
          colors={values.visualRules?.colorTokens ?? []}
          onChange={(val) => setValue('visualRules.colorTokens', val, { shouldDirty: true })}
        />
      </section>
      )}

      {/* 5. Brand Voice & Tone */}
      {isSectionVisible('voice') && (
        <section id="voice" className="space-y-6 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
         <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-foreground shadow-xl shadow-indigo-500/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Voice & Intelligence</h2>
              <p className="text-sm font-medium text-muted-foreground">Linguistic DNA & brand personality rules</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voice Keywords</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {values.tone?.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1.5 gap-2 bg-indigo-50/80 text-indigo-700 border-indigo-100 uppercase font-black text-xs rounded-xl shadow-sm">
                    {t}
                    <button type="button" onClick={() => removeFromArray('tone', i)} className="hover:text-red-500 transition-colors ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3">
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
                  className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-indigo-500 px-5"
                />
                <Button type="button" variant="default" className="rounded-2xl h-14 px-8 font-bold bg-background hover:bg-surface-1 shadow-xl" onClick={() => { addToArray('tone', newTone); setNewTone(''); }}>Add Keyword</Button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/50 dark:border-gray-800/50">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Positioning Statement</label>
                <Textarea 
                  {...register('positioning')} 
                  placeholder="What is your unique value proposition?" 
                  className="min-h-[140px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-4 shadow-sm focus-visible:ring-indigo-500 leading-relaxed" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mission Statement</label>
                <Textarea 
                  {...register('identity.mission')} 
                  placeholder="Why do you exist?" 
                  className="min-h-[140px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-4 shadow-sm focus-visible:ring-indigo-500 leading-relaxed" 
                />
              </div>
           </div>
        </Card>
      </section>
      )}

      {/* 6. Audience */}
      {isSectionVisible('audience') && (
        <section id="audience" className="space-y-6 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-foreground shadow-xl shadow-emerald-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Target Audience</h2>
              <p className="text-sm font-medium text-muted-foreground">Demographics, psychographics & market reach</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <div className="space-y-3">
             <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Customers</label>
             <Textarea 
               {...register('audience.primaryAudience')} 
               placeholder="Describe your ideal customers, demographics, and pain points..." 
               className="min-h-[140px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-4 shadow-sm focus-visible:ring-emerald-500 leading-relaxed" 
             />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/50 dark:border-gray-800/50">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Location</label>
                <Input {...register('strategy.targetLocation')} placeholder="e.g. Global, USA, Tamil Nadu" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age Group</label>
                <Input {...register('strategy.ageGroup')} placeholder="e.g. 18-35, Professionals" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-emerald-500" />
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interests & Behaviors</label>
              <Input {...register('strategy.interests')} placeholder="e.g. Tech enthusiasts, sustainable living, remote workers" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-emerald-500" />
           </div>
        </Card>
      </section>
      )}

      {/* 7. Competitors */}
      {isSectionVisible('competitors') && (
        <section id="competitors" className="space-y-6 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-foreground shadow-xl shadow-rose-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Market Intelligence</h2>
              <p className="text-sm font-medium text-muted-foreground">Competitor benchmarking & differentiators</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Main Competitors</label>
                <Button 
                  type="button" 
                  variant="default" 
                  size="sm" 
                  className="rounded-full font-bold h-10 px-5 bg-background hover:bg-surface-1 text-foreground shadow-lg"
                  onClick={() => {
                    const current = values.competitors || [];
                    setValue('competitors', [...current, { name: '', website: '', strengths: '', weaknesses: '' }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Competitor
                </Button>
              </div>

              {values.competitors?.map((comp: any, idx: number) => (
                <div key={idx} className="p-6 rounded-3xl border border-border/50 dark:border-gray-800/50 bg-background/60 bg-background/40 space-y-5 relative group shadow-sm transition-all hover:shadow-md">
                  <button 
                    type="button"
                    onClick={() => {
                      const newComps = values.competitors.filter((_: any, i: number) => i !== idx);
                      setValue('competitors', newComps);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Competitor Name</label>
                      <Input 
                        placeholder="e.g. Rival Inc." 
                        value={comp.name} 
                        onChange={(e) => {
                          const newComps = [...values.competitors];
                          newComps[idx].name = e.target.value;
                          setValue('competitors', newComps);
                        }}
                        className="h-12 bg-background border-border/60 rounded-xl focus-visible:ring-rose-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Website</label>
                      <Input 
                        placeholder="https://" 
                        value={comp.website} 
                        onChange={(e) => {
                          const newComps = [...values.competitors];
                          newComps[idx].website = e.target.value;
                          setValue('competitors', newComps);
                        }}
                        className="h-12 bg-background border-border/60 rounded-xl focus-visible:ring-rose-500" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">Strengths (What they do well)</label>
                      <Textarea 
                        placeholder="Great customer service..." 
                        value={comp.strengths} 
                        onChange={(e) => {
                          const newComps = [...values.competitors];
                          newComps[idx].strengths = e.target.value;
                          setValue('competitors', newComps);
                        }}
                        className="bg-emerald-50/30 dark:bg-emerald-950/20 text-sm min-h-[80px] border-emerald-100 dark:border-emerald-900 rounded-xl focus-visible:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-1">Weaknesses (Where they fail)</label>
                      <Textarea 
                        placeholder="Outdated mobile app..." 
                        value={comp.weaknesses} 
                        onChange={(e) => {
                          const newComps = [...values.competitors];
                          newComps[idx].weaknesses = e.target.value;
                          setValue('competitors', newComps);
                        }}
                        className="bg-rose-50/30 dark:bg-rose-950/20 text-sm min-h-[80px] border-rose-100 dark:border-rose-900 rounded-xl focus-visible:ring-rose-500" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!values.competitors || values.competitors.length === 0) && (
                <div className="py-12 border-2 border-dashed border-border/50 dark:border-gray-800/50 rounded-[2rem] bg-background/30 bg-background/20 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mb-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-bold">No competitors tracked yet.</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">Listing competitors allows the AI Engine to automatically analyze your market positioning.</p>
                </div>
              )}
           </div>
           
           <div className="space-y-4 pt-8 border-t border-border/50 dark:border-gray-800/50">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Market Differentiators</label>
              <Textarea 
                {...register('differentiators')} 
                placeholder="What makes your brand stand out from the crowd?" 
                className="min-h-[120px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-4 shadow-sm focus-visible:ring-rose-500 leading-relaxed" 
              />
           </div>
        </Card>
      </section>
      )}

      {/* 7.5 Content Strategy */}
      {isSectionVisible('content-strategy') && (
        <section id="content-strategy" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-foreground shadow-xl shadow-amber-500/30">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Content Strategy</h2>
              <p className="text-sm font-medium text-muted-foreground">Scheduling, formats & delivery preferences</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Posting Frequency</label>
                  <Select 
                    value={values.strategy?.postingFrequency} 
                    onValueChange={(val) => setValue('strategy.postingFrequency', val, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-amber-500">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Language</label>
                  <Select 
                    value={values.strategy?.contentLanguage} 
                    onValueChange={(val) => setValue('strategy.contentLanguage', val, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-amber-500">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                      <SelectItem value="mixed">Mixed (Tanglish)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred Formats</label>
                  <div className="flex flex-wrap gap-2.5">
                    {['Poster', 'Reel', 'Video', 'Carousel', 'Blog', 'Newsletter'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const current = values.strategy?.preferredTypes || [];
                          if (current.includes(type)) {
                            setValue('strategy.preferredTypes', current.filter((t: string) => t !== type));
                          } else {
                            setValue('strategy.preferredTypes', [...current, type]);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                          values.strategy?.preferredTypes?.includes(type)
                            ? "bg-amber-500 text-foreground border-amber-600 shadow-md shadow-amber-500/20"
                            : "bg-background/60 bg-background/60 text-muted-foreground text-foreground border-border/50 dark:border-gray-800/50 hover:border-amber-200 dark:hover:border-amber-800"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-background/40 bg-background/40 border border-border/50 dark:border-gray-800/50">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-foreground">Festival Content</label>
                      <p className="text-xs text-muted-foreground font-medium">Auto-generate posts for major festivals.</p>
                    </div>
                    <Switch 
                      checked={values.strategy?.festivalPosts ?? false} 
                      onCheckedChange={(checked) => setValue('strategy.festivalPosts', checked, { shouldDirty: true })} 
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-background/40 bg-background/40 border border-border/50 dark:border-gray-800/50">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-foreground">Promotional Offers</label>
                      <p className="text-xs text-muted-foreground font-medium">Enable AI-driven offer and discount content.</p>
                    </div>
                    <Switch 
                      checked={values.strategy?.offerPosts ?? false} 
                      onCheckedChange={(checked) => setValue('strategy.offerPosts', checked, { shouldDirty: true })} 
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </div>
              </div>
           </div>
        </Card>
      </section>
      )}

      {/* 8. Knowledge Base */}
      {isSectionVisible('knowledge') && (
        <section id="knowledge" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-foreground shadow-xl shadow-cyan-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Knowledge Ingestion</h2>
              <p className="text-sm font-medium text-muted-foreground">Training AI on deep brand expertise</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
           <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 flex items-center justify-center text-cyan-600 mx-auto shadow-inner">
                <Globe className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight text-foreground">AI Knowledge Training</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">Index URLs, internal Wikis, and whitepapers to give your AI Co-pilot deep brand expertise.</p>
              </div>
              <Button 
                type="button" 
                variant="default" 
                size="lg"
                className="rounded-full font-bold h-12 px-8 bg-background hover:bg-surface-1 text-foreground shadow-xl shadow-gray-900/20 w-full sm:w-auto"
                onClick={() => toast({ title: 'Knowledge Base', description: 'Source ingestion interface is being initialized.' })}
              >
                Connect Sources
              </Button>
           </div>
        </Card>
      </section>
      )}

      {/* 9. Brand Rules (Governance) */}
      {isSectionVisible('rules') && (
        <section id="rules" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-foreground shadow-xl shadow-red-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Brand Governance</h2>
              <p className="text-sm font-medium text-muted-foreground">Define guardrails for AI content generation</p>
            </div>
          </div>
        </div>

        <GovernanceGovernance 
          rules={values.governance?.rules || []}
          onChange={(val) => setValue('governance.rules', val, { shouldDirty: true })}
        />
      </section>
      )}

      {/* 10. Compliance */}
      {isSectionVisible('compliance') && (
        <section id="compliance" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-foreground shadow-xl shadow-gray-900/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Legal & Compliance</h2>
              <p className="text-sm font-medium text-muted-foreground">Disclaimers & regulatory guardrails</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <Textarea 
            {...register('governance.requiredDisclaimer')} 
            placeholder="Legal footer, copyright info, or required disclosures..." 
            className="min-h-[160px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-5 shadow-sm focus-visible:ring-gray-500 leading-relaxed" 
          />
        </Card>
      </section>
      )}

      {/* 11. Logo Library */}
      {isSectionVisible('logos') && (
        <section id="logos" className="space-y-6 scroll-mt-24">
         <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-foreground shadow-xl shadow-indigo-500/30">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Asset Catalog</h2>
              <p className="text-sm font-medium text-muted-foreground">Quick access to all visual identity files</p>
            </div>
          </div>
        </div>
        
        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {values.visualRules?.logoUrls?.filter((l: any) => l.url).map((logo: any, i: number) => (
                <div key={i} className="aspect-square rounded-3xl border border-border/50 dark:border-gray-800/50 flex items-center justify-center p-6 bg-background/60 bg-background/40 relative group overflow-hidden shadow-sm transition-all hover:shadow-lg">
                   <img src={logo.url} alt={`${logo.type || 'Brand'} logo`} className="max-w-full max-h-full object-contain z-10 transition-transform group-hover:scale-105" />
                   <div className="absolute inset-0 bg-background/90 bg-background/90 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-20">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{logo.type}</span>
                      <Button type="button" variant="default" size="sm" className="rounded-full font-bold bg-background hover:bg-surface-1 text-foreground shadow-md" asChild>
                        <a href={logo.url} download>Download</a>
                      </Button>
                   </div>
                </div>
              ))}
              {(!values.visualRules?.logoUrls || values.visualRules?.logoUrls?.filter((l: any) => l.url).length === 0) && (
                <div className="col-span-2 md:col-span-4 py-16 text-center flex flex-col items-center justify-center border-2 border-dashed border-border/50 dark:border-gray-800/50 rounded-[2rem]">
                  <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-bold">No assets uploaded yet.</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">Upload logos in the Visual Identity section first.</p>
                </div>
              )}
           </div>
        </Card>
      </section>
      )}

      {/* 12. Documents */}
      {isSectionVisible('documents') && (
        <section id="documents" className="space-y-6 scroll-mt-24">
         <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-foreground shadow-xl shadow-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Guidelines & Docs</h2>
              <p className="text-sm font-medium text-muted-foreground">Internal brand strategy & design guidelines</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
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
            <div className="space-y-5 pt-8 border-t border-border/50 dark:border-gray-800/50">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded Documents</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {values.assets.documents.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-background/60 bg-background/60 border border-border/50 dark:border-gray-800/50 shadow-sm transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-emerald-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-foreground truncate">{doc.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors"
                        onClick={() => {
                          const newDocs = [...values.assets.documents];
                          newDocs.splice(i, 1);
                          setValue('assets.documents', newDocs, { shouldDirty: true });
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
      )}

      {/* 9. Design Preferences */}
      {isSectionVisible('design-prefs') && (
      <section id="design-prefs" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-foreground shadow-xl shadow-fuchsia-500/30">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Design Preferences</h2>
              <p className="text-sm font-medium text-muted-foreground">Visual direction for AI-generated creatives</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred Design Style</label>
               <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Minimal', emoji: '⚪', desc: 'Clean & Simple' },
                    { name: 'Corporate', emoji: '🏢', desc: 'Trust & Power' },
                    { name: '3D', emoji: '📦', desc: 'Modern depth' },
                    { name: 'Modern', emoji: '✨', desc: 'Trendy & Fresh' },
                    { name: 'Playful', emoji: '🎈', desc: 'Fun & Friendly' },
                    { name: 'Luxury', emoji: '💎', desc: 'High-end feel' }
                  ].map(style => (
                    <button
                      key={style.name}
                      type="button"
                      onClick={() => setValue('designPreferences.preferredStyle', style.name, { shouldDirty: true })}
                      className={cn(
                        "p-5 rounded-2xl border text-left transition-all group hover:-translate-y-0.5",
                        values.designPreferences?.preferredStyle === style.name
                          ? "bg-fuchsia-600 text-foreground border-fuchsia-600 shadow-xl shadow-fuchsia-500/30"
                          : "bg-background/60 bg-background/60 text-muted-foreground text-foreground border-border/50 dark:border-gray-800/50 hover:border-fuchsia-300 dark:hover:border-fuchsia-800 hover:shadow-md"
                      )}
                    >
                      <div className="text-2xl mb-2">{style.emoji}</div>
                      <div className="text-xs font-bold uppercase tracking-wider">{style.name}</div>
                      <div className={cn("text-[10px] font-medium mt-1", values.designPreferences?.preferredStyle === style.name ? "text-fuchsia-100" : "text-muted-foreground")}>{style.desc}</div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image Style</label>
                  <Select 
                    value={values.designPreferences?.imageStyle} 
                    onValueChange={(val) => setValue('designPreferences.imageStyle', val, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-fuchsia-500">
                      <SelectValue placeholder="Select image style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Minimal">Minimal & Clean</SelectItem>
                      <SelectItem value="Corporate">Corporate & Professional</SelectItem>
                      <SelectItem value="3D">3D Rendered</SelectItem>
                      <SelectItem value="Modern">Modern & Vibrant</SelectItem>
                    </SelectContent>
                  </Select>
               </div>

               <div className="flex items-center justify-between p-5 rounded-2xl bg-background/40 bg-background/40 border border-border/50 dark:border-gray-800/50 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-foreground">Motion Graphics</label>
                    <p className="text-xs text-muted-foreground font-medium">Enable animation/video requirements.</p>
                  </div>
                  <Switch 
                    checked={values.designPreferences?.animationRequirement ?? false} 
                    onCheckedChange={(checked) => setValue('designPreferences.animationRequirement', checked, { shouldDirty: true })} 
                    className="data-[state=checked]:bg-fuchsia-500"
                  />
               </div>
            </div>
          </div>

          <div className="space-y-5 pt-8 border-t border-border/50 dark:border-gray-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference Design Links</label>
              <Button 
                type="button" 
                variant="default" 
                size="sm" 
                className="rounded-full font-bold h-10 px-5 bg-background hover:bg-surface-1 text-foreground shadow-lg"
                onClick={() => {
                  const current = values.designPreferences?.referenceLinks || [];
                  setValue('designPreferences.referenceLinks', [...current, '']);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Link
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {values.designPreferences?.referenceLinks?.map((link: string, idx: number) => (
                <div key={idx} className="flex gap-3 bg-background/60 bg-background/60 p-2 rounded-2xl border border-border/50 dark:border-gray-800/50 shadow-sm">
                  <Input 
                    placeholder="https://behance.net/..." 
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...values.designPreferences.referenceLinks];
                      newLinks[idx] = e.target.value;
                      setValue('designPreferences.referenceLinks', newLinks);
                    }}
                    className="h-12 bg-transparent border-none shadow-none focus-visible:ring-0 px-4"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-12 w-12 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => {
                      const newLinks = values.designPreferences.referenceLinks.filter((_: any, i: number) => i !== idx);
                      setValue('designPreferences.referenceLinks', newLinks);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
      )}

      {/* 10. Approval Workflow */}
      {isSectionVisible('approval') && (
      <section id="approval" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-foreground shadow-xl shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Approval Workflow</h2>
              <p className="text-sm font-medium text-muted-foreground">Review cycles & stakeholder sign-off process</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Reviewer</label>
              <Input {...register('approvalWorkflow.reviewerName')} placeholder="e.g. Marketing Manager" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-blue-500" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Final Approver</label>
              <Input {...register('approvalWorkflow.finalApproverName')} placeholder="e.g. Business Owner / CEO" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approval Timing</label>
              <Input {...register('approvalWorkflow.approvalTiming')} placeholder="e.g. Within 24 hours of posting" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-blue-500" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revision Limit (per post)</label>
              <Input type="number" {...register('approvalWorkflow.revisionLimit', { valueAsNumber: true })} className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-blue-500" />
            </div>
          </div>

          <div className="space-y-5 pt-8 border-t border-border/50 dark:border-gray-800/50">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approval Process Steps</label>
                <Button 
                  type="button" 
                  variant="default" 
                  size="sm" 
                  className="rounded-full font-bold h-10 px-5 bg-background hover:bg-surface-1 text-foreground shadow-lg"
                  onClick={() => {
                    const current = values.approvalWorkflow?.processSteps || [];
                    setValue('approvalWorkflow.processSteps', [...current, '']);
                  }}
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Step
                </Button>
             </div>
             <div className="space-y-3">
                {values.approvalWorkflow?.processSteps?.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-background/60 bg-background/60 p-3 rounded-2xl border border-border/50 dark:border-gray-800/50 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-foreground flex items-center justify-center font-bold shadow-inner">{idx + 1}</div>
                    <Input 
                      placeholder={`Describe step ${idx + 1}...`} 
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...values.approvalWorkflow.processSteps];
                        newSteps[idx] = e.target.value;
                        setValue('approvalWorkflow.processSteps', newSteps);
                      }}
                      className="border-none bg-transparent h-12 text-base focus-visible:ring-0 flex-1 px-2"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        const newSteps = values.approvalWorkflow.processSteps.filter((_: any, i: number) => i !== idx);
                        setValue('approvalWorkflow.processSteps', newSteps);
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
                {(!values.approvalWorkflow?.processSteps || values.approvalWorkflow.processSteps.length === 0) && (
                  <div className="py-8 border-2 border-dashed border-border/50 dark:border-gray-800/50 rounded-2xl text-center">
                    <p className="text-sm font-medium text-muted-foreground">No approval steps defined.</p>
                  </div>
                )}
             </div>
          </div>
        </Card>
      </section>
      )}

      {/* 11. Campaign Details */}
      {isSectionVisible('campaigns') && (
      <section id="campaigns" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-foreground shadow-xl shadow-orange-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Campaign Defaults</h2>
              <p className="text-sm font-medium text-muted-foreground">Standard parameters for marketing execution</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marketing Goal</label>
                <Select 
                  value={values.campaignDetails?.marketingGoal} 
                  onValueChange={(val) => setValue('campaignDetails.marketingGoal', val, { shouldDirty: true })}
                >
                  <SelectTrigger className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-orange-500">
                    <SelectValue placeholder="Select primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brand Awareness">Brand Awareness</SelectItem>
                    <SelectItem value="Leads">Lead Generation</SelectItem>
                    <SelectItem value="Sales">Sales & Conversions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Budget (USD)</label>
                <Input type="number" {...register('campaignDetails.monthlyBudget', { valueAsNumber: true })} className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-orange-500" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border/50 dark:border-gray-800/50">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Duration</label>
                <Input {...register('campaignDetails.duration')} placeholder="e.g. 3 Months, On-going" className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Leads / Reach (Monthly)</label>
                <Input type="number" {...register('campaignDetails.targetLeads', { valueAsNumber: true })} className="h-14 bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base shadow-sm focus-visible:ring-orange-500" />
              </div>
           </div>

           <div className="space-y-5 pt-4 border-t border-border/50 dark:border-gray-800/50">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ad Platforms</label>
              <div className="flex flex-wrap gap-2.5">
                {['Meta Ads', 'Google Ads', 'LinkedIn Ads', 'Twitter Ads', 'TikTok Ads'].map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => {
                      const current = values.campaignDetails?.adPlatforms || [];
                      if (current.includes(platform)) {
                        setValue('campaignDetails.adPlatforms', current.filter((p: string) => p !== platform));
                      } else {
                        setValue('campaignDetails.adPlatforms', [...current, platform]);
                      }
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                      values.campaignDetails?.adPlatforms?.includes(platform)
                        ? "bg-orange-500 text-foreground border-orange-600 shadow-md shadow-orange-500/20"
                        : "bg-background/60 bg-background/60 text-muted-foreground text-foreground border-border/50 dark:border-gray-800/50 hover:border-orange-200 dark:hover:border-orange-800"
                    )}
                  >
                    {platform}
                  </button>
                ))}
              </div>
           </div>
        </Card>
      </section>
      )}

      {/* 12. Analytics Config */}
      {isSectionVisible('analytics') && (
      <section id="analytics" className="space-y-6 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-foreground shadow-xl shadow-violet-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Analytics & Reporting</h2>
              <p className="text-sm font-medium text-muted-foreground">KPI tracking & automated performance insights</p>
            </div>
          </div>
        </div>

        <Card className="p-8 space-y-8 glass-panel border-white/20 dark:border-white/5 shadow-2xl rounded-3xl bg-background/40 dark:bg-gray-950/40 backdrop-blur-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-background/40 bg-background/40 border border-border/50 dark:border-gray-800/50 shadow-sm transition-all hover:shadow-md">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-foreground">Monthly Reports</label>
                    <p className="text-xs text-muted-foreground font-medium">Auto-generate monthly performance PDF.</p>
                  </div>
                  <Switch 
                    checked={values.analyticsConfig?.monthlyReport ?? false} 
                    onCheckedChange={(checked) => setValue('analyticsConfig.monthlyReport', checked, { shouldDirty: true })} 
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-background/40 bg-background/40 border border-border/50 dark:border-gray-800/50 shadow-sm transition-all hover:shadow-md">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-foreground">Lead Tracking</label>
                    <p className="text-xs text-muted-foreground font-medium">Track form submissions and conversions.</p>
                  </div>
                  <Switch 
                    checked={values.analyticsConfig?.leadTracking ?? false} 
                    onCheckedChange={(checked) => setValue('analyticsConfig.leadTracking', checked, { shouldDirty: true })} 
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-background/40 bg-background/40 border border-border/50 dark:border-gray-800/50 shadow-sm transition-all hover:shadow-md">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-foreground">Engagement Tracking</label>
                    <p className="text-xs text-muted-foreground font-medium">Track likes, shares, and comments.</p>
                  </div>
                  <Switch 
                    checked={values.analyticsConfig?.engagementTracking ?? false} 
                    onCheckedChange={(checked) => setValue('analyticsConfig.engagementTracking', checked, { shouldDirty: true })} 
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">KPI Expectations</label>
                <Textarea 
                  {...register('analyticsConfig.kpiExpectations')} 
                  placeholder="e.g. 20% increase in engagement, 50 new leads per month..." 
                  className="min-h-full h-[260px] bg-background/60 bg-background/60 border-border/50 dark:border-gray-800/50 rounded-2xl text-base p-5 shadow-sm focus-visible:ring-violet-500 leading-relaxed" 
                />
             </div>
          </div>
        </Card>
      </section>
      )}

      {/* 13. Social Connect */}
      {isSectionVisible('social') && (
      <section id="social" className="space-y-8 scroll-mt-24">
        <div className="space-y-3 mb-6 px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background dark:bg-background text-foreground dark:text-foreground flex items-center justify-center font-black text-sm shadow-2xl shadow-gray-900/20 dark:shadow-white/10">13</div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">Social Presence</h2>
              <p className="text-[10px] font-black text-primary dark:text-brand-400 uppercase tracking-widest">Account connectivity & handle management</p>
            </div>
          </div>
        </div>

        <Card className="glass-panel p-6 sm:p-8 space-y-6 border border-white/20 dark:border-white/5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'LinkedIn', handleField: 'socialAccess.linkedinPage', placeholder: 'LinkedIn Page URL' },
                { name: 'Instagram', handleField: 'socialAccess.instagramHandle', placeholder: '@username' },
                { name: 'Twitter / X', handleField: 'socialAccess.twitterHandle', placeholder: '@username' },
                { name: 'Facebook', handleField: 'socialAccess.facebookPage', placeholder: 'Facebook Page URL' },
                { name: 'YouTube', handleField: 'socialAccess.youtubeChannel', placeholder: 'Channel URL' },
              ].map(plat => (
                <div key={plat.name} className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-2 border border-border/60 transition-all hover:border-primary/20 group">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-background border border-border/60 border-border flex items-center justify-center shadow-sm">
                            <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                         </div>
                         <span className="text-xs font-black uppercase tracking-tight text-foreground">{plat.name}</span>
                      </div>
                      <Button 
                         type="button" 
                         variant="outline" 
                         size="sm" 
                         className="rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                         onClick={async () => {
                           toast({ title: 'OAuth Flow', description: `Initializing ${plat.name} connection...` });
                         }}
                      >
                       Connect
                      </Button>
                   </div>
                   <Input 
                      {...register(plat.handleField as any)} 
                      placeholder={plat.placeholder} 
                      className="h-9 text-[10px] bg-background border-border/60 rounded-xl" 
                   />
                </div>
              ))}
           </div>

           <div className="mt-8 pt-8 border-t border-border/60 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Business & Ad Account Access</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meta Business Manager ID</label>
                  <Input {...register('socialAccess.metaBusinessManagerId')} placeholder="e.g. 123456789012345" className="h-12 bg-surface-1 dark:bg-gray-950/50 bg-surface-2/50 border-border/60 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ad Account ID</label>
                  <Input {...register('socialAccess.adAccountId')} placeholder="e.g. act_123456789" className="h-12 bg-surface-1 dark:bg-gray-950/50 bg-surface-2/50 border-border/60 rounded-xl" />
                </div>
              </div>
           </div>
        </Card>
      </section>
      )}


      {/* 14. Brand Health */}
      {isSectionVisible('health') && (
      <section id="health" className="space-y-8 scroll-mt-24">
        <div className="space-y-3 mb-6 px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background dark:bg-background text-foreground dark:text-foreground flex items-center justify-center font-black text-sm shadow-2xl shadow-gray-900/20 dark:shadow-white/10">14</div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">Brand Health</h2>
              <p className="text-[10px] font-black text-primary dark:text-brand-400 uppercase tracking-widest">Identity robustness & governance compliance</p>
            </div>
          </div>
        </div>

        <Card className="glass-panel p-6 sm:p-8 space-y-6 border border-white/20 dark:border-white/5">
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                 <h4 className="text-4xl font-black tracking-tighter text-foreground">94.2%</h4>
                 <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-foreground border-none text-[8px] font-black px-1.5 py-0.5">OPTIMIZED</Badge>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Robustness</p>
                 </div>
              </div>
              <div className="w-24 h-24 bg-primary/100/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-inner">
                 <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
           </div>
           <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/100/5 blur-3xl rounded-full" />
        </Card>
      </section>
      )}

      {/* 11.5 Media Library */}
      {isSectionVisible('media') && (
      <section id="media" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background text-foreground flex items-center justify-center font-bold text-xs">M</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Media Library</h2>
          </div>
          <p className="text-muted-foreground font-medium px-10">Centralized repository for images, icons, and videos.</p>
        </div>
        <Card className="glass-panel p-6 sm:p-8 space-y-6 border border-white/20 dark:border-white/5">
           <div className="max-w-xs mx-auto space-y-4">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">The Media Library DAM (Digital Asset Management) is coming soon. Use the Logo Library for now.</p>
           </div>
        </Card>
      </section>
      )}

      {/* 13.5 Automation */}
      {isSectionVisible('automation') && (
      <section id="automation" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background text-foreground flex items-center justify-center font-bold text-xs">A</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Automation</h2>
          </div>
          <p className="text-muted-foreground font-medium px-10">AI-driven marketing workflows and content scheduling.</p>
        </div>
        <Card className="glass-panel p-6 sm:p-8 space-y-6 border border-white/20 dark:border-white/5">
           <div className="max-w-xs mx-auto space-y-4">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">Configure AI content engines and automated social posting rules.</p>
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl font-black text-[10px] tracking-widest h-10 border-border hover:bg-primary/10 hover:text-primary"
                onClick={() => toast({ title: 'Automation Engine', description: 'Configuring AI orchestration workflows...' })}
              >
                Configure Engine
              </Button>
           </div>
        </Card>
      </section>
      )}

      {/* 14.5 Performance */}
      {isSectionVisible('performance') && (
      <section id="performance" className="space-y-8 scroll-mt-24">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background text-foreground flex items-center justify-center font-bold text-xs">P</div>
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Performance</h2>
          </div>
          <p className="text-muted-foreground font-medium px-10">Marketing ROI and brand reach metrics.</p>
        </div>
        <Card className="glass-panel p-6 sm:p-8 space-y-6 border border-white/20 dark:border-white/5">
           <div className="max-w-xs mx-auto space-y-4">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">Performance tracking will be available after connecting social and web properties.</p>
           </div>
        </Card>
      </section>
      )}

      {/* Sticky Action Bar */}
      {!wizardMode && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-border/60 px-6 py-4 lg:pl-64 xl:pr-96 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] print:hidden">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-1 bg-background rounded-full border border-border/60">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Sync</span>
              </div>
              
              {lastSaved && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Auto-saved</span>
                  <span className="text-[11px] font-bold text-muted-foreground">{lastSaved.toLocaleTimeString()}</span>
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
                className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl h-11"
              >
                <Globe className="w-4 h-4" />
                Export PDF
              </Button>
              
              <div className="h-8 w-px bg-surface-3 hidden sm:block" />
              
              <Button 
                className="bg-primary hover:bg-brand-700 h-12 px-10 font-black text-sm uppercase tracking-tight rounded-xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all" 
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
      )}
      </form>
    </FormProvider>
  );
}
