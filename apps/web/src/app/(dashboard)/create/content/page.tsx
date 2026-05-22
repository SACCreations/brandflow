'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Badge, Button, Card, useToast } from '@brandflow/ui';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Target, 
  CheckCircle2, 
  Clock, 
  BrainCircuit, 
  Layers, 
  SlidersHorizontal,
  Plus,
  HelpCircle,
  FileText,
  Volume2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

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

const CATEGORIES = [
  { id: 'SMO Poster', label: 'SMO Poster', desc: 'Social posters with optimized copy' },
  { id: 'Reel Script', label: 'Reel & Video Script', desc: 'Engaging short-form video script' },
  { id: 'Blog', label: 'Blog Article', desc: 'SEO-optimized long-form article' },
  { id: 'Carousel', label: 'Carousel Post', desc: 'Multi-slide social media copy' },
  { id: 'Newsletter', label: 'Newsletter', desc: 'Conversion-oriented email newsletter' },
  { id: 'SOP', label: 'SOP / Doc', desc: 'Standard operating procedure guide' },
  { id: 'Print Material', label: 'Print Banner/Flyer', desc: 'Copy for offline physical banners' },
];

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'email', label: 'Email' },
  { id: 'web', label: 'Web Blog' },
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('SMO Poster');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');
  const [contentCount, setContentCount] = useState<number>(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>('');
  
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
    queryFn: async () => {
      const res = await apiClient.post('/content/topics/suggest', {
        brandId: selectedBrandId, 
        category: selectedCategory 
      });
      return res.data;
    },
    enabled: false,
  });

  // --- Background Job Polling Query ---
  useQuery({
    queryKey: ['bg-job-progress', activeJobId],
    queryFn: async () => {
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
      return 1500;
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
    <div className="mx-auto max-w-7xl px-2 py-4 space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-gray-100 pb-6 dark:border-gray-800">
        <div className="space-y-2">
          <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to campaign
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-50 p-2.5 dark:bg-brand-500/10">
              <BrainCircuit className="h-7 w-7 text-brand-600 dark:text-brand-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                AI Generation Workspace
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">v2.0</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Design multi-channel campaigns, suggested topics, and bulk content in background queues using brand context boundaries.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={loading || !selectedBrandId} 
          className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/10 transition hover:-translate-y-0.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate campaign drafts
        </Button>
      </div>

      {/* Main Workspace split */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Forms Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Step 1: Identity & Target mapping */}
          <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <Layers className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-gray-950 dark:text-white">1. Core Identity & Campaign Mapping</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Brand Selector *</span>
                <select
                  disabled={!!briefId}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
                  <option value="" disabled>-- Choose Brand --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {briefId && <span className="text-[10px] text-gray-400 font-medium">Locked to brief's designated brand.</span>}
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Link Campaign</span>
                <select
                  disabled={!!briefId}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  <option value="">Standalone Generation (No Campaign)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Step 2: Formats and Batch configuration */}
          <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <Calendar className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-gray-950 dark:text-white">2. Format Rules & Output Batching</h2>
            </div>

            <div className="space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block">Content Category</span>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-start p-3 text-left rounded-xl border transition-all ${
                      selectedCategory === cat.id
                        ? 'border-brand-600 bg-brand-50/40 text-brand-900 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{cat.label}</span>
                    <span className="text-[9px] text-gray-400 mt-1 line-clamp-1">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Target Social Platform</span>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                >
                  {PLATFORMS.map((plat) => (
                    <option key={plat.id} value={plat.id}>{plat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                  <span>Batch Copy Count</span>
                  {contentCount > 3 && (
                    <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase tracking-wider dark:bg-amber-500/10">Queue Process</span>
                  )}
                </span>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={contentCount}
                  onChange={(e) => setContentCount(Number(e.target.value))}
                >
                  <option value={1}>1 (Sync Variant)</option>
                  <option value={2}>2 (Compare Drafts)</option>
                  <option value={3}>3 (Fast Batch)</option>
                  <option value={5}>5 (Queue Generation)</option>
                  <option value={10}>10 (Queue Campaign)</option>
                  <option value={20}>20 (Enterprise Batch)</option>
                  <option value={50}>50 (Full SMO Sweep)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Step 3: Interactive Topic Planner */}
          <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-gray-950 dark:text-white">3. Intelligent Topic Selection</h2>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={async (e) => {
                    e.preventDefault();
                    const res = await generateTopics();
                    if (res.isError) {
                      toast({
                        title: 'Failed to generate topics',
                        description: (res.error as any)?.response?.data?.message || (res.error as any)?.message || 'Unknown error occurred.',
                        variant: 'destructive',
                      });
                    }
                  }} 
                  disabled={!selectedBrandId || isSuggestionsLoading}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold gap-1.5"
                >
                  {isSuggestionsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate Topics
                </Button>
                {suggestedTopicsData && suggestedTopicsData.topics.length > 0 && (
                  <button 
                    onClick={handleSelectAllTopics} 
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    {selectedTopics.length === suggestedTopicsData.topics.length ? 'Clear All' : 'Select All'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick AI Suggestions Grid */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                AI Suggested Quick Topics
                {isSuggestionsLoading && <Loader2 className="h-3 w-3 animate-spin text-brand-600" />}
              </span>
              
              {!selectedBrandId ? (
                <div className="text-center p-6 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
                  Pick a Brand in Step 1 to load dynamic, brand-positioning suggestions.
                </div>
              ) : isSuggestionsLoading ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : suggestedTopicsData?.topics?.length ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {suggestedTopicsData.topics.map((t) => {
                    const isPicked = selectedTopics.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleToggleTopic(t.name)}
                        className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                          isPicked
                            ? 'border-brand-600 bg-brand-50/20 text-brand-900 ring-2 ring-brand-500/10 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                            : 'border-gray-100 hover:border-gray-200 text-gray-700 hover:bg-gray-50/50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        <div className="space-y-1 pr-4">
                          <div className="text-xs font-semibold leading-snug line-clamp-1">{t.name}</div>
                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{t.tag}</div>
                        </div>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                          isPicked ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300'
                        }`}>
                          {isPicked && <span className="text-[8px] font-bold">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
                  No explicit suggested topics returned. Use the custom topic box below.
                </div>
              )}
            </div>

            {/* Custom Input */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Custom Topic Focus (Optional)</span>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="E.g. Launching the biryani festival offer for local delivery"
              />
            </div>
          </Card>

          {/* Step 4: Advanced Tuning parameters */}
          <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-gray-950 dark:text-white">4. Advanced Model Parameters</h2>
              </div>
              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                    <span>Creativity Slider</span>
                    <span className="font-bold text-brand-600">{creativity}</span>
                  </span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:bg-gray-800"
                    value={creativity}
                    onChange={(e) => setCreativity(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-semibold uppercase">
                    <span>Deterministic</span>
                    <span>Highly Creative</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Target Language</span>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="english">English (US)</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="hindi">Hindi</option>
                    <option value="arabic">Arabic</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Call-to-Action (CTA) Focus</span>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="E.g. Visit Website, Order Now"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Strict Quality Compliance</span>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    value={complianceStrictness}
                    onChange={(e) => setComplianceStrictness(e.target.value)}
                  >
                    <option value="low">Standard QC checks</option>
                    <option value="medium">Medium alignment gate</option>
                    <option value="high">Strict compliance audit</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl dark:bg-gray-800/20">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-white">SEO Optimization Module</div>
                    <div className="text-[10px] text-gray-400 font-medium">Embed keyword indexing and search metadata in headers.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={seoOptimized}
                      onChange={(e) => setSeoOptimized(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              </div>
            )}
          </Card>

          {/* Active Generation Runner UI */}
          {loading && (
            <Card className="p-6 border border-brand-200 bg-brand-50/20 dark:border-brand-500/30 dark:bg-brand-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
                  <span className="text-sm font-extrabold text-brand-900 dark:text-brand-300">
                    {jobStatus === 'generating' ? 'Running batch queue process...' : 'Sending transaction request...'}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-brand-600 bg-brand-100 px-2 py-0.5 rounded dark:bg-brand-500/20 dark:text-brand-400">
                  {jobProgress}% Done
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-800 overflow-hidden">
                <div 
                  className="bg-brand-600 h-2 rounded-full transition-all duration-500 dark:bg-brand-500 shadow-md shadow-brand-500/30"
                  style={{ width: `${jobProgress}%` }}
                />
              </div>

              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                <span>Concurrently processing items</span>
                <span>Do not close this tab</span>
              </div>
            </Card>
          )}

          {/* Queue completed variants results list */}
          {completedContents.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-500">Generated Batch Outputs ({completedContents.length})</h3>
              </div>

              <div className="grid gap-4">
                {completedContents.map((c, idx) => (
                  <Card key={idx} className={`p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    c.status === 'success' 
                      ? 'border-emerald-100 bg-emerald-50/10 dark:border-emerald-500/20'
                      : 'border-red-100 bg-red-50/10 dark:border-red-500/20'
                  }`}>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{c.topic}</div>
                      <div className="text-[10px] flex items-center gap-2">
                        <span className="text-gray-400">Index: {idx + 1}</span>
                        <span className="text-gray-400">•</span>
                        {c.status === 'success' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider text-[9px] dark:bg-emerald-500/10 dark:text-emerald-400">Draft created</span>
                        ) : (
                          <span className="text-red-700 bg-red-50 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider text-[9px] dark:bg-red-500/10 dark:text-red-400">Failed: {c.error || 'Unknown error'}</span>
                        )}
                      </div>
                    </div>

                    {c.status === 'success' && c.contentId && (
                      <Link href={`/create/content/${c.contentId}`}>
                        <Button variant="outline" className="gap-1.5 text-xs font-bold">
                          Open in Editor <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sticky Guidelines Sidebar (4 cols) */}
        <div className="lg:col-span-4 self-start sticky top-6 space-y-6">
          
          {/* Active Brief contextual guide */}
          {brief && (
            <Card className="p-5 border border-brand-200 bg-brand-50/15 dark:border-brand-500/10 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-700 dark:text-brand-400">Brief Directives</h3>
              </div>

              <div className="space-y-3.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Objective</span>
                  <p className="mt-0.5 font-semibold text-gray-900 dark:text-white leading-relaxed">{brief.objective}</p>
                </div>

                {brief.audience && (
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Audience</span>
                    <p className="mt-0.5 text-gray-800 dark:text-gray-200">{brief.audience}</p>
                  </div>
                )}

                {brief.cta && (
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">CTA Target</span>
                    <p className="mt-0.5 text-gray-900 font-bold dark:text-white underline decoration-brand-500 underline-offset-4">{brief.cta}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Sticky Brand positioning summary */}
          <Card className="p-5 border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 dark:border-gray-800">
              <BrainCircuit className="h-4 w-4 text-brand-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Brand Context Rules</h3>
            </div>

            {!selectedBrandId ? (
              <div className="text-xs text-gray-400 text-center py-6 leading-relaxed">
                Brand positioning context will dynamically display here.
              </div>
            ) : isBrandContextLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse dark:bg-gray-800" />
                <div className="h-10 w-full bg-gray-50 rounded animate-pulse dark:bg-gray-850" />
              </div>
            ) : brandContext ? (
              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Active Voice Tone</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(brandContext.brand?.tone || ['professional']).map((t: string) => (
                      <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400 capitalize">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {brandContext.brand?.positioning && (
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Core Positioning</span>
                    <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">{brandContext.brand.positioning}</p>
                  </div>
                )}

                {/* Vector semantic fact matches */}
                {brandContext.knowledgeEntries?.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Linked Intelligence Atom Sources</span>
                    <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                      {brandContext.knowledgeEntries.slice(0, 3).map((e: any, idx: number) => (
                        <div key={idx} className="flex gap-2 p-2 bg-gray-50 rounded-lg text-[10px] font-medium text-gray-500 dark:bg-gray-800/40">
                          <FileText className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                          <span className="line-clamp-2">{e.content || e}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-6">
                Failed to resolve brand constraints context.
              </div>
            )}
          </Card>

          {/* Global platform compliance alert */}
          <Card className="p-4 border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/30 text-xs text-gray-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Compliance guard active
            </div>
            <p className="leading-relaxed">
              Every copy is passed through automated LLM quality scoring gates before indexing to ensure tone compatibility and avoid blocked phrases.
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}
