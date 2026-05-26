'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Input, Badge, useToast } from '@brandflow/ui';
import { ArrowLeft, Building2, FolderKanban, Globe, Sparkles, Fingerprint, Type, Droplet, Image as ImageIcon, Briefcase, Zap, Palette, Layout, Search, Layers, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { BrandAnalysisResult } from '@brandflow/shared';

interface CustomerContext {
  id: string;
  name: string;
  company: string | null;
  metadata?: Record<string, unknown> | null;
}

interface ProjectContext {
  id: string;
  name: string;
  customerId: string | null;
  metadata?: Record<string, unknown> | null;
}

interface CreatedBrand {
  id: string;
  name: string;
}

const processingSteps = [
  { id: 'crawl', text: 'Crawling multi-source environment...' },
  { id: 'visual', text: 'Extracting visual assets & UI tokens...' },
  { id: 'color', text: 'Deriving color psychology & typography...' },
  { id: 'dna', text: 'Synthesizing Business DNA & emotional identity...' },
  { id: 'finalize', text: 'Structuring enterprise brand intelligence...' },
];

export default function BrandAnalysePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const customerId = searchParams.get('customerId');
  const projectId = searchParams.get('projectId');
  const [sources, setSources] = useState<{ id?: string; url: string; status: 'idle' | 'pending' | 'done' | 'error' }[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [extractedData, setExtractedData] = useState<BrandAnalysisResult | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeProcessStep, setActiveProcessStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'processing') {
      interval = setInterval(() => {
        setActiveProcessStep((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Polling query for the background job
  useQuery({
    queryKey: ['brand-analysis-job', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const res = await apiClient.get(`/brands/analyse/${activeJobId}`);
      
      const data = res.data;
      if (data.status === 'completed') {
        setExtractedData(data.result);
        setSources((current) => current.map((source) => ({ ...source, status: 'done' })));
        setTimeout(() => setStep('review'), 1000); // Small delay to show complete state
        setActiveJobId(null);
      } else if (data.status === 'failed') {
        setSources((current) => current.map((source) => ({ ...source, status: 'error' })));
        setStep('input');
        setActiveJobId(null);
        toast({
          title: 'Analysis failed',
          description: data.error || 'The background analysis job failed.',
          variant: 'destructive',
        });
      }

      return data;
    },
    enabled: !!activeJobId,
    refetchInterval: 2000,
  });

  const { data: customer } = useQuery({
    queryKey: ['analysis-customer-context', customerId],
    queryFn: async () => {
      const res = await apiClient.get(`/customers/${customerId}`);
      return res.data as CustomerContext;
    },
    enabled: !!customerId,
  });

  const { data: project } = useQuery({
    queryKey: ['analysis-project-context', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data as ProjectContext;
    },
    enabled: !!projectId,
  });

  const addSource = () => {
    const trimmed = currentUrl.trim();
    if (!trimmed) return;

    const normalizedUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    try {
      const parsed = new URL(normalizedUrl);
      const finalUrl = parsed.toString();

      if (sources.some((source) => source.url === finalUrl)) {
        toast({
          title: 'Source already added',
          description: 'That URL is already queued for analysis.',
          variant: 'destructive',
        });
        return;
      }

      setSources([...sources, { url: finalUrl, status: 'idle' }]);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid website URL before adding it.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentUrl('');
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const analysisMutation = useMutation({
    mutationFn: async (urls: string[]) => {
      const analysisRes = await apiClient.post('/brands/analyse', {
        sources: urls.map((url) => ({
          type: 'url',
          value: url,
          label: url,
        })),
      });

      return analysisRes.data as { jobId: string; status: string };
    },
    onSuccess: (result) => {
      setActiveJobId(result.jobId);
    },
    onError: (error: any) => {
      setSources((current) => current.map((source) => ({ ...source, status: 'error' })));
      setStep('input');
      toast({
        title: 'Analysis failed',
        description: error.response?.data?.message || 'We could not analyze those sources. Please review the URLs and try again.',
        variant: 'destructive',
      });
    },
  });

  const startAnalysis = async () => {
    setStep('processing');
    setActiveProcessStep(0);
    setSources((current) => current.map((source) => ({ ...source, status: 'pending' })));
    analysisMutation.mutate(sources.map((source) => source.url));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {(customer || project) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-border/40 bg-surface-1/50 backdrop-blur-xl shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  {customer && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Client workflow</span>}
                  {project && <span className="inline-flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> Project workflow</span>}
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {project ? `Analyse a brand for ${project.name}` : `Analyse a brand for ${customer?.name}`}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {customer && (
                  <Link href={`/settings/clients/${customer.id}`}>
                    <Button variant="outline" className="gap-2 text-foreground hover:bg-surface-2 transition-colors">
                      <ArrowLeft className="h-4 w-4" /> Back to client
                    </Button>
                  </Link>
                )}
                {project && (
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" className="gap-2 text-foreground hover:bg-surface-2 transition-colors">
                      <ArrowLeft className="h-4 w-4" /> Back to project
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center space-y-4 mb-10">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2 text-primary ring-1 ring-primary/20 shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                Brand Intelligence Engine
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">
                Enter any URL to extract a complete enterprise-grade brand identity, design language, and business DNA in seconds.
              </p>
            </div>

            <Card className="p-8 md:p-10 bg-background/60 backdrop-blur-3xl border-border/50 shadow-2xl shadow-black/5 dark:shadow-none rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              
              <div className="space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="e.g. https://linear.app, https://stripe.com"
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSource()}
                      className="w-full pl-12 h-14 text-lg bg-surface-1 border-border/50 text-foreground rounded-2xl transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-inner"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={addSource}
                    disabled={!currentUrl}
                    className="h-14 px-8 text-base font-semibold rounded-2xl bg-surface-2 hover:bg-surface-3 transition-colors border border-border/50 shadow-sm"
                  >
                    Add Source
                  </Button>
                </div>

                <AnimatePresence>
                  {sources.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Target Sources</h3>
                      {sources.map((s, i) => (
                        <motion.div 
                          key={s.url}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-4 bg-surface-1/50 rounded-2xl group border border-border/50 hover:border-border transition-all shadow-sm backdrop-blur-md"
                        >
                          <div className="flex items-center gap-3 truncate pr-4">
                            <div className="p-2 bg-surface-2 rounded-lg text-foreground">
                              <Globe className="w-4 h-4" />
                            </div>
                            <span className="text-base font-medium text-foreground truncate">{s.url}</span>
                          </div>
                          <button 
                            onClick={() => removeSource(i)}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  size="lg"
                  className="w-full h-16 text-lg font-bold gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                  onClick={startAnalysis}
                  disabled={sources.length === 0 || analysisMutation.isPending}
                >
                  <Sparkles className="w-6 h-6" />
                  {analysisMutation.isPending ? 'Initializing Intelligence Engine...' : 'Run Intelligence Extraction'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto"
          >
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative bg-background border border-border/50 p-6 rounded-3xl shadow-2xl flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-full border-4 border-surface-2 border-t-primary border-r-primary"
                />
                <Sparkles className="absolute w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>

            <div className="w-full space-y-6">
              {processingSteps.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    idx < activeProcessStep 
                      ? 'bg-primary text-primary-foreground scale-100' 
                      : idx === activeProcessStep 
                        ? 'bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                        : 'bg-surface-2 text-muted-foreground scale-90 opacity-50'
                  }`}>
                    {idx < activeProcessStep ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div className={`flex-1 transition-all duration-500 ${
                    idx < activeProcessStep 
                      ? 'opacity-60 font-medium' 
                      : idx === activeProcessStep 
                        ? 'opacity-100 font-bold text-lg translate-x-2'
                        : 'opacity-30'
                  }`}>
                    {s.text}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'review' && extractedData && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], staggerChildren: 0.1 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-foreground">{extractedData.brand.name}</h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4" /> {extractedData.brand.website || 'No website detected'} 
                  <span className="text-border mx-2">•</span> 
                  <Briefcase className="w-4 h-4" /> {extractedData.brand.industry || 'General Industry'}
                </p>
              </div>
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-2xl h-14 px-8 shadow-xl shadow-black/10"
                onClick={() => {
                  if (extractedData?.brand) {
                    localStorage.setItem('brand_draft_new', JSON.stringify(extractedData.brand));
                    let url = '/intelligence/brands/new';
                    const params = new URLSearchParams();
                    if (customerId) params.set('customerId', customerId);
                    if (projectId) params.set('projectId', projectId);
                    if (params.toString()) {
                      url += `?${params.toString()}`;
                    }
                    router.push(url);
                  }
                }}
              >
                Approve & Save Brand <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Core Identity - Span 8 */}
              <motion.div className="md:col-span-8 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-8 h-full bg-background border-border/40 shadow-sm rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Fingerprint className="w-40 h-40" />
                  </div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Fingerprint className="w-6 h-6 text-primary" /> Core Strategy & Positioning
                  </h3>
                  <div className="space-y-6 relative z-10">
                    {extractedData.brand.tagline && (
                      <div className="p-6 bg-surface-1/50 rounded-2xl border border-border/50 backdrop-blur-sm">
                        <p className="text-2xl font-semibold italic text-foreground">"{extractedData.brand.tagline}"</p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3 font-bold">Primary Tagline</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Market Positioning</h4>
                      <p className="text-foreground leading-relaxed text-lg">{extractedData.brand.positioning || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Target Audience</h4>
                      <p className="text-foreground leading-relaxed text-lg">{extractedData.brand.audience || 'N/A'}</p>
                    </div>
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Tone of Voice</h4>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.brand.tone.length > 0 ? extractedData.brand.tone.map((t) => (
                          <Badge key={t} className="px-4 py-1.5 bg-surface-2 text-foreground font-medium rounded-full border-none">
                            {t}
                          </Badge>
                        )) : <span className="text-muted-foreground">Not clearly defined</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Aesthetic Classification - Span 4 */}
              <motion.div className="md:col-span-4 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-8 h-full bg-gradient-to-br from-surface-1 to-surface-2 border-border/40 shadow-sm rounded-3xl">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Sparkles className="w-6 h-6 text-primary" /> Aesthetic DNA
                  </h3>
                  
                  {/* @ts-ignore - Dynamic fields from extended schema */}
                  {extractedData.brand.designPreferences?.aestheticAnalysis?.classification ? (
                    <div className="space-y-6">
                      <div className="inline-block px-4 py-2 bg-background rounded-xl border border-border shadow-sm">
                        <span className="text-2xl font-black text-foreground">
                          {/* @ts-ignore */}
                          {extractedData.brand.designPreferences.aestheticAnalysis.classification}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Visual Mood</h4>
                          <p className="text-foreground font-medium">
                            {/* @ts-ignore */}
                            {extractedData.brand.designPreferences.aestheticAnalysis.moodAnalysis}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Creative Direction</h4>
                          <p className="text-foreground font-medium leading-relaxed">
                            {/* @ts-ignore */}
                            {extractedData.brand.designPreferences.aestheticAnalysis.creativeDirection}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div className="inline-block px-4 py-2 bg-background rounded-xl border border-border shadow-sm">
                          <span className="text-2xl font-black text-foreground">
                            {extractedData.brand.designPreferences?.preferredStyle || 'Modern'}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Detailed aesthetic profiling was not fully extracted from the available evidence.</p>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Color System - Span 6 */}
              <motion.div className="md:col-span-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-8 bg-background border-border/40 shadow-sm rounded-3xl h-full">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Palette className="w-6 h-6 text-primary" /> Color Governance
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Primary', value: extractedData.brand.visualRules?.primaryColor },
                      { label: 'Secondary', value: extractedData.brand.visualRules?.secondaryColor },
                      { label: 'Accent', value: extractedData.brand.visualRules?.accentColor },
                      { label: 'Neutral', value: (extractedData.brand.visualRules as any)?.neutralColor },
                    ].map((color, idx) => (
                      <div key={idx} className="space-y-2">
                        <div 
                          className="w-full aspect-square rounded-2xl border border-border/20 shadow-inner"
                          style={{ backgroundColor: color.value || '#F3F4F6' }}
                        />
                        <div>
                          <div className="text-xs font-bold uppercase text-muted-foreground">{color.label}</div>
                          <div className="text-sm font-medium">{color.value || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* @ts-ignore */}
                  {extractedData.brand.visualRules?.colorSystem?.psychology && (
                    <div className="p-4 bg-surface-1 rounded-2xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Color Psychology</h4>
                      {/* @ts-ignore */}
                      <p className="text-sm text-foreground">{extractedData.brand.visualRules.colorSystem.psychology}</p>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Typography - Span 6 */}
              <motion.div className="md:col-span-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-8 bg-background border-border/40 shadow-sm rounded-3xl h-full relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none select-none -mb-10 -mr-4">
                    <span className="text-[200px] font-black leading-none">Aa</span>
                  </div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Type className="w-6 h-6 text-primary" /> Typography System
                  </h3>
                  
                  <div className="space-y-6 relative z-10">
                    <div>
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Heading Font</div>
                      <div className="text-3xl font-bold tracking-tight" style={{ fontFamily: extractedData.brand.visualRules?.headingFont || 'inherit' }}>
                        {extractedData.brand.visualRules?.headingFont || 'System Default'}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/40">
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Body Font</div>
                      <div className="text-lg" style={{ fontFamily: extractedData.brand.visualRules?.bodyFont || 'inherit' }}>
                        {extractedData.brand.visualRules?.bodyFont || 'System Default'}
                        <p className="text-sm text-muted-foreground mt-2 font-sans">
                          {/* @ts-ignore */}
                          {extractedData.brand.visualRules?.typographySystem?.personality || 'Clean and highly readable for continuous long-form content.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Business Overview - Span 12 */}
              <motion.div className="md:col-span-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="p-8 bg-surface-1/30 border-border/40 shadow-sm rounded-3xl">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Layers className="w-6 h-6 text-primary" /> Intelligence Overview
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Company Description</h4>
                      <p className="text-foreground leading-relaxed">
                        {extractedData.brand.description || 'Not enough context found to generate a thorough description.'}
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                       {extractedData.brand.identity?.values && extractedData.brand.identity.values.length > 0 && (
                         <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Core Values</h4>
                            <div className="flex flex-wrap gap-2">
                              {extractedData.brand.identity.values.map((v) => (
                                <Badge key={v} variant="outline" className="px-3 py-1 text-sm bg-background">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                         </div>
                       )}

                        {/* @ts-ignore */}
                       {extractedData.brand.identity?.businessOverview?.coreOfferings && (
                         <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Detected Offerings</h4>
                            <ul className="list-disc list-inside space-y-1 text-foreground">
                              {/* @ts-ignore */}
                              {extractedData.brand.identity.businessOverview.coreOfferings.map((o: string) => (
                                <li key={o}>{o}</li>
                              ))}
                            </ul>
                         </div>
                       )}
                    </div>
                  </div>
                </Card>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
