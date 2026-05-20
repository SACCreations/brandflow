'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  Badge, 
  Button, 
  Card, 
  useToast, 
  Input, 
  Progress,
  Skeleton 
} from '@brandflow/ui';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  History,
  Sliders,
  Settings,
  Layers,
  Heart,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Check,
  Maximize2
} from 'lucide-react';

interface BrandOption {
  id: string;
  name: string;
  industry?: string;
  tone?: string[];
  positioning?: string;
  visualRules?: any;
}

interface CampaignOption {
  id: string;
  name: string;
  status: string;
}

interface ImageJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  rawPrompt: string;
  finalPrompt?: string;
  category: string;
  settings: any;
  error?: string;
  createdAt: string;
  images?: Array<{
    id: string;
    asset: {
      id: string;
      cdnUrl: string;
      fileName: string;
    };
  }>;
}

const VISUAL_CATEGORIES = [
  { id: 'SMO_POSTER', label: 'SMO Poster', desc: 'Social platform graphics' },
  { id: 'FESTIVAL_BANNER', label: 'Festival & Event', desc: 'Themed holiday creatives' },
  { id: 'OFFER_CREATIVE', label: 'Promotional Offer', desc: 'High-contrast ad banners' },
  { id: 'WEBSITE_HERO', label: 'Website Hero', desc: 'Premium desktop headers' },
  { id: 'PRINTABLE_STANDEE', label: 'Printable Standee', desc: 'Tall layout printable assets' },
  { id: 'PRINTABLE_BANNER', label: 'Printable Banner', desc: 'Large scale prints' },
  { id: 'PRINTABLE_FLYER', label: 'Printable Flyer', desc: 'High density structured layouts' },
  { id: 'PRINTABLE_BROCHURE', label: 'Printable Brochure', desc: 'Multi-fold print layouts' },
  { id: 'AD_CREATIVE', label: 'Ad Banner', desc: 'Conversion marketing designs' },
  { id: 'SOCIAL_COVER', label: 'Social Media Cover Images', desc: 'Platform specific cover headers' },
  { id: 'THUMBNAIL', label: 'Thumbnail Images', desc: 'High-contrast video thumbnails' },
];

