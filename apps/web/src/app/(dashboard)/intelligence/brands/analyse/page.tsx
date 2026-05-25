'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, Input, Badge, useToast } from '@brandflow/ui';
import { ArrowLeft, Building2, FolderKanban, Globe, Sparkles } from 'lucide-react';
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

      return analysisRes.data as BrandAnalysisResult;
    },
    onSuccess: (result) => {
      setExtractedData(result);
      setSources((current) => current.map((source) => ({ ...source, status: 'done' })));
      setStep('review');
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
    setSources((current) => current.map((source) => ({ ...source, status: 'pending' })));
    analysisMutation.mutate(sources.map((source) => source.url));
  };

  const saveMutation = useMutation({
    mutationFn: async (data: BrandAnalysisResult['brand']) => {
      const brandResponse = await apiClient.post('/brands', data);
      const brand = brandResponse.data as CreatedBrand;

      if (customerId) {
        const currentCustomer = customer ?? ((await apiClient.get(`/customers/${customerId}`)).data as CustomerContext);
        await apiClient.patch(`/customers/${customerId}`, {
          metadata: {
            ...(currentCustomer.metadata ?? {}),
            primaryBrandId: brand.id,
            primaryBrandName: brand.name,
            brandLinkedAt: new Date().toISOString(),
          },
        });
      }

      if (projectId) {
        const currentProject = project ?? ((await apiClient.get(`/projects/${projectId}`)).data as ProjectContext);
        await apiClient.patch(`/projects/${projectId}`, {
          metadata: {
            ...(currentProject.metadata ?? {}),
            primaryBrandId: brand.id,
            primaryBrandName: brand.name,
            brandLinkedAt: new Date().toISOString(),
          },
        });
      }

      return brand;
    },
    onSuccess: () => {
      toast({ title: 'Brand created', description: 'Your analyzed brand profile is now saved and ready to use.' });

      if (projectId) {
        router.push(`/projects/${projectId}?brandCreated=1`);
        return;
      }

      if (customerId) {
        router.push(`/settings/clients/${customerId}?brandCreated=1`);
        return;
      }

      router.push('/intelligence/brands');
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.response?.data?.message || 'The analyzed brand draft could not be saved.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {(customer || project) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-brand-200 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-900/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700 dark:text-brand-400">
                  {customer && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Client workflow</span>}
                  {project && <span className="inline-flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> Project workflow</span>}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {project ? `Analyse a brand for ${project.name}` : `Analyse a brand for ${customer?.name}`}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Saving this analysis will link the created brand back to the {project ? 'project' : 'client'} so your agency workflow stays stitched together.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {customer && (
                  <Link href={`/settings/clients/${customer.id}`}>
                    <Button variant="outline" className="gap-2 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                      <ArrowLeft className="h-4 w-4" /> Back to client
                    </Button>
                  </Link>
                )}
                {project && (
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" className="gap-2 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                      <ArrowLeft className="h-4 w-4" /> Back to project
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Multi-Source Brand Analyser</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Extract identity from multiple websites, docs, and socials for 100% accuracy.</p>
      </div>
      <AnimatePresence mode="wait">

      {step === 'input' && (
        <motion.div
          key="input"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Knowledge Sources</h2>
                <p className="text-gray-500 dark:text-gray-400">The more sources you add, the better the AI understands your brand.</p>
              </div>

              <div className="flex gap-3">
                <Input
                  placeholder="https://yourcompany.com, linkedin.com/company/..., etc."
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSource()}
                  className="flex-1 h-12 text-lg dark:bg-gray-950 dark:border-gray-800 dark:text-white"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={addSource}
                  disabled={!currentUrl}
                  className="px-6 h-12 border-brand-200 text-brand-700 dark:border-brand-800 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30"
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
                    className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
                  >
                    {sources.map((s, i) => (
                      <motion.div 
                        key={s.url}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group border border-transparent hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{s.url}</span>
                        </div>
                        <button 
                          onClick={() => removeSource(i)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="w-full h-14 text-lg font-bold gap-2 bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-500/20"
                onClick={startAnalysis}
                disabled={sources.length === 0 || analysisMutation.isPending}
              >
                <Sparkles className="w-5 h-5" />
                {analysisMutation.isPending ? 'Analysing Sources…' : 'Start Comprehensive Analysis'}
              </Button>

              <div className="flex justify-center gap-6 pt-4 text-xs text-gray-400">
                <span>Supports Website URLs</span>
                <span>•</span>
                <span>Social Media Profiles</span>
                <span>•</span>
                <span>Case Studies</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {step === 'processing' && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-12 text-center space-y-6 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-900/50 border-t-brand-600 dark:border-t-brand-500 animate-spin"></div>
              <div className="absolute inset-4 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI is Analysing your Brand...</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                We're deeply analyzing your website and distilling your unique brand voice. This complex task may take up to 2 minutes.
              </p>
            </div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4">
               <div className="flex justify-center text-xs font-medium">
                 <span className="text-brand-600 dark:text-brand-400 animate-pulse">Processing evidence...</span>
               </div>
               <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                 <div className="absolute top-0 left-0 h-full bg-brand-600 rounded-full w-full animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
               </div>
            </div>
          </Card>
        </motion.div>
      )}

      {step === 'review' && extractedData && (
        <motion.div
          key="review"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 space-y-4 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Extracted Positioning
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg italic">
                "{extractedData.brand.positioning || 'Positioning could not be confidently extracted from the supplied sources.'}"
              </p>
              <div className="space-y-3">
                 <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Brand Name</h4>
                 <p className="text-gray-900 dark:text-white font-semibold">{extractedData.brand.name}</p>
              </div>
              <div className="space-y-3">
                 <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Primary Audience</h4>
                 <p className="text-gray-600 dark:text-gray-300">{extractedData.brand.audience || 'No clear audience signal was detected.'}</p>
              </div>
              <div className="space-y-3">
                 <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Differentiators</h4>
                 <p className="text-gray-600 dark:text-gray-300">{extractedData.brand.differentiators || 'No explicit differentiators were consistently supported across the evidence.'}</p>
              </div>
            </Card>

            <Card className="p-6 space-y-4 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Brand Voice & Tone</h3>
              <div className="flex flex-wrap gap-2">
                {extractedData.brand.tone.map((t) => (
                  <Badge key={t} className="px-3 py-1 bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-800">
                    {t}
                  </Badge>
                ))}
                {extractedData.brand.tone.length === 0 && (
                  <span className="text-sm text-gray-500">No high-confidence tone attributes were returned.</span>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analysis Diagnostics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Sources Used</div>
                  <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{extractedData.diagnostics.sourceCount}</div>
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Evidence Units</div>
                  <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{extractedData.diagnostics.evidenceCount}</div>
                </div>
              </div>
              <div className="space-y-3">
                {extractedData.diagnostics.sources.map((source) => (
                  <div key={`${source.type}-${source.label}`} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{source.label}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {source.type.replace('_', ' ')} • {source.evidenceCount} evidence item{source.evidenceCount === 1 ? '' : 's'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-brand-600 dark:bg-brand-700 text-white shadow-xl shadow-brand-500/20">
              <h3 className="text-lg font-bold mb-2">Analysis Complete!</h3>
              <p className="text-brand-100 text-sm mb-6">
                We've extracted a comprehensive profile including Strategy, Identity, and Visuals. Continue to the wizard to review and fine-tune your brand before saving.
              </p>
              <Button
                className="w-full bg-white dark:bg-gray-900 text-brand-600 hover:bg-brand-50 border-none h-12 text-lg font-bold shadow-lg"
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
                Review in Wizard →
              </Button>
            </Card>

            <Card className="p-6 border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/20">
               <h4 className="text-amber-800 dark:text-amber-500 font-bold mb-2">Governance Detected</h4>
               <ul className="text-sm text-amber-700 dark:text-amber-600 space-y-2">
                 {extractedData.brand.governance.bannedPhrases.map((p) => (
                   <li key={p} className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Banned: {p}
                   </li>
                 ))}
                 {extractedData.brand.governance.bannedPhrases.length === 0 && (
                   <li>No banned phrases were strongly evidenced in the supplied sources.</li>
                 )}
               </ul>
            </Card>

            {extractedData.diagnostics.warnings.length > 0 && (
              <Card className="p-6 border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-900/20">
                <h4 className="text-blue-900 dark:text-blue-400 font-bold mb-2">Review before saving</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  {extractedData.diagnostics.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
