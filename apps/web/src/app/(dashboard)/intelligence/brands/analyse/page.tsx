'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Input, Badge, useToast } from '@brandflow/ui';
import { ArrowLeft, Building2, FolderKanban, Globe, Sparkles, Fingerprint, Type, Droplet, Briefcase, Zap, Palette, Layout, Search, Layers, ChevronRight, CheckCircle2, Image as ImageIcon } from 'lucide-react';
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

  // Safe extraction helper for Visual Rules arrays
  const getVisualExtractionUrls = () => {
    if (!extractedData?.brand) return [];
    const extraction = (extractedData.brand.visualRules as any)?.visualExtraction;
    const catalog = ((extractedData.brand as any).assetCatalog as any)?.images;
    const urls = new Set<string>();

    if (extraction) {
      if (Array.isArray((extraction as any).heroImages)) (extraction as any).heroImages.forEach((url: string) => url && urls.add(url));
      if (Array.isArray((extraction as any).productVisuals)) (extraction as any).productVisuals.forEach((url: string) => url && urls.add(url));
      if (Array.isArray((extraction as any).uiScreenshots)) (extraction as any).uiScreenshots.forEach((url: string) => url && urls.add(url));
    }
    
    if (Array.isArray(catalog)) {
      catalog.forEach((img: any) => img?.url && urls.add(img.url));
    }
    
    return Array.from(urls);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {(customer || project) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 glass-panel">
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
            className="max-w-4xl mx-auto"
          >
            <div className="text-center space-y-4 mb-12 mt-12">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-4 text-primary ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.15)]">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-tight">
                Brand Intelligence Engine
              </h1>
              <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto font-medium">
                Enter any URL to extract a complete enterprise-grade brand identity, design language, and business DNA in seconds.
              </p>
            </div>

            <Card className="p-8 md:p-10 glass-premium rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
              
              <div className="space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 group/input">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <Input
                      placeholder="e.g. https://linear.app, https://stripe.com"
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSource()}
                      className="w-full pl-14 h-16 text-xl bg-surface-1/50 backdrop-blur-sm border-border/80 text-foreground rounded-2xl transition-all focus:ring-4 focus:ring-primary/20 focus:border-primary shadow-inner"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={addSource}
                    disabled={!currentUrl}
                    className="h-16 px-10 text-lg font-bold rounded-2xl bg-surface-2 hover:bg-surface-3 transition-colors border border-border shadow-sm hover:shadow-md"
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
                      className="space-y-4"
                    >
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-2">Target Sources</h3>
                      {sources.map((s, i) => (
                        <motion.div 
                          key={s.url}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-4 bg-surface-1/80 rounded-2xl group/source border border-border/80 hover:border-primary/50 transition-all shadow-sm backdrop-blur-md"
                        >
                          <div className="flex items-center gap-4 truncate pr-4">
                            <div className="p-2.5 bg-background rounded-xl text-primary shadow-sm border border-border/50">
                              <Globe className="w-5 h-5" />
                            </div>
                            <span className="text-lg font-medium text-foreground truncate">{s.url}</span>
                          </div>
                          <button 
                            onClick={() => removeSource(i)}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-3 rounded-xl transition-colors opacity-0 group-hover/source:opacity-100 flex-shrink-0"
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
                  className="w-full h-20 text-xl font-bold gap-4 bg-foreground text-background hover:bg-foreground/90 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] mt-8"
                  onClick={startAnalysis}
                  disabled={sources.length === 0 || analysisMutation.isPending}
                >
                  <Sparkles className="w-7 h-7" />
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
            className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto"
          >
            <div className="relative mb-16">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative glass-panel p-8 rounded-full shadow-2xl flex items-center justify-center border border-white/10 dark:border-white/5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-[6px] border-surface-2 border-t-primary border-r-primary shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                />
                <Sparkles className="absolute w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>

            <div className="w-full space-y-6 glass p-10 rounded-[2.5rem]">
              {processingSteps.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-700 ${
                    idx < activeProcessStep 
                      ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.5)] scale-100' 
                      : idx === activeProcessStep 
                        ? 'bg-primary/20 text-primary ring-2 ring-primary ring-offset-4 ring-offset-background scale-110 shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                        : 'bg-surface-2 text-muted-foreground scale-90 opacity-40'
                  }`}>
                    {idx < activeProcessStep ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                  </div>
                  <div className={`flex-1 transition-all duration-700 ${
                    idx < activeProcessStep 
                      ? 'opacity-70 font-medium text-lg' 
                      : idx === activeProcessStep 
                        ? 'opacity-100 font-bold text-xl translate-x-3 text-gradient'
                        : 'opacity-30 text-lg font-medium'
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
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 p-6 glass-panel rounded-3xl sticky top-4 z-50">
              <div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">{extractedData.brand.name}</h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2 mt-2 text-lg">
                  <Globe className="w-5 h-5" /> {extractedData.brand.website || 'No website detected'} 
                  <span className="text-border mx-3">•</span> 
                  <Briefcase className="w-5 h-5" /> {extractedData.brand.industry || 'General Industry'}
                </p>
              </div>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl h-14 px-8 shadow-[0_0_30px_rgba(var(--primary),0.4)] text-lg"
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Logo Showcase - Span 12 */}
              <motion.div className="md:col-span-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-8 glass-panel border-border/50 shadow-lg rounded-[2.5rem] overflow-hidden group/card relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8 relative z-10">
                    <Layout className="w-7 h-7 text-primary" /> Visual Identity & Logos
                  </h3>
                  <div className="flex gap-6 overflow-x-auto pb-6 snap-x relative z-10 scrollbar-hide">
                    {extractedData.brand.visualRules?.logoUrls?.map((logo, idx) => (
                      <div key={idx} className="flex-shrink-0 w-72 snap-center group">
                        <div className="aspect-[4/3] bg-surface-2 rounded-3xl flex items-center justify-center p-8 relative overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors shadow-sm group-hover:shadow-md">
                           {/* Transparency Checkerboard */}
                           <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />
                           <img src={logo.url || ''} alt={logo.name || 'Brand Logo'} className="max-h-full max-w-full object-contain relative z-10 drop-shadow-xl" />
                        </div>
                        <div className="mt-5 px-2">
                           <h4 className="font-bold text-foreground text-lg">{logo.name || 'Logo Variant'}</h4>
                           <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mt-1">{logo.type || 'Primary'}</p>
                        </div>
                      </div>
                    ))}
                    {(!extractedData.brand.visualRules?.logoUrls || extractedData.brand.visualRules.logoUrls.length === 0) && (
                       <div className="p-8 border-2 border-dashed border-border rounded-3xl flex items-center justify-center w-full bg-surface-1/50">
                          <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" /> No logos were reliably detected.
                          </p>
                       </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Brand DNA Visuals - Span 12 */}
              <motion.div className="md:col-span-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-8 glass-panel border-border/50 shadow-lg rounded-[2.5rem] relative overflow-hidden">
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8">
                    <Sparkles className="w-7 h-7 text-primary" /> Brand DNA & Visual Moodboard
                  </h3>
                  
                  {/* @ts-expect-error - ignore typing for now */}
                  {extractedData.brand.identity?.brandDNA?.dnaMoodboardDescriptors && extractedData.brand.identity.brandDNA.dnaMoodboardDescriptors.length > 0 && (
                    <div className="mb-10 p-6 bg-surface-1/60 rounded-3xl border border-border/40">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">AI Creative Direction Keywords</h4>
                       <div className="flex flex-wrap gap-3">
                         {/* @ts-expect-error - ignore typing for now */}
                         {extractedData.brand.identity.brandDNA.dnaMoodboardDescriptors.map((desc: string, i: number) => (
                            <Badge key={i} className="px-5 py-2.5 bg-background text-foreground hover:bg-surface-2 transition-colors border border-border shadow-sm text-sm font-semibold rounded-xl">
                              {desc}
                            </Badge>
                         ))}
                       </div>
                    </div>
                  )}

                  {getVisualExtractionUrls().length > 0 ? (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                      {getVisualExtractionUrls().map((imgUrl: string, idx: number) => (
                        <div key={idx} className="break-inside-avoid relative group rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-shadow bg-surface-2">
                           <img src={imgUrl} alt="Visual Extraction" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                              <p className="text-white text-sm font-bold truncate">Extracted Source Asset</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-border rounded-3xl flex items-center justify-center w-full bg-surface-1/50">
                      <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> No high-quality visual imagery was found.
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Color System - Span 6 */}
              <motion.div className="md:col-span-6 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-8 bg-background border-border/50 shadow-lg rounded-[2.5rem] h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Palette className="w-48 h-48" />
                  </div>
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8 relative z-10">
                    <Palette className="w-7 h-7 text-primary" /> Color Governance
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8 relative z-10 flex-1">
                    {[
                      { label: 'Primary', value: extractedData.brand.visualRules?.primaryColor },
                      { label: 'Secondary', value: extractedData.brand.visualRules?.secondaryColor },
                      { label: 'Accent', value: extractedData.brand.visualRules?.accentColor },
                      { label: 'Neutral', value: (extractedData.brand.visualRules as any)?.neutralColor },
                      { label: 'Semantic', value: (extractedData.brand.visualRules as any)?.semanticColor },
                    ].filter(c => c.value).map((color, idx) => (
                      <div key={idx} className="space-y-3 group/color">
                        <div 
                          className="w-full aspect-square rounded-3xl border border-border/30 shadow-inner flex items-end p-4 transition-transform group-hover/color:scale-[1.02]"
                          style={{ backgroundColor: color.value || '#F3F4F6' }}
                        >
                          <div className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-border/50 opacity-0 group-hover/color:opacity-100 transition-opacity">
                            {color.value || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{color.label}</div>
                          <div className="text-base font-semibold font-mono uppercase">{color.value || 'Not Extracted'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* @ts-expect-error - ignore typing for now */}
                  {extractedData.brand.visualRules?.colorSystem?.psychology && (
                    <div className="p-6 bg-surface-1 rounded-3xl border border-border/50 relative z-10">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Color Psychology
                      </h4>
                      {/* @ts-expect-error - ignore typing for now */}
                      <p className="text-base font-medium text-foreground leading-relaxed">{extractedData.brand.visualRules.colorSystem.psychology}</p>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Typography - Span 6 */}
              <motion.div className="md:col-span-6 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-8 bg-background border-border/50 shadow-lg rounded-[2.5rem] h-full relative overflow-hidden flex flex-col">
                  <div className="absolute right-0 bottom-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none -mb-12 -mr-8">
                    <span className="text-[280px] font-black leading-none">Aa</span>
                  </div>
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8 relative z-10">
                    <Type className="w-7 h-7 text-primary" /> Typography System
                  </h3>
                  
                  <div className="space-y-8 relative z-10 flex-1 flex flex-col justify-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Heading Font</div>
                      <div className="text-5xl font-bold tracking-tight text-foreground truncate" style={{ fontFamily: extractedData.brand.visualRules?.headingFont || 'inherit' }}>
                        {extractedData.brand.visualRules?.headingFont || 'System Default'}
                      </div>
                    </div>
                    
                    <div className="pt-8 border-t border-border/50">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Body Font</div>
                      <div className="text-3xl text-foreground truncate" style={{ fontFamily: extractedData.brand.visualRules?.bodyFont || 'inherit' }}>
                        {extractedData.brand.visualRules?.bodyFont || 'System Default'}
                      </div>
                      
                      <div className="mt-6 flex flex-wrap gap-4">
                        {(extractedData.brand.visualRules as any)?.supportingFont && (
                          <div className="bg-surface-1 px-4 py-2 rounded-xl border border-border/50">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Supporting Font</div>
                            <div className="text-sm text-foreground font-medium truncate" style={{ fontFamily: (extractedData.brand.visualRules as any).supportingFont }}>
                              {(extractedData.brand.visualRules as any).supportingFont}
                            </div>
                          </div>
                        )}
                        {(extractedData.brand.visualRules as any)?.backupFont && (
                          <div className="bg-surface-1 px-4 py-2 rounded-xl border border-border/50">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Backup Font</div>
                            <div className="text-sm text-foreground font-medium truncate" style={{ fontFamily: (extractedData.brand.visualRules as any).backupFont }}>
                              {(extractedData.brand.visualRules as any).backupFont}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-5 bg-surface-1 rounded-2xl border border-border/50 mt-6">
                        <p className="text-sm font-medium text-muted-foreground font-sans leading-relaxed">
                          {/* @ts-expect-error - ignore typing for now */}
                          {extractedData.brand.visualRules?.typographySystem?.personality || 'Clean and highly readable typography ideal for continuous long-form content.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Core Identity - Span 8 */}
              <motion.div className="md:col-span-8 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="p-8 h-full bg-surface-1/40 glass-panel border-border/50 shadow-lg rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
                    <Fingerprint className="w-64 h-64" />
                  </div>
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8 relative z-10">
                    <Fingerprint className="w-7 h-7 text-primary" /> Core Strategy & Positioning
                  </h3>
                  <div className="space-y-8 relative z-10">
                    {extractedData.brand.tagline && (
                      <div className="p-8 bg-background rounded-3xl border border-border/80 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                        <p className="text-3xl font-bold italic text-foreground tracking-tight">"{extractedData.brand.tagline}"</p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4 font-bold">Primary Tagline</p>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {extractedData.brand.positioning && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Market Positioning</h4>
                          <p className="text-foreground leading-relaxed text-lg font-medium">{extractedData.brand.positioning}</p>
                        </div>
                      )}
                      
                      {extractedData.brand.differentiators && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Key Differentiators</h4>
                          <p className="text-foreground leading-relaxed text-lg font-medium">{extractedData.brand.differentiators}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
                      {(extractedData.brand.identity as any)?.mission && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Mission</h4>
                          <p className="text-foreground leading-relaxed text-base font-medium">{(extractedData.brand.identity as any).mission}</p>
                        </div>
                      )}
                      {(extractedData.brand.identity as any)?.vision && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Vision</h4>
                          <p className="text-foreground leading-relaxed text-base font-medium">{(extractedData.brand.identity as any).vision}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Target Audience</h4>
                      <p className="text-foreground leading-relaxed text-lg font-medium">{
                        typeof extractedData.brand.audience === 'object' && extractedData.brand.audience !== null
                          ? (extractedData.brand.audience as any).primaryAudience || 'N/A'
                          : extractedData.brand.audience || 'N/A'
                      }</p>
                    </div>
                    <div className="pt-6 border-t border-border/50">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Tone of Voice</h4>
                      <div className="flex flex-wrap gap-3">
                        {extractedData.brand.tone.length > 0 ? extractedData.brand.tone.map((t) => (
                          <Badge key={t} className="px-5 py-2 bg-surface-2 text-foreground font-semibold rounded-xl border-border shadow-sm text-sm">
                            {t}
                          </Badge>
                        )) : <span className="text-muted-foreground">Not clearly defined</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Aesthetic Classification - Span 4 */}
              <motion.div className="md:col-span-4 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="p-8 h-full bg-gradient-to-br from-brand-600/10 to-transparent border-primary/20 shadow-lg rounded-[2.5rem]">
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8">
                    <Droplet className="w-7 h-7 text-primary" /> Brand Aesthetics
                  </h3>
                  
                  {/* @ts-expect-error - ignore typing for now */}
                  {extractedData.brand.designPreferences?.aestheticAnalysis?.classification ? (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Primary Classification</h4>
                        <div className="inline-block px-5 py-3 bg-background rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                          <span className="text-2xl font-black text-foreground">
                            {/* @ts-expect-error - ignore typing for now */}
                            {extractedData.brand.designPreferences.aestheticAnalysis.classification}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Visual Mood</h4>
                          <p className="text-foreground font-medium text-lg leading-relaxed">
                            {/* @ts-expect-error - ignore typing for now */}
                            {extractedData.brand.designPreferences.aestheticAnalysis.moodAnalysis}
                          </p>
                        </div>
                        <div className="pt-6 border-t border-border/50">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Design Reasoning</h4>
                          <p className="text-muted-foreground font-medium text-base leading-relaxed">
                            {/* @ts-expect-error - ignore typing for now */}
                            {extractedData.brand.designPreferences.aestheticAnalysis.styleReasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <div>
                         <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Inferred Style</h4>
                         <div className="inline-block px-5 py-3 bg-background rounded-2xl border border-border shadow-sm">
                            <span className="text-2xl font-black text-foreground">
                              {extractedData.brand.designPreferences?.preferredStyle || 'Modern'}
                            </span>
                          </div>
                       </div>
                        <p className="text-muted-foreground font-medium">Detailed aesthetic profiling was not fully extracted from the available evidence.</p>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Business Overview - Span 12 */}
              <motion.div className="md:col-span-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="p-8 bg-background border-border/50 shadow-lg rounded-[2.5rem]">
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-8">
                    <Layers className="w-7 h-7 text-primary" /> Intelligence Overview
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Company Details</h4>
                      <p className="text-foreground leading-relaxed text-lg font-medium">
                        {extractedData.brand.description || 'Not enough context found to generate a thorough description.'}
                      </p>
                      
                      {(extractedData.brand.identity as any)?.personality && (
                         <div className="pt-6 mt-6 border-t border-border/50">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Brand Personality</h4>
                            <p className="text-foreground leading-relaxed text-base font-medium">
                              {(extractedData.brand.identity as any).personality}
                            </p>
                         </div>
                      )}
                    </div>
                    
                    <div className="space-y-8">
                       {extractedData.brand.identity?.values && extractedData.brand.identity.values.length > 0 && (
                         <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Core Values</h4>
                            <div className="flex flex-wrap gap-3">
                              {extractedData.brand.identity.values.map((v) => (
                                <Badge key={v} variant="outline" className="px-4 py-2 text-sm font-semibold bg-surface-1 border-border shadow-sm rounded-xl">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                         </div>
                       )}

                        {/* @ts-expect-error - ignore typing for now */}
                       {extractedData.brand.identity?.businessOverview?.coreOfferings && extractedData.brand.identity.businessOverview.coreOfferings.length > 0 && (
                         <div className="pt-6 border-t border-border/50">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Detected Offerings</h4>
                            <ul className="space-y-3">
                              {/* @ts-expect-error - ignore typing for now */}
                              {extractedData.brand.identity.businessOverview.coreOfferings.map((o: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-foreground font-medium">
                                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <span>{o}</span>
                                </li>
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
