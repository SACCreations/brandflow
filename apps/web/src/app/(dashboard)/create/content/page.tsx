'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Badge, Button, Card, useToast, ErrorBoundary } from '@brandflow/ui';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  BrainCircuit, 
  Target,
  FileText,
  AlertTriangle
} from 'lucide-react';

import { GeneratorConfigForm } from '@/features/content/components/GeneratorConfigForm';
import { TopicSelectionMatrix } from '@/features/content/components/TopicSelectionMatrix';
import { AdvancedTuningPanel } from '@/features/content/components/AdvancedTuningPanel';
import { QueueProgressMonitor } from '@/features/content/components/QueueProgressMonitor';

interface BriefContext {
  id: string;
  campaignId: string | null;
  objective: string;
  audience: string | null;
  platform: string | null;
  cta: string | null;
  tone: string | null;
  format: string | null;
  contentType: string | null;
  businessGoal: string | null;
  campaignTheme: string | null;
  metadata?: {
    brandId?: string | null;
    status?: 'draft' | 'in_review' | 'approved';
    deliverables?: string[];
    constraints?: string[];
  } | null;
  campaign?: {
    id: string;
    name: string;
  } | null;
}

interface BrandOption {
  id: string;
  name: string;
  industry?: string;
  tone?: string[];
  positioning?: string;
}

interface CampaignOption {
  id: string;
  name: string;
  status: string;
}

interface SuggestedTopic {
  id: string;
  name: string;
  tag: string;
}