const PRESET_STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', desc: 'Cinematic studio lighting' },
  { id: '3d-render', label: '3D Render', desc: 'Volumetric elements' },
  { id: 'flat-vector', label: 'Flat Vector', desc: 'Modern minimal flat designs' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Futuristic high-neon themes' },
  { id: 'minimalist', label: 'Minimalist Glossy', desc: 'Elegant glossy glass textures' },
  { id: 'fantasy-watercolor', label: 'Fantasy Watercolor', desc: 'Artistic brushstrokes' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', desc: '1080x1080 (Poster)', width: 1080, height: 1080 },
  { id: '16:9', label: 'Landscape (16:9)', desc: '1920x1080 (Poster)', width: 1920, height: 1080 },
  { id: '9:16', label: 'Portrait (9:16)', desc: '1080x1920 (Poster)', width: 1080, height: 1920 },
  { id: '3:4', label: 'Portrait (3:4)', desc: '1080x1350 (Poster)', width: 1080, height: 1350 },
  
  { id: 'facebook_cover', label: 'Facebook Cover', desc: '851x315', width: 851, height: 315 },
  { id: 'twitter_cover', label: 'Twitter/X Cover', desc: '1500x500', width: 1500, height: 500 },
  { id: 'pinterest', label: 'Pinterest', desc: '734x413', width: 734, height: 413 },
  { id: 'linkedin_profile', label: 'LinkedIn Profile Cover', desc: '1584x396', width: 1584, height: 396 },
  { id: 'linkedin_business', label: 'LinkedIn Business Cover', desc: '1128x191', width: 1128, height: 191 },
  { id: 'youtube_mini', label: 'YouTube Desktop Mini', desc: '1546x423', width: 1546, height: 423 },
  { id: 'youtube_tablet', label: 'YouTube Tablet', desc: '1855x423', width: 1855, height: 423 },
  { id: 'youtube_max', label: 'YouTube Desktop Max', desc: '2560x423', width: 2560, height: 423 },
  { id: 'youtube_tv', label: 'YouTube TV', desc: '1546x1440', width: 1546, height: 1440 },

  { id: '4:3', label: 'Standard (4:3)', desc: '1024x768', width: 1024, height: 768 },
  { id: '2.35:1', label: 'Cinematic (2.35:1)', desc: '1920x817', width: 1920, height: 817 },
  { id: '2:3', label: 'Portrait (2:3)', desc: '1000x1500', width: 1000, height: 1500 },
];

export default function ImageGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const brandIdParam = searchParams.get('brandId');
  const campaignIdParam = searchParams.get('campaignId');

  // --- STATE ---
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SMO_POSTER');
  const [selectedRatioId, setSelectedRatioId] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');
  const [selectedProvider, setSelectedProvider] = useState<string>('stability');
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'hd'>('standard');
  const [promptText, setPromptText] = useState<string>('');

  // Manual dimensions for Custom Aspect Ratio
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);

  // Content Source
  const [contentSource, setContentSource] = useState<'manual' | 'approved' | 'library' | 'knowledge' | 'sources'>('manual');

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // --- QUERIES ---
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

  const { data: jobs = [], refetch: refetchJobs } = useQuery<ImageJob[]>({
    queryKey: ['image-generation-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/images/jobs');
      return res.data;
    },
  });

  // Active Job Polling
  useQuery({
    queryKey: ['active-image-job', activeJobId],
    queryFn: async () => {
      const res = await apiClient.get(`/images/jobs/${activeJobId}`);
      const job = res.data as ImageJob;

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        setActiveJobId(null);
        refetchJobs();
        queryClient.invalidateQueries({ queryKey: ['image-generation-jobs'] });
        
        if (job.status === 'COMPLETED') {
          toast({
            title: 'Generation successful!',
            description: 'Your creative image was added to the workspace.',
          });
        } else {
          toast({
            title: 'Generation failed',
            description: job.error || 'An error occurred during creative generation.',
            variant: 'destructive',
          });
        }
      }
      return job;
    },
    enabled: !!activeJobId,
    refetchInterval: 1500,
  });

  // Preloads
  useEffect(() => {
    if (brandIdParam) setSelectedBrandId(brandIdParam);
    if (campaignIdParam) setSelectedCampaignId(campaignIdParam);
  }, [brandIdParam, campaignIdParam]);

  useEffect(() => {
    if (!selectedBrandId && brands.length > 0 && brands[0]) {
      setSelectedBrandId(brands[0].id);
    }
  }, [selectedBrandId, brands]);

  // --- MUTATIONS ---
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!promptText.trim()) throw new Error('Prompt text cannot be empty');
      const ratio = isCustomSize
        ? { id: 'custom', width: customWidth, height: customHeight }
        : ASPECT_RATIOS.find((r) => r.id === selectedRatioId) || ASPECT_RATIOS[0]!;

      const res = await apiClient.post('/images/generate', {
        brandId: selectedBrandId,
        campaignId: selectedCampaignId || undefined,
        prompt: promptText.trim(),
        category: selectedCategory,
        settings: {
          width: ratio.width,
          height: ratio.height,
          aspectRatio: ratio.id,
          style: selectedStyle,
          provider: selectedProvider,
          quality: selectedQuality,
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setActiveJobId(data.id);
      toast({
        title: 'Job Queued Successfully',
        description: 'Generating your brand creative in the background.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to queue job',
        description: err?.response?.data?.message || err.message || 'Error occurred.',
        variant: 'destructive',
      });
    },
  });

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const selectedRatio = ASPECT_RATIOS.find((r) => r.id === selectedRatioId) || ASPECT_RATIOS[0]!;
  const generating = generateMutation.isPending || !!activeJobId;

  // Find active job detailed progress
  const activeJob = jobs.find((j) => j.id === activeJobId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-slate-800 pb-6">
        <div className="space-y-2">
          <Link href="/projects" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-2.5 border border-indigo-500/25">
              <Sparkles className="h-7 w-7 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                AI Image Creation Workspace
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-400 border border-indigo-500/30">PRO GATEWAY</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Trigger multi-tenant background generation queues, auto-enhance prompts using Brand Visual Identity, and log performance metrics.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generating || !selectedBrandId || !promptText.trim()} 
          className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Queue Creative Design
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Generation Parameters Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Step 1: Branding & Campaign Mapping */}
          <Card className="p-6 border-slate-800 bg-slate-900/50 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">1. Brand Visual Scope</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Brand Profile *</span>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Link to Campaign (Optional)</span>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  <option value="">Standalone Creative (No Campaign link)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Step 2: Formats & Presets */}
          <Card className="p-6 border-slate-800 bg-slate-900/50 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Sliders className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">2. Layout Format & Presets</h2>
            </div>

            {/* Creative Category */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Deliverable Category</span>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {VISUAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-start p-3 text-left rounded-xl border transition-all ${
                      selectedCategory === cat.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white ring-2 ring-indigo-500/25'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs font-bold">{cat.label}</span>
                    <span className="text-[9px] text-slate-500 mt-1 line-clamp-1">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Preset Visual Style</span>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {PRESET_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-start p-3 text-left rounded-xl border transition-all ${
                      selectedStyle === style.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white ring-2 ring-indigo-500/25'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs font-bold">{style.label}</span>
                    <span className="text-[9px] text-slate-500 mt-1 line-clamp-1">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Aspect Ratio Grid</span>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatioId(ratio.id)}
                    className={`flex items-start gap-3 p-3.5 text-left rounded-xl border transition-all ${
                      selectedRatioId === ratio.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white ring-2 ring-indigo-500/25'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className={`h-8 w-6 border-2 rounded transition-colors ${selectedRatioId === ratio.id ? 'border-indigo-400 bg-indigo-400/20' : 'border-slate-750'} flex-shrink-0`} style={{ 
                      aspectRatio: ratio.id === '1:1' ? '1' : ratio.id === '16:9' ? '16/9' : '9/16',
                      width: ratio.id === '16:9' ? '32px' : '20px'
                    }} />
                    <div>
                      <span className="text-xs font-bold block">{ratio.label}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{ratio.width} x {ratio.height}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Size Checkbox */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customSizeCheck"
                  checked={isCustomSize}
                  onChange={(e) => setIsCustomSize(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="customSizeCheck" className="text-xs font-bold text-slate-300">
                  Use Custom Dimensions
                </label>
              </div>

              {/* Custom Size Inputs */}
              {isCustomSize && (
                <div className="flex gap-4 items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Width (px)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                      className="w-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <span className="text-slate-500 font-bold mt-5">×</span>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Height (px)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                      className="w-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Step 3: Generative Directives & Content Source */}
          <Card className="p-6 border-slate-800 bg-slate-900/50 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <ImageIcon className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">3. Generative Directives</h2>
            </div>

            {/* Content Source Tabs */}
            <div className="grid grid-cols-5 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl mb-4">
              {[
                { id: 'manual', label: 'Manual Copy' },
                { id: 'approved', label: 'Approved Assets' },
                { id: 'library', label: 'Content Library' },
                { id: 'knowledge', label: 'Knowledge Hub' },
                { id: 'sources', label: 'Sources' }
              ].map(src => (
                <button
                  key={src.id}
                  onClick={() => setContentSource(src.id as any)}
                  className={`text-[10px] font-black py-2 rounded-lg transition-all uppercase tracking-wider ${
                    contentSource === src.id 
                      ? 'bg-slate-800 text-indigo-400 shadow-md border border-slate-700/50' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {contentSource === 'manual' && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex justify-between">
                    <span>Core Prompt Instruction *</span>
                    <span className="text-[9px] text-indigo-400 font-bold uppercase">Enhanced by Brand Prompt-Engine</span>
                  </span>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="E.g. Dynamic capture of organic product, droplets, studio light setup, visual symmetry, clean background placeholder"
                  />
                </div>
              )}

              {contentSource === 'approved' && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">✓ Found linked approved content</span>
                  <div className="bg-slate-950 border border-emerald-500/20 p-3 rounded-lg">
                    <p className="text-slate-300 text-xs font-medium leading-relaxed italic">
                      "Transform your business with cutting edge AI tools. Try our SaaS workspace today to boost team productivity by 300%."
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setPromptText('Transform your business with cutting edge AI tools. Try our SaaS workspace today to boost team productivity by 300%.');
                      setContentSource('manual');
                    }}
                    className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    Select & Edit <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {contentSource === 'library' && (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    'Product Launch: High fidelity product shot with modern background', 
                    'Seasonal Promo: Warm autumn colors, cozy aesthetic, typography space', 
                    'Corporate Testimonial: Professional office environment, clean white space', 
                    'Webinar Invite: Tech abstract graphics, deep blues and purples'
                  ].map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPromptText(t);
                        setContentSource('manual');
                      }}
                      className="border border-slate-850 hover:border-indigo-500/50 bg-slate-950 text-slate-400 hover:text-white rounded-xl p-3 text-left text-[11px] font-bold transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {contentSource === 'knowledge' && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Select Knowledge Base Reference</span>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                    onChange={(e) => {
                      if (e.target.value) {
                        setPromptText(`Base image on knowledge hub document: ${e.target.value}`);
                        setContentSource('manual');
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a document...</option>
                    <option value="Brand Identity Guidelines 2026">Brand Identity Guidelines 2026</option>
                    <option value="Product Spec Sheet v2">Product Spec Sheet v2</option>
                    <option value="Target Audience Persona Cards">Target Audience Persona Cards</option>
                  </select>
                </div>
              )}

              {contentSource === 'sources' && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">External Source / Competitor URL</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/reference-image"
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                      id="sourceUrlInput"
                    />
                    <button 
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors"
                      onClick={() => {
                        const val = (document.getElementById('sourceUrlInput') as HTMLInputElement)?.value;
                        if (val) {
                          setPromptText(`Recreate style inspired by external source: ${val}`);
                          setContentSource('manual');
                        }
                      }}
                    >
                      Use Source
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Trigger */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              <Settings className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
            </button>

            {showAdvanced && (
              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Preferred AI Provider Model</span>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <option value="stability">Stability AI SDXL (Base64 lossless stream)</option>
                    <option value="openai">OpenAI DALL-E 3 (High fidelity sandboxed)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Rendering Resolution Quality</span>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value as any)}
                  >
                    <option value="standard">Standard Quality (1 Credit)</option>
                    <option value="hd">High-Definition rendering (2 Credits)</option>
                  </select>
                </div>
              </div>
            )}
          </Card>

          {/* Active Job Progress Visualizer */}
          {generating && (
            <Card className="p-6 border-indigo-500/30 bg-indigo-950/10 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                    {activeJob?.status === 'PROCESSING' ? 'Running prompt and gateway paint pipeline...' : 'Awaiting RabbitMQ/BullMQ redis dispatch...'}
                  </span>
                </div>
                <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {activeJob?.progress ?? 0}% PROGRESS
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
                  style={{ width: `${activeJob?.progress ?? 0}%` }}
                />
              </div>

              {activeJob?.finalPrompt && (
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-[10px] text-slate-500 font-mono italic">
                  ENHANCED PROMPT: "{activeJob.finalPrompt}"
                </div>
              )}
            </Card>
          )}

          {/* Historical Generations Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Workspace Generation History ({jobs.length})</h2>
            </div>

            {jobs.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-slate-800 bg-slate-900/15">
                <ImageIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-500">No images generated in this workspace yet.</span>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => {
                  const img = job.images?.[0];
                  return (
                    <Card key={job.id} className="border-slate-800 bg-slate-900/30 overflow-hidden flex flex-col justify-between">
                      {job.status === 'COMPLETED' && img?.asset ? (
                        <div className="relative aspect-video w-full bg-slate-950 border-b border-slate-800">
                          <img 
                            src={img.asset.cdnUrl} 
                            alt={job.rawPrompt} 
                            className="h-full w-full object-cover filter brightness-[0.8] hover:brightness-100 transition-all"
                          />
                          <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                            <button 
                              onClick={() => alert(`CDN Link copied: ${img.asset.cdnUrl}`)}
                              className="p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-lg text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
                              title="Copy URL"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <a 
                              href={img.asset.cdnUrl} 
                              download={img.asset.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-lg text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
                              title="Download Asset"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2">
                          {job.status === 'FAILED' ? (
                            <>
                              <AlertCircle className="h-8 w-8 text-rose-500" />
                              <span className="text-xs font-extrabold text-rose-400 uppercase leading-none">Generation Failed</span>
                              <span className="text-[10px] text-slate-500 line-clamp-2">{job.error || 'Unknown error occurred'}</span>
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Processing ({job.progress}%)</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded leading-none">
                            {job.category} • {job.settings?.aspectRatio || '1:1'}
                          </span>
                          <p className="text-[11px] text-slate-300 font-bold mt-2 line-clamp-2 leading-relaxed">
                            "{job.rawPrompt}"
                          </p>
                        </div>

                        {job.status === 'COMPLETED' && img?.asset && (
                          <div className="flex gap-2 pt-1">
                            <Link href={`/create/creative?assetId=${img.asset.id}`} className="w-full">
                              <Button className="w-full gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 py-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-colors">
                                Open in Canvas <ExternalLink className="h-3 w-3 text-indigo-400" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Sticky Guidelines Sidebar (4 cols) */}
        <div className="lg:col-span-4 self-start sticky top-6 space-y-6">

          {/* Active Brand Guidelines Context */}
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <ImageIcon className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Brand Identity Guidelines</h3>
            </div>

            {!selectedBrandId ? (
              <div className="text-xs text-slate-500 text-center py-6">
                Please select a Brand to fetch visual assets guidelines.
              </div>
            ) : selectedBrand ? (
              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Color Palette Tokens</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {/* Display mock brand design tokens */}
                    {['#6366f1', '#a855f7', '#ec4899', '#f43f5e'].map((color) => (
                      <div key={color} className="flex items-center gap-1 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                        <div className="h-2.5 w-2.5 rounded-full border border-slate-800" style={{ backgroundColor: color }} />
                        {color}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Brand Industry Focus</span>
                  <span className="inline-block mt-2 rounded bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 capitalize">
                    {selectedBrand.industry || 'SAAS Automation'}
                  </span>
                </div>

                {selectedBrand.positioning && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Visual Vibe Direction</span>
                    <p className="mt-2 text-slate-400 font-medium leading-relaxed">
                      {selectedBrand.positioning}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 leading-none">
                    <Check className="h-4 w-4" /> Brand-safe prompting rules active
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                Resolving Brand Guidelines context...
              </div>
            )}
          </Card>

          {/* Pricing Info Alerts */}
          <Card className="p-4 border-slate-800 bg-slate-950 text-xs text-slate-500 space-y-2.5">
            <div className="flex items-center gap-2 font-black text-slate-400 uppercase tracking-wider text-[10px]">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Platform Billing Audits
            </div>
            <p className="leading-relaxed">
              DALL-E 3 & Stability generations consume workspace credits. 
            </p>
            <div className="bg-slate-900 border border-slate-850 p-2.5 rounded text-[10.5px] text-slate-400 font-bold">
              Standard: <span className="text-white">1 Credit (~4.0¢)</span><br />
              High-Definition: <span className="text-white">2 Credits (~8.0¢)</span>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