export default function ContentGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const briefId = searchParams.get('briefId');
  const campaignIdParam = searchParams.get('campaignId');
  const brandIdParam = searchParams.get('brandId');

  // --- Zustand-like Local UI State ---
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Poster Content Structure');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');
  const [contentCount, setContentCount] = useState<number>(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Advanced options
  const [creativity, setCreativity] = useState<number>(0.75);
  const [cta, setCta] = useState<string>('');
  const [language, setLanguage] = useState<string>('english');
  const [seoOptimized, setSeoOptimized] = useState<boolean>(true);
  const [complianceStrictness, setComplianceStrictness] = useState<string>('medium');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Background Job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [completedContents, setCompletedContents] = useState<any[]>([]);

  // AbortController ref for cancelling stale topic suggestion fetches
  const topicAbortRef = useRef<AbortController | null>(null);
  // Job polling timeout tracking
  const jobStartTime = useRef<number>(0);
  const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minute max

  // --- Fetching Workspace Selections ---
  const { data: brands = [] } = useQuery<BrandOption[]>({
    queryKey: ['workspace-brands'],
    queryFn: async () => {
      const res = await apiClient.get('/brands');
      return res.data;
    },
  });

  const { data: campaigns = [] } = useQuery<CampaignOption[]>({
    queryKey: ['workspace-campaigns'],
    queryFn: async () => {
      const res = await apiClient.get('/campaigns');
      return res.data;
    },
  });

  // Brief Context (if present in search params)
  const { data: brief, isLoading: isBriefLoading } = useQuery({
    queryKey: ['content-brief-context', briefId],
    queryFn: async () => {
      const res = await apiClient.get(`/briefs/${briefId}`);
      return res.data as BriefContext;
    },
    enabled: !!briefId,
  });

  // Pre-load if Brief is present
  useEffect(() => {
    if (brief) {
      if (brief.metadata?.brandId) setSelectedBrandId(brief.metadata.brandId);
      if (brief.campaignId) setSelectedCampaignId(brief.campaignId);
      if (brief.platform) setSelectedPlatform(brief.platform);
      if (brief.cta) setCta(brief.cta);
    }
  }, [brief]);

  // Pre-load parameters from query params if brief is not present
  useEffect(() => {
    if (!briefId) {
      if (brandIdParam) setSelectedBrandId(brandIdParam);
      if (campaignIdParam) setSelectedCampaignId(campaignIdParam);
    }
  }, [briefId, brandIdParam, campaignIdParam]);

  // Auto-select first brand logic removed to allow explicit "-- Choose Brand --" selection

  // --- Fetch Brand Intelligence Context for Sticky Sidebar ---
  const { data: brandContext, isLoading: isBrandContextLoading } = useQuery({
    queryKey: ['brand-sidebar-context', selectedBrandId],
    queryFn: async () => {
      const res = await apiClient.get(`/brands/${selectedBrandId}/context`);
      return res.data;
    },
    enabled: !!selectedBrandId,
  });

  // --- Fetch AI Suggested Topics based on Brand & Category ---
  const { data: suggestedTopicsData, isFetching: isSuggestionsLoading, refetch: generateTopics } = useQuery<{ topics: SuggestedTopic[] }>({
    queryKey: ['topic-suggestions', selectedBrandId, selectedCategory],
    queryFn: async ({ signal }) => {
      // Cancel any previous in-flight request
      if (topicAbortRef.current) {
        topicAbortRef.current.abort();
      }
      const controller = new AbortController();
      topicAbortRef.current = controller;

      const res = await apiClient.post('/content/topics/suggest', {
        brandId: selectedBrandId, 
        category: selectedCategory 
      }, { signal: controller.signal });
      return res.data;
    },
    enabled: false,
  });

  // --- Background Job Polling Query ---
  useQuery({
    queryKey: ['bg-job-progress', activeJobId],
    queryFn: async () => {
      // Check for timeout
      if (Date.now() - jobStartTime.current > JOB_TIMEOUT_MS) {
        setActiveJobId(null);
        setJobStatus('failed');
        toast({
          title: 'Generation timed out',
          description: 'The batch job took too long. Please try again with fewer items.',
          variant: 'destructive',
        });
        return { status: 'failed' };
      }

      const res = await apiClient.get(`/content/jobs/${activeJobId}`);
      const job = res.data;
      
      setJobProgress(job.progress);
      setJobStatus(job.status);

      if (job.status === 'completed' || job.status === 'failed') {
        setActiveJobId(null);
        if (job.status === 'completed') {
          setCompletedContents(job.result?.results || []);
          toast({
            title: 'Batch completed!',
            description: `Successfully generated ${job.result?.results?.length} content items.`,
          });
        } else {
          toast({
            title: 'Batch generation failed',
            description: job.error || 'An error occurred during processing.',
            variant: 'destructive',
          });
        }
      }
      return job;
    },
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const job = query.state.data as any;
      if (job && (job.status === 'completed' || job.status === 'failed')) {
        return false;
      }
      // Exponential backoff: 1.5s → 3s → 5s → 5s (cap)
      const elapsed = Date.now() - jobStartTime.current;
      if (elapsed < 10000) return 1500;
      if (elapsed < 30000) return 3000;
      return 5000;
    },
  });

  const handleToggleTopic = (topicName: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicName)
        ? prev.filter((t) => t !== topicName)
        : [...prev, topicName]
    );
  };

  const handleSelectAllTopics = () => {
    const list = suggestedTopicsData?.topics.map((t) => t.name) || [];
    if (selectedTopics.length === list.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(list);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Client-side validation
      const errors: Record<string, string> = {};
      if (!selectedBrandId) errors['brand'] = 'Brand selection is required';
      if (!selectedPlatform) errors['platform'] = 'Platform is required';
      if (contentCount < 1 || contentCount > 50) errors['count'] = 'Batch count must be between 1-50';
      if (creativity < 0.1 || creativity > 1.5) errors['creativity'] = 'Creativity must be between 0.1-1.5';
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        throw new Error('Please fix validation errors before generating.');
      }
      setValidationErrors({});

      setCompletedContents([]);
      setJobProgress(0);
      setJobStatus('idle');

      const allTopics = [...selectedTopics];
      if (customTopic.trim()) {
        allTopics.push(customTopic.trim());
      }

      // If no topics are selected, default to the custom topic or category placeholder
      if (allTopics.length === 0) {
        allTopics.push(`${selectedCategory} generation for ${brands.find(b => b.id === selectedBrandId)?.name}`);
      }

      const res = await apiClient.post('/content/generate', {
        brandId: selectedBrandId || null,
        briefId: briefId || null,
        campaignId: selectedCampaignId || null,
        platform: selectedPlatform,
        type: selectedCategory.toLowerCase().replace(/ /g, '_'),
        topics: allTopics,
        count: contentCount,
        additionalContext: customTopic.trim() ? `Focus detail: ${customTopic.trim()}` : null,
        tone: brandContext?.brand?.tone?.[0] || null,
        // Advanced
        creativity,
        cta: cta || null,
        language,
        seoOptimized,
        complianceStrictness,
      });

      return res.data;
    },
    onSuccess: (data) => {
      if (data.async) {
        setActiveJobId(data.jobId);
        setJobStatus('generating');
        jobStartTime.current = Date.now();
        toast({
          title: 'Batch queue started',
          description: 'Generating content in the background queue.',
        });
      } else {
        toast({
          title: 'Generation complete',
          description: 'Your content draft has been generated successfully.',
        });
        if (data.content?.id) {
          router.push(`/create/content/${data.content.id}`);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error?.response?.data?.message || error?.message || 'Error occurred during generation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const backHref = selectedCampaignId ? `/campaigns/${selectedCampaignId}` : briefId ? `/create/brief?briefId=${briefId}` : '/projects';

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const loading = generateMutation.isPending || !!activeJobId;

  return (
    <ErrorBoundary backHref={backHref}>
    <div className="mx-auto max-w-7xl px-2 py-4 space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-border/60 pb-6 border-border">
        <div className="space-y-2">
          <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to campaign
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 dark:bg-primary/100/10">
              <BrainCircuit className="h-7 w-7 text-primary dark:text-brand-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                AI Generation Workspace
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-primary/100/20 dark:text-brand-400">v2.0</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Design multi-channel campaigns, suggested topics, and bulk content in background queues using brand context boundaries.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={loading || !selectedBrandId} 
          className="gap-2 bg-primary hover:bg-brand-700 text-foreground font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/10 transition hover:-translate-y-0.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate campaign drafts
        </Button>
      </div>

      {/* Main Workspace split */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Forms Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Step 1 & 2 */}
          <GeneratorConfigForm
            briefId={briefId}
            brands={brands}
            campaigns={campaigns}
            selectedBrandId={selectedBrandId}
            setSelectedBrandId={setSelectedBrandId}
            selectedCampaignId={selectedCampaignId}
            setSelectedCampaignId={setSelectedCampaignId}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            contentCount={contentCount}
            setContentCount={setContentCount}
            validationErrors={validationErrors}
          />

          {/* Step 3: Interactive Topic Planner */}
          <TopicSelectionMatrix
            selectedBrandId={selectedBrandId}
            isSuggestionsLoading={isSuggestionsLoading}
            suggestedTopicsData={suggestedTopicsData}
            generateTopics={generateTopics}
            selectedTopics={selectedTopics}
            handleSelectAllTopics={handleSelectAllTopics}
            handleToggleTopic={handleToggleTopic}
            customTopic={customTopic}
            setCustomTopic={setCustomTopic}
          />

          {/* Step 4: Advanced Tuning parameters */}
          <AdvancedTuningPanel
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            creativity={creativity}
            setCreativity={setCreativity}
            language={language}
            setLanguage={setLanguage}
            cta={cta}
            setCta={setCta}
            complianceStrictness={complianceStrictness}
            setComplianceStrictness={setComplianceStrictness}
            seoOptimized={seoOptimized}
            setSeoOptimized={setSeoOptimized}
          />

          {/* Active Generation Runner UI */}
          <QueueProgressMonitor
            loading={loading}
            jobStatus={jobStatus}
            jobProgress={jobProgress}
            completedContents={completedContents}
            generateMutation={generateMutation}
          />

        </div>

        {/* Right Sticky Guidelines Sidebar (4 cols) */}
        <div className="lg:col-span-4 self-start sticky top-6 space-y-6">
          
          {/* Active Brief contextual guide */}
          {brief && (
            <Card className="p-5 border border-primary/20 bg-brand-50/15 dark:border-primary/10 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-700 dark:text-brand-400">Brief Directives</h3>
              </div>

              <div className="space-y-3.5 text-xs font-medium text-muted-foreground text-foreground">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Objective</span>
                  <p className="mt-0.5 font-semibold text-foreground leading-relaxed">{brief.objective}</p>
                </div>

                {brief.audience && (
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Audience</span>
                    <p className="mt-0.5 text-foreground">{brief.audience}</p>
                  </div>
                )}

                {brief.cta && (
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">CTA Target</span>
                    <p className="mt-0.5 text-foreground font-bold text-foreground underline decoration-brand-500 underline-offset-4">{brief.cta}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Sticky Brand positioning summary */}
          <Card className="p-5 border border-border/60 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3 border-border">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Brand Context Rules</h3>
            </div>

            {!selectedBrandId ? (
              <div className="text-xs text-muted-foreground text-center py-6 leading-relaxed">
                Brand positioning context will dynamically display here.
              </div>
            ) : isBrandContextLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-2/3 bg-surface-2 rounded animate-pulse bg-surface-2" />
                <div className="h-10 w-full bg-surface-1 bg-background rounded animate-pulse dark:bg-gray-850" />
              </div>
            ) : brandContext ? (
              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Active Voice Tone</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(brandContext.brand?.tone || ['professional']).map((t: string) => (
                      <span key={t} className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted-foreground bg-surface-2 text-muted-foreground capitalize">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {brandContext.brand?.positioning && (
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Core Positioning</span>
                    <p className="mt-1 font-medium text-foreground">{brandContext.brand.positioning}</p>
                  </div>
                )}

                {/* Vector semantic fact matches */}
                {brandContext.knowledgeEntries?.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Linked Intelligence Atom Sources</span>
                    <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                      {brandContext.knowledgeEntries.slice(0, 3).map((e: any, idx: number) => (
                        <div key={idx} className="flex gap-2 p-2 bg-surface-1 bg-background rounded-lg text-[10px] font-medium text-muted-foreground bg-surface-2/40">
                          <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="line-clamp-2">{e.content || e}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-6">
                Failed to resolve brand constraints context.
              </div>
            )}
          </Card>

          {/* Global platform compliance alert */}
          <Card className="p-4 border border-dashed border-border bg-surface-1 dark:bg-gray-950/30 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Compliance guard active
            </div>
            <p className="leading-relaxed">
              Every copy is passed through automated LLM quality scoring gates before indexing to ensure tone compatibility and avoid blocked phrases.
            </p>
          </Card>

        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
