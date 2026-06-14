'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CONTENT_CATEGORY_TO_IMAGE_CATEGORY } from '@brandflow/shared';
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
  Settings,
  Layers,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Type,
  Target,
  Palette,
  Layout,
  Monitor,
  Key,
  X,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { useImageSocket, type ImageJobProgress } from '@/hooks/use-image-socket';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandOption {
  id: string;
  name: string;
  industry?: string;
  tone?: any;
  positioning?: string;
  tagline?: string;
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
  platform?: string;
  settings: any;
  posterContext?: {
    headline?: string;
    subheadline?: string;
    cta?: string;
  };
  error?: string;
  createdAt: string;
  images?: Array<{
    id: string;
    asset: {
      id: string;
      cdnUrl: string;
      fileName: string;
    };
    metadata?: {
      provider?: string;
      model?: string;
      isMock?: boolean;
      costCents?: number;
    };
  }>;
}

// ─── Platform Definitions ────────────────────────────────────────────────────

interface PlatformSpec {
  id: string;
  label: string;
  group: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'portrait' | 'landscape' | 'square';
}

const PLATFORMS_GROUPED: Record<string, PlatformSpec[]> = {
  Instagram: [
    { id: 'instagram_post',    label: 'Post (1:1)',     group: 'Instagram', width: 1080, height: 1080, aspectRatio: '1:1',    orientation: 'square' },
    { id: 'instagram_story',   label: 'Story (9:16)',   group: 'Instagram', width: 1080, height: 1920, aspectRatio: '9:16',   orientation: 'portrait' },
    { id: 'instagram_reel',    label: 'Reel (9:16)',    group: 'Instagram', width: 1080, height: 1920, aspectRatio: '9:16',   orientation: 'portrait' },
    { id: 'instagram_ad',      label: 'Ad (1:1)',       group: 'Instagram', width: 1080, height: 1080, aspectRatio: '1:1',    orientation: 'square' },
  ],
  Facebook: [
    { id: 'facebook_post',     label: 'Post',           group: 'Facebook',  width: 1200, height: 630,  aspectRatio: '1.91:1', orientation: 'landscape' },
    { id: 'facebook_ad',       label: 'Ad Creative',    group: 'Facebook',  width: 1200, height: 628,  aspectRatio: '1.91:1', orientation: 'landscape' },
    { id: 'facebook_story',    label: 'Story (9:16)',   group: 'Facebook',  width: 1080, height: 1920, aspectRatio: '9:16',   orientation: 'portrait' },
    { id: 'facebook_cover',    label: 'Cover Photo',    group: 'Facebook',  width: 851,  height: 315,  aspectRatio: '851:315',orientation: 'landscape' },
  ],
  LinkedIn: [
    { id: 'linkedin_post',     label: 'Post',           group: 'LinkedIn',  width: 1200, height: 627,  aspectRatio: '1.91:1', orientation: 'landscape' },
    { id: 'linkedin_banner',   label: 'Banner (4:1)',   group: 'LinkedIn',  width: 1584, height: 396,  aspectRatio: '4:1',    orientation: 'landscape' },
    { id: 'linkedin_ad',       label: 'Sponsored Ad',   group: 'LinkedIn',  width: 1200, height: 627,  aspectRatio: '1.91:1', orientation: 'landscape' },
    { id: 'linkedin_story',    label: 'Story (9:16)',   group: 'LinkedIn',  width: 1080, height: 1920, aspectRatio: '9:16',   orientation: 'portrait' },
  ],
  'X (Twitter)': [
    { id: 'x_post',            label: 'Post (16:9)',    group: 'X',         width: 1600, height: 900,  aspectRatio: '16:9',   orientation: 'landscape' },
    { id: 'x_ad',              label: 'Ad',             group: 'X',         width: 1200, height: 675,  aspectRatio: '16:9',   orientation: 'landscape' },
    { id: 'x_cover',           label: 'Cover (3:1)',    group: 'X',         width: 1500, height: 500,  aspectRatio: '3:1',    orientation: 'landscape' },
  ],
  YouTube: [
    { id: 'youtube_thumbnail', label: 'Thumbnail',      group: 'YouTube',   width: 1280, height: 720,  aspectRatio: '16:9',   orientation: 'landscape' },
    { id: 'youtube_banner',    label: 'Channel Art',    group: 'YouTube',   width: 2560, height: 1440, aspectRatio: '16:9',   orientation: 'landscape' },
    { id: 'youtube_post',      label: 'Post (1:1)',     group: 'YouTube',   width: 1080, height: 1080, aspectRatio: '1:1',    orientation: 'square' },
  ],
  Website: [
    { id: 'website_banner',    label: 'Hero Banner',    group: 'Website',   width: 1920, height: 600,  aspectRatio: '16:5',   orientation: 'landscape' },
    { id: 'website_square',    label: 'Square',         group: 'Website',   width: 800,  height: 800,  aspectRatio: '1:1',    orientation: 'square' },
    { id: 'website_blog',      label: 'Blog Cover',     group: 'Website',   width: 1200, height: 630,  aspectRatio: '1.91:1', orientation: 'landscape' },
  ],
  'Google Ads': [
    { id: 'google_display',    label: 'Display (MPU)',  group: 'Google Ads',width: 300,  height: 250,  aspectRatio: '6:5',    orientation: 'square' },
    { id: 'google_leaderboard',label: 'Leaderboard',   group: 'Google Ads',width: 728,  height: 90,   aspectRatio: '728:90', orientation: 'landscape' },
    { id: 'google_billboard',  label: 'Billboard',     group: 'Google Ads',width: 970,  height: 250,  aspectRatio: '970:250',orientation: 'landscape' },
  ],
  Email: [
    { id: 'email_header',      label: 'Email Header',   group: 'Email',     width: 600,  height: 200,  aspectRatio: '3:1',    orientation: 'landscape' },
  ],
};

// Flat list for lookup
const ALL_PLATFORMS = Object.values(PLATFORMS_GROUPED).flat();

const getPlatformSpec = (id: string): PlatformSpec =>
  ALL_PLATFORMS.find(p => p.id === id) || ALL_PLATFORMS[0]!;

// ─── Category Definitions ────────────────────────────────────────────────────

const VISUAL_CATEGORIES = [
  { id: 'SMO_POSTER',        label: 'SMO Poster',          desc: 'Social platform graphics' },
  { id: 'FESTIVAL_BANNER',   label: 'Festival & Event',    desc: 'Themed holiday creatives' },
  { id: 'OFFER_CREATIVE',    label: 'Promotional Offer',   desc: 'High-contrast ad banners' },
  { id: 'WEBSITE_HERO',      label: 'Website Hero',        desc: 'Premium desktop headers' },
  { id: 'PRINTABLE_STANDEE', label: 'Printable Standee',   desc: 'Tall layout printable assets' },
  { id: 'PRINTABLE_BANNER',  label: 'Printable Banner',    desc: 'Large scale prints' },
  { id: 'PRINTABLE_FLYER',   label: 'Printable Flyer',     desc: 'High density structured layouts' },
  { id: 'PRINTABLE_BROCHURE',label: 'Printable Brochure',  desc: 'Multi-fold print layouts' },
  { id: 'AD_CREATIVE',       label: 'Ad Banner',           desc: 'Conversion marketing designs' },
  { id: 'SOCIAL_COVER',      label: 'Social Cover',        desc: 'Platform specific cover headers' },
  { id: 'THUMBNAIL',         label: 'Thumbnail',           desc: 'High-contrast video thumbnails' },
];

const PRESET_STYLES = [
  { id: 'modern-premium',    label: 'Modern Premium',      desc: 'Clean, bold, professional' },
  { id: 'photorealistic',    label: 'Photorealistic',      desc: 'Cinematic studio lighting' },
  { id: '3d-render',         label: '3D Render',           desc: 'Volumetric elements' },
  { id: 'flat-vector',       label: 'Flat Vector',         desc: 'Modern minimal flat designs' },
  { id: 'cyberpunk',         label: 'Cyberpunk Neon',      desc: 'Futuristic high-neon themes' },
  { id: 'minimalist',        label: 'Minimalist Glossy',   desc: 'Elegant glossy glass textures' },
];

const GROUP_ICONS: Record<string, string> = {
  Instagram: '📸',
  Facebook: '👍',
  LinkedIn: '💼',
  'X (Twitter)': '✕',
  YouTube: '▶️',
  Website: '🌐',
  'Google Ads': '🎯',
  Email: '📧',
};

// ─── Pipeline Stages ─────────────────────────────────────────────────────────

const STAGES = [
  { key: 'queued',     label: 'Queued' },
  { key: 'enhancing',  label: 'Brand Analysis' },
  { key: 'generating', label: 'Generating Poster' },
  { key: 'finalizing', label: 'Finalizing' },
  { key: 'done',       label: 'Complete' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImageGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const brandIdParam    = searchParams.get('brandId');
  const campaignIdParam = searchParams.get('campaignId');
  const categoryParam   = searchParams.get('category');
  const contentIdParam  = searchParams.get('contentId');

  // ─── State ────────────────────────────────────────────────────────────────
  const [selectedBrandId,    setSelectedBrandId]    = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedCategory,   setSelectedCategory]   = useState<string>('SMO_POSTER');
  const [selectedPlatform,   setSelectedPlatform]   = useState<string>('instagram_post');
  const [selectedStyle,      setSelectedStyle]       = useState<string>('modern-premium');
  const [selectedProvider,   setSelectedProvider]   = useState<string>('openai');
  const [selectedQuality,    setSelectedQuality]    = useState<'standard' | 'hd'>('standard');

  // Content mode: 'content' = link approved content | 'manual' = type fields directly
  const [contentMode,   setContentMode]   = useState<'content' | 'manual'>('manual');
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  // Structured poster fields
  const [headlineText,    setHeadlineText]    = useState<string>('');
  const [subheadlineText, setSubheadlineText] = useState<string>('');
  const [ctaText,         setCtaText]         = useState<string>('');

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'FAILED' | 'PROCESSING'>('all');

  const [activeJobId, setActiveJobId]   = useState<string | null>(null);
  const [wsProgress,  setWsProgress]   = useState<ImageJobProgress | null>(null);
  const [activePlatformGroup, setActivePlatformGroup] = useState<string>('Instagram');

  // Bulk Delete State
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // ─── Image API Key Setup Modal ────────────────────────────────────────────
  const [showKeyModal,  setShowKeyModal]  = useState<boolean>(false);
  const [imageKeyInput, setImageKeyInput] = useState<string>('');
  const [showKeyInput,  setShowKeyInput]  = useState<boolean>(false);
  const [savingKey,     setSavingKey]     = useState<boolean>(false);

  // ─── Validation ───────────────────────────────────────────────────────────
  const canSubmit = useMemo(() => {
    const hasContent = contentMode === 'content'
      ? !!selectedContentId
      : headlineText.trim().length >= 5;
    return !!selectedBrandId && !!selectedPlatform && !!selectedCategory && hasContent && !activeJobId;
  }, [selectedBrandId, selectedPlatform, selectedCategory, contentMode, selectedContentId, headlineText, activeJobId]);

  // ─── Cost Estimation ──────────────────────────────────────────────────────
  const estimatedCost = useMemo(() => {
    if (selectedProvider === 'openai') return selectedQuality === 'hd' ? 8.0 : 4.0;
    if (selectedProvider === 'flux') return 3.5;
    if (selectedProvider === 'nvidia') return 1.5;
    return 3.0;
  }, [selectedProvider, selectedQuality]);

  // ─── WebSocket ────────────────────────────────────────────────────────────
  const { isConnected: wsConnected } = useImageSocket({
    enabled: true,
    onProgress: (payload) => {
      if (payload.jobId === activeJobId) setWsProgress(payload);
    },
    onCompleted: (payload) => {
      if (payload.jobId === activeJobId) {
        setWsProgress(payload);
        setActiveJobId(null);
        refetchJobs();
        queryClient.invalidateQueries({ queryKey: ['image-generation-jobs'] });
        toast({ title: '✅ Poster Generated!', description: 'Your branded marketing poster is ready.' });
      }
    },
    onFailed: (payload) => {
      if (payload.jobId === activeJobId) {
        setWsProgress(payload);
        setActiveJobId(null);
        refetchJobs();
        toast({
          title: 'Generation failed',
          description: payload.error || 'An error occurred during poster generation.',
          variant: 'destructive',
        });
      }
    },
  });

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: brands = [], isLoading: brandsLoading } = useQuery<BrandOption[]>({
    queryKey: ['workspace-brands'],
    queryFn: async () => (await apiClient.get('/brands')).data,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<CampaignOption[]>({
    queryKey: ['workspace-campaigns'],
    queryFn: async () => (await apiClient.get('/campaigns')).data,
  });

  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery<ImageJob[]>({
    queryKey: ['image-generation-jobs'],
    queryFn: async () => (await apiClient.get('/images/jobs')).data,
  });

  const { data: approvedContents = [], isLoading: approvedContentsLoading } = useQuery<any[]>({
    queryKey: ['approved-contents', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      return (await apiClient.get('/content', { params: { status: 'approved', brandId: selectedBrandId } })).data;
    },
    enabled: !!selectedBrandId && contentMode === 'content',
  });

  // ─── Image API Key Status ────────────────────────────────────────────────
  const { data: imageKeyStatus, refetch: refetchKeyStatus } = useQuery<{
    hasImageApiKey: boolean;
    source: 'image_specific' | 'llm_shared' | 'none';
    masked: string | null;
  }>({
    queryKey: ['image-api-key-status'],
    queryFn: async () => (await apiClient.get('/settings/llm/image-api-key/status')).data,
    staleTime: 30_000,
  });

  const { data: llmSettings } = useQuery<any>({
    queryKey: ['llm-settings-status'],
    queryFn: async () => (await apiClient.get('/settings/llm')).data,
    staleTime: 30_000,
  });

  const isProviderConfigured = useMemo(() => {
    if (!imageKeyStatus || !llmSettings) return true;
    if (selectedProvider === 'openai') {
      if (llmSettings.provider === 'nvidia') {
        return imageKeyStatus.source === 'image_specific';
      }
      return imageKeyStatus.hasImageApiKey;
    }
    if (selectedProvider === 'nvidia') {
      return llmSettings.provider === 'nvidia' && llmSettings.hasApiKey;
    }
    if (selectedProvider === 'flux') {
      return !!llmSettings.fluxApiKey || imageKeyStatus.source === 'image_specific';
    }
    return true;
  }, [selectedProvider, imageKeyStatus, llmSettings]);

  const providerWarning = useMemo(() => {
    if (isProviderConfigured) return null;
    if (selectedProvider === 'openai') {
      return {
        title: '⚠️ No OpenAI API Key — Running in Mock Mode',
        desc: 'Without a dedicated OpenAI API key, the system falls back to mock images instead of generating real AI branded posters. Add your OpenAI key below to activate DALL-E 3 poster generation.',
        action: (
          <>
            <button
              onClick={() => setShowKeyModal(true)}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-lg transition-colors"
            >
              <Key className="h-3.5 w-3.5" /> Add OpenAI API Key
            </button>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-500/30 px-4 py-2 rounded-lg transition-colors"
            >
              Get API Key <ExternalLink className="h-3 w-3" />
            </a>
          </>
        )
      };
    }
    if (selectedProvider === 'nvidia') {
      return {
        title: '⚠️ No NVIDIA API Key — Running in Mock Mode',
        desc: 'Please configure your NVIDIA API Key and set NVIDIA as your active LLM provider in settings to generate posters using NVIDIA NIM (FLUX.1-dev / Klein).',
        action: (
          <Link
            href="/settings/llm"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="h-3.5 w-3.5" /> Go to LLM Settings
          </Link>
        )
      };
    }
    if (selectedProvider === 'flux') {
      return {
        title: '⚠️ No FLUX API Key — Running in Mock Mode',
        desc: 'Please configure your Black Forest Labs FLUX.1-dev API Key in settings to generate posters using FLUX.',
        action: (
          <Link
            href="/settings/llm"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="h-3.5 w-3.5" /> Go to LLM Settings
          </Link>
        )
      };
    }
    return null;
  }, [isProviderConfigured, selectedProvider]);

  // Polling fallback when WS disconnected
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
          toast({ title: '✅ Poster Generated!', description: 'Your branded marketing poster is ready.' });
        }
      }
      return job;
    },
    enabled: !!activeJobId && !wsConnected,
    refetchInterval: 5000,
  });

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (brandIdParam) setSelectedBrandId(brandIdParam);
    if (campaignIdParam) setSelectedCampaignId(campaignIdParam);
    if (categoryParam) setSelectedCategory(categoryParam);
    if (contentIdParam) { setSelectedContentId(contentIdParam); setContentMode('content'); }
  }, [brandIdParam, campaignIdParam, categoryParam, contentIdParam]);

  useEffect(() => {
    if (llmSettings?.provider) {
      if (llmSettings.provider === 'nvidia') {
        setSelectedProvider('nvidia');
      } else if (llmSettings.provider === 'openai') {
        setSelectedProvider('openai');
      }
    }
  }, [llmSettings]);

  useEffect(() => {
    if (!selectedBrandId && brands.length > 0 && brands[0]) {
      setSelectedBrandId(brands[0].id);
    }
  }, [selectedBrandId, brands]);

  useEffect(() => {
    if (!activeJobId && jobs.length > 0) {
      const active = jobs.find(j => j.status === 'PENDING' || j.status === 'PROCESSING');
      if (active) setActiveJobId(active.id);
    }
  }, [jobs, activeJobId]);

  // ─── Mutation ─────────────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/images/generate', {
        brandId:    selectedBrandId,
        platform:   selectedPlatform,
        category:   selectedCategory,
        contentId:  contentMode === 'content' && selectedContentId ? selectedContentId : undefined,
        campaignId: selectedCampaignId || undefined,
        // Structured fields (used in manual mode, or as overrides)
        headline:    contentMode === 'manual' ? headlineText.trim() || undefined : undefined,
        subheadline: contentMode === 'manual' ? subheadlineText.trim() || undefined : undefined,
        cta:         contentMode === 'manual' ? ctaText.trim() || undefined : undefined,
        settings: {
          provider: selectedProvider,
          quality:  selectedQuality,
          style:    selectedStyle,
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setActiveJobId(data.id);
      setWsProgress(null);
      toast({ title: '🚀 Job Queued', description: 'Generating your branded marketing poster...' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to queue job',
        description: err?.response?.data?.message || err.message || 'Error occurred.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/images/jobs/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Job removed from history.' });
      queryClient.invalidateQueries({ queryKey: ['image-generation-jobs'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to delete',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiClient.delete(`/images/jobs/${id}`)));
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Selected jobs removed from history.' });
      setSelectedJobIds(new Set());
      setIsSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['image-generation-jobs'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to delete selected jobs',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  const toggleJobSelection = (id: string) => {
    const newSet = new Set(selectedJobIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedJobIds(newSet);
  };
  // ─── Derived ──────────────────────────────────────────────────────────────
  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const platformSpec  = getPlatformSpec(selectedPlatform);
  const generating    = generateMutation.isPending || !!activeJobId;

  const currentProgress   = wsProgress?.progress   ?? jobs.find(j => j.id === activeJobId)?.progress ?? 0;
  const currentStage      = wsProgress?.stage       ?? (jobs.find(j => j.id === activeJobId)?.status === 'PROCESSING' ? 'generating' : 'queued');
  const currentFinalPrompt = wsProgress?.finalPrompt ?? jobs.find(j => j.id === activeJobId)?.finalPrompt;

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return jobs;
    return jobs.filter(j => j.status === statusFilter);
  }, [jobs, statusFilter]);

  // Brand color tokens
  const brandColors: string[] = useMemo(() => {
    const vr = selectedBrand?.visualRules || {};
    const tokens: Array<{ type: string; value: string; name: string }> = Array.isArray(vr.colorTokens) ? vr.colorTokens : [];
    if (tokens.length > 0) return tokens.slice(0, 5).map(t => t.value);
    return [vr.primaryColor, vr.secondaryColor, vr.accentColor].filter(Boolean);
  }, [selectedBrand]);

  const brandTone: string[] = useMemo(() => {
    const t = selectedBrand?.tone;
    if (Array.isArray(t)) return t.slice(0, 3);
    if (typeof t === 'string') return [t];
    return [];
  }, [selectedBrand]);

  // ─── Render ────────────────────────────────────────────────────────────────

  // ─── Save image API key handler ───────────────────────────────────────────
  const handleSaveImageKey = async () => {
    if (!imageKeyInput.trim().startsWith('sk-')) {
      toast({ title: 'Invalid key', description: 'OpenAI keys start with sk-', variant: 'destructive' });
      return;
    }
    setSavingKey(true);
    try {
      await apiClient.post('/settings/llm/image-api-key', { imageApiKey: imageKeyInput.trim() });
      toast({ title: '✅ Image API key saved', description: 'DALL-E 3 image generation is now active.' });
      setShowKeyModal(false);
      setImageKeyInput('');
      refetchKeyStatus();
    } catch (err: any) {
      toast({ title: 'Failed to save key', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Image API Key Setup Modal ──────────────────────────────────────── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 mx-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-500/15 p-2.5 border border-indigo-500/25">
                  <Key className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Configure Image Generation</h3>
                  <p className="text-xs text-slate-400">Enter your OpenAI API key to enable DALL-E 3</p>
                </div>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
              <p className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Why is this needed?
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                BrandFlow uses OpenAI DALL-E 3 to generate branded marketing posters.
                Your key is encrypted and stored securely — never logged or shared.
                Without it, the system falls back to stock placeholder images.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showKeyInput ? 'text' : 'password'}
                  value={imageKeyInput}
                  onChange={e => setImageKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 pr-10 font-mono"
                  onKeyDown={e => e.key === 'Enter' && handleSaveImageKey()}
                />
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKeyInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[9px] text-slate-600">
                Get your key at <span className="text-indigo-400 font-bold">platform.openai.com/api-keys</span>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl py-2.5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveImageKey}
                disabled={savingKey || imageKeyInput.trim().length < 20}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl py-2.5 text-xs uppercase tracking-wider gap-2 disabled:opacity-50"
              >
                {savingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                {savingKey ? 'Saving...' : 'Save & Enable DALL-E 3'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                AI Poster Studio
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-400 border border-indigo-500/30">
                  BRAND-AWARE
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-400 flex items-center gap-2">
                Generates branded marketing posters using your brand colors, logo & content.
                {wsConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <Wifi className="h-3 w-3" /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                    <WifiOff className="h-3 w-3" /> Polling
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Configure API Key button */}
          {/* Configure API Key button */}
          <button
            onClick={() => {
              if (selectedProvider === 'openai') {
                setShowKeyModal(true);
              } else {
                router.push('/settings/llm');
              }
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
              isProviderConfigured
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                : 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/15'
            }`}
            title={isProviderConfigured ? `Provider ${selectedProvider.toUpperCase()} is configured & active` : `Configure key for ${selectedProvider.toUpperCase()}`}
          >
            <Key className="h-3.5 w-3.5" />
            {isProviderConfigured ? `${selectedProvider.toUpperCase()} ✓` : `Config ${selectedProvider.toUpperCase()}`}
          </button>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Est. Cost</span>
            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black px-2.5 py-1 rounded-lg">
              <Zap className="h-3 w-3" />
              ~${(estimatedCost / 100).toFixed(2)}
            </span>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!canSubmit}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            aria-label="Generate branded marketing poster"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Poster
          </Button>
        </div>
      </div>

      {/* ── Mock Mode Warning Banner ──────────────────────────────────────── */}
      {providerWarning && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 animate-in slide-in-from-top-2 duration-300">
          <div className="rounded-xl bg-amber-500/15 p-2.5 flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-black text-amber-300">{providerWarning.title}</p>
            <p className="text-xs text-amber-200/70 leading-relaxed">{providerWarning.desc}</p>
            <div className="pt-2 flex gap-3 flex-wrap">
              {providerWarning.action}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-12">

        {/* ── Left Panel (8 cols) ──────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Step 1: Brand & Campaign */}
          <Card className="p-6 border-slate-800 bg-slate-900/50 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">1. Brand Identity</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Brand Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Brand *</span>
                {brandsLoading ? (
                  <Skeleton className="h-12 w-full rounded-xl" />
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
                    value={selectedBrandId}
                    onChange={e => setSelectedBrandId(e.target.value)}
                    aria-label="Select brand profile"
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}

                {/* Brand Color & Identity Preview */}
                {selectedBrand && (
                  <div className="mt-3 space-y-2">
                    {/* Color Swatches */}
                    {brandColors.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Brand Colors</span>
                        <div className="flex gap-2">
                          {brandColors.map((color, i) => (
                            <div
                              key={i}
                              className="h-7 w-7 rounded-lg border-2 border-slate-700/50 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Brand Tone Tags */}
                    {brandTone.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {brandTone.map(t => (
                          <span key={t} className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Visual Identity Confirmed */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Brand visual identity will be applied to poster
                    </div>
                  </div>
                )}

                {!selectedBrandId && headlineText.trim().length > 0 && (
                  <span className="text-[10px] text-amber-400 font-bold">Brand selection required</span>
                )}
              </div>

              {/* Campaign Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Campaign (Optional)</span>
                {campaignsLoading ? (
                  <Skeleton className="h-12 w-full rounded-xl" />
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                    aria-label="Link to campaign"
                  >
                    <option value="">Standalone Poster (No Campaign)</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </Card>

          {/* Step 2: Platform + Category + Style */}
          <Card className="p-6 border-slate-800 bg-slate-900/50 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Layout className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">2. Format & Platform</h2>
            </div>

            {/* Platform Group Tabs */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Target Platform *</span>

              {/* Group Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(PLATFORMS_GROUPED).map(group => (
                  <button
                    key={group}
                    onClick={() => setActivePlatformGroup(group)}
                    className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${
                      activePlatformGroup === group
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800'
                    }`}
                  >
                    {GROUP_ICONS[group] || '•'} {group}
                  </button>
                ))}
              </div>

              {/* Platform Options for Selected Group */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(PLATFORMS_GROUPED[activePlatformGroup] || []).map(plat => {
                  const isSelected = selectedPlatform === plat.id;
                  const orientClass = plat.orientation === 'portrait' ? 'aspect-[9/16]' :
                                      plat.orientation === 'landscape' ? 'aspect-[16/6]' : 'aspect-square';
                  return (
                    <button
                      key={plat.id}
                      onClick={() => setSelectedPlatform(plat.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-foreground ring-2 ring-indigo-500/25'
                          : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {/* Visual orientation indicator */}
                      <div className={`${orientClass} w-8 rounded border-2 mb-2 flex-shrink-0 ${
                        isSelected ? 'border-indigo-400 bg-indigo-400/20' : 'border-slate-700 bg-slate-800/50'
                      }`} />
                      <span className="text-[10px] font-bold text-center leading-tight">{plat.label}</span>
                      <span className="text-[8px] text-slate-500 font-mono mt-0.5">{plat.width}×{plat.height}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected platform summary */}
              {selectedPlatform && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span><span className="font-bold text-slate-300">{platformSpec.label}</span> — {platformSpec.width}×{platformSpec.height}px ({platformSpec.aspectRatio})</span>
                </div>
              )}
            </div>

            {/* Creative Category */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Deliverable Category *</span>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                {VISUAL_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-start p-3 text-left rounded-xl border transition-all ${
                      selectedCategory === cat.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-foreground ring-2 ring-indigo-500/25'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs font-bold">{cat.label}</span>
                    <span className="text-[9px] text-slate-500 mt-1 line-clamp-1">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Visual Style Preset</span>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                {PRESET_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-start p-3 text-left rounded-xl border transition-all ${
                      selectedStyle === style.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-foreground ring-2 ring-indigo-500/25'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs font-bold">{style.label}</span>
                    <span className="text-[9px] text-slate-500 mt-1 line-clamp-1">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Step 3: Content */}
          <Card className="p-6 border-slate-800 bg-slate-900/50 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Type className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">3. Poster Content</h2>
              <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded ml-auto">
                Auto-extracted by Brand Prompt Engine
              </span>
            </div>

            {/* Content Mode Toggle */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              {([
                { id: 'manual',  label: '✏️  Manual Fields' },
                { id: 'content', label: '📋  From Approved Content' },
              ] as const).map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setContentMode(mode.id)}
                  className={`text-[11px] font-black py-2.5 rounded-lg transition-all uppercase tracking-wider ${
                    contentMode === mode.id
                      ? 'bg-slate-800 text-indigo-400 shadow-md border border-slate-700/50'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Manual Mode — Structured Fields */}
            {contentMode === 'manual' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Headline */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Headline * <span className="text-rose-400">(required)</span>
                    </label>
                    <span className={`text-[9px] font-mono ${headlineText.length > 180 ? 'text-amber-400' : 'text-slate-600'}`}>
                      {headlineText.length}/200
                    </span>
                  </div>
                  <input
                    type="text"
                    value={headlineText}
                    onChange={e => setHeadlineText(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Launch Your Brand Into the Future"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-slate-600 ${
                      headlineText.trim().length > 0 && headlineText.trim().length < 5
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                    aria-label="Poster headline"
                    aria-describedby="headline-help"
                  />
                  <p id="headline-help" className="text-[9px] text-slate-600">
                    The main message of your poster. This becomes the primary visual focus of the design.
                  </p>
                </div>

                {/* Subheadline */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Subheadline (Optional)</label>
                    <span className={`text-[9px] font-mono ${subheadlineText.length > 260 ? 'text-amber-400' : 'text-slate-600'}`}>
                      {subheadlineText.length}/300
                    </span>
                  </div>
                  <input
                    type="text"
                    value={subheadlineText}
                    onChange={e => setSubheadlineText(e.target.value)}
                    maxLength={300}
                    placeholder="e.g. Transform your marketing with AI-powered automation"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    aria-label="Poster subheadline"
                  />
                </div>

                {/* CTA */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                      Call-to-Action (Optional)
                    </label>
                    <span className={`text-[9px] font-mono ${ctaText.length > 85 ? 'text-amber-400' : 'text-slate-600'}`}>
                      {ctaText.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Get Started Free  •  Book a Demo  •  Learn More"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    aria-label="Call-to-action text"
                  />
                  <p className="text-[9px] text-slate-600">
                    The CTA zone will be positioned prominently in the poster composition.
                  </p>
                </div>
              </div>
            )}

            {/* Content Mode — Link Approved Content */}
            {contentMode === 'content' && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Select Approved Content ({approvedContents.length})
                </span>
                <p className="text-[10px] text-slate-500">
                  Headline, CTA, and campaign objective will be automatically extracted from the selected content piece.
                </p>

                {!selectedBrandId ? (
                  <div className="text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-6 text-center">
                    Select a brand first to see approved content
                  </div>
                ) : approvedContentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-xl bg-slate-900/50" />
                    <Skeleton className="h-16 w-full rounded-xl bg-slate-900/50" />
                  </div>
                ) : approvedContents.length === 0 ? (
                  <div className="text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-6 text-center">
                    No approved content found for this brand.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {approvedContents.map(content => {
                      const isSelected = selectedContentId === content.id;
                      const category = content.metadata?.contentCategory || content.type;
                      return (
                        <div
                          key={content.id}
                          onClick={() => {
                            setSelectedContentId(content.id);
                            if (content.campaignId) setSelectedCampaignId(content.campaignId);
                            const mapped = CONTENT_CATEGORY_TO_IMAGE_CATEGORY[category] || 'SMO_POSTER';
                            setSelectedCategory(mapped);
                            toast({ title: '✅ Content Linked', description: 'Headline, CTA & objective will be auto-extracted.' });
                          }}
                          className={`border rounded-xl p-3 cursor-pointer text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10'
                              : 'border-slate-850 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                              {category}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {new Date(content.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-350 text-xs line-clamp-2 leading-relaxed">{content.body}</p>
                          {isSelected && (
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block mt-2">
                              ✓ Linked — Headline & CTA will be auto-extracted
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              <Settings className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              {showAdvanced ? 'Hide advanced settings' : 'Advanced settings'}
            </button>

            {showAdvanced && (
              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">AI Image Provider</span>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
                    value={selectedProvider}
                    onChange={e => setSelectedProvider(e.target.value)}
                    aria-label="Select AI image provider"
                  >
                    <option value="openai">OpenAI DALL-E 3 (Vivid — Poster Quality)</option>
                    <option value="nvidia">NVIDIA NIM (FLUX.1-dev / Klein)</option>
                    <option value="flux">FLUX.1-dev via BFL (Premium Quality)</option>
                    <option value="stability">Stability AI SDXL (Fallback)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Rendering Quality</span>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
                    value={selectedQuality}
                    onChange={e => setSelectedQuality(e.target.value as any)}
                    aria-label="Select rendering quality"
                  >
                    <option value="standard">Standard Quality (~$0.03–0.04)</option>
                    <option value="hd">HD / High-Definition (~$0.08)</option>
                  </select>
                </div>
              </div>
            )}
          </Card>

          {/* ── Active Job Progress ─────────────────────────────────────────── */}
          {generating && (
            <Card className="p-6 border-indigo-500/30 bg-indigo-950/10 space-y-5 animate-in slide-in-from-bottom-2 duration-300">
              {/* Stage Pipeline */}
              <div className="flex items-center justify-between gap-1">
                {STAGES.map((stage, idx) => {
                  const stageIdx = STAGES.findIndex(s => s.key === currentStage);
                  const isActive    = stage.key === currentStage;
                  const isCompleted = idx < stageIdx;
                  return (
                    <div key={stage.key} className="flex items-center gap-1 flex-1">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        isActive    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse' :
                        isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-3 w-3" /> :
                         isActive    ? <Loader2 className="h-3 w-3 animate-spin" /> :
                         <div className="h-3 w-3 rounded-full border border-slate-700" />}
                        <span className="hidden sm:inline">{stage.label}</span>
                      </div>
                      {idx < STAGES.length - 1 && (
                        <div className={`flex-1 h-px ${isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                    {STAGES.find(s => s.key === currentStage)?.label || 'Processing'}...
                  </span>
                  <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {currentProgress}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full transition-all duration-700 ease-out shadow-md shadow-indigo-500/50"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>

              {/* Final Prompt Preview */}
              {currentFinalPrompt && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-[10px] text-slate-500 font-mono italic leading-relaxed">
                  <span className="text-indigo-400 font-bold not-italic">POSTER PROMPT: </span>
                  &ldquo;{currentFinalPrompt.slice(0, 280)}{currentFinalPrompt.length > 280 ? '...' : ''}&rdquo;
                </div>
              )}
            </Card>
          )}

          {/* ── Generation History ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Generation History ({filteredJobs.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                {isSelectionMode ? (
                  <div className="flex gap-1">
                    <Button
                      onClick={() => {
                        if (confirm(`Delete ${selectedJobIds.size} selected jobs?`)) {
                          deleteSelectedMutation.mutate(Array.from(selectedJobIds));
                        }
                      }}
                      disabled={selectedJobIds.size === 0 || deleteSelectedMutation.isPending}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold py-1 h-7 rounded px-3"
                    >
                      {deleteSelectedMutation.isPending ? 'Deleting...' : `Delete (${selectedJobIds.size})`}
                    </Button>
                    <Button
                      onClick={() => { setIsSelectionMode(false); setSelectedJobIds(new Set()); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1 h-7 rounded px-3"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsSelectionMode(true)}
                    disabled={filteredJobs.length === 0}
                    className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 text-[10px] font-bold py-1 h-7 rounded px-3"
                  >
                    Select Multiple
                  </Button>
                )}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
                  {(['all', 'COMPLETED', 'FAILED', 'PROCESSING'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`text-[9px] font-black px-2 py-1 rounded transition-all uppercase ${
                        statusFilter === f
                          ? 'bg-slate-800 text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'COMPLETED' ? '✓ Done' : f === 'FAILED' ? '✗ Failed' : '⟳ Active'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {jobsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="border-slate-800 bg-slate-900/30 overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-slate-800 bg-slate-900/15">
                <ImageIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-500">
                  {statusFilter === 'all'
                    ? 'No posters generated in this workspace yet. Create your first branded poster above.'
                    : `No ${statusFilter.toLowerCase()} jobs found.`}
                </span>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredJobs.map(job => {
                  const img = job.images?.[0];
                  const headline = job.posterContext?.headline || job.rawPrompt;
                  return (
                    <div key={job.id} className="relative group/card">
                      {isSelectionMode && (
                        <div
                          className={`absolute inset-0 z-10 rounded-xl cursor-pointer ring-2 transition-all ${
                            selectedJobIds.has(job.id) ? 'ring-indigo-500 bg-indigo-500/15' : 'ring-transparent bg-transparent'
                          }`}
                          onClick={() => toggleJobSelection(job.id)}
                        >
                          <div className={`absolute top-3 left-3 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedJobIds.has(job.id)
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'bg-slate-900/50 border-slate-400/50 group-hover/card:border-slate-300'
                          }`}>
                            {selectedJobIds.has(job.id) && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      )}
                      <Card className={`border-slate-800 bg-slate-900/30 overflow-hidden flex flex-col justify-between group h-full ${
                        isSelectionMode && selectedJobIds.has(job.id) ? 'opacity-80' : ''
                      }`}>
                        {job.status === 'COMPLETED' && img?.asset ? (
                        <div className="relative w-full bg-slate-950 border-b border-slate-800 overflow-hidden" style={{ aspectRatio: job.settings?.aspectRatio === '9:16' ? '9/16' : job.settings?.aspectRatio === '16:9' ? '16/9' : '1/1', maxHeight: '320px' }}>
                          <img
                            src={img.asset.cdnUrl}
                            alt={`Generated poster: ${headline.slice(0, 80)}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />

                          {/* ── Text Overlay for Real AI Images ─────────────────────────── */}
                          {/* FLUX/NVIDIA cannot render readable text. We overlay it as CSS. */}
                          {(job.posterContext?.headline || job.posterContext?.subheadline || job.posterContext?.cta) && (
                            <div className="absolute inset-0 flex flex-col justify-end">
                              {/* Gradient backdrop for text readability */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                              <div className="relative px-4 pb-4 pt-8 space-y-1.5">
                                {job.posterContext?.headline && (
                                  <p className="text-white font-black text-sm leading-tight drop-shadow-lg"
                                     style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}>
                                    {job.posterContext.headline}
                                  </p>
                                )}
                                {job.posterContext?.subheadline && (
                                  <p className="text-white/85 text-[10px] font-semibold leading-snug drop-shadow"
                                     style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                                    {job.posterContext.subheadline}
                                  </p>
                                )}
                                {job.posterContext?.cta && (
                                  <div className="mt-2 inline-block">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-white text-black px-3 py-1 rounded-full shadow-lg">
                                      {job.posterContext.cta}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ── Action Buttons (hover) ──────────────────────────────────── */}
                          <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => { navigator.clipboard.writeText(img.asset.cdnUrl); toast({ title: 'URL copied' }); }}
                              className="p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-lg text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
                              aria-label="Copy image URL"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={img.asset.cdnUrl}
                              download={img.asset.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-lg text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
                              aria-label="Download poster"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>

                          {/* ── Provider Badge ──────────────────────────────────────────── */}
                          <div className="absolute top-2.5 left-2.5 z-10">
                            {(() => {
                              const provider = img.metadata?.provider || 'unknown';
                              const isMock = provider === 'mock';
                              return (
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border backdrop-blur-sm ${
                                  isMock
                                    ? 'bg-amber-900/80 border-amber-500/40 text-amber-300'
                                    : 'bg-emerald-900/80 border-emerald-500/40 text-emerald-300'
                                }`}>
                                  {isMock ? '⚠ Placeholder' : `✓ ${provider === 'nvidia' ? 'NVIDIA AI' : provider === 'openai' ? 'DALL·E 3' : provider === 'flux' ? 'FLUX AI' : 'AI Generated'}`}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2">
                          {job.status === 'FAILED' ? (
                            <>
                              <AlertCircle className="h-8 w-8 text-rose-500" />
                              <span className="text-xs font-extrabold text-rose-400 uppercase leading-none">Generation Failed</span>
                              <span className="text-[10px] text-slate-500 line-clamp-2">{job.error || 'Unknown error'}</span>
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Generating Poster ({job.progress}%)</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded leading-none">
                              {job.category}
                            </span>
                            {job.platform && (
                              <span className="text-[8px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded leading-none">
                                {job.platform.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 font-bold mt-2 line-clamp-2 leading-relaxed">
                            &ldquo;{headline}&rdquo;
                          </p>
                          {job.posterContext?.cta && (
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">
                              CTA: {job.posterContext.cta}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1 mt-auto">
                          {job.status === 'COMPLETED' && img?.asset && (
                            <Link href={`/create/creative?assetId=${img.asset.id}`} className="flex-1">
                              <Button className="w-full gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 py-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-colors">
                                Open in Canvas <ExternalLink className="h-3 w-3 text-indigo-400" />
                              </Button>
                            </Link>
                          )}

                          {job.status === 'FAILED' && (
                            <Button
                              onClick={() => {
                                if (job.platform) setSelectedPlatform(job.platform);
                                if (job.category) setSelectedCategory(job.category);
                                if (job.posterContext?.headline) setHeadlineText(job.posterContext.headline);
                                if (job.posterContext?.cta) setCtaText(job.posterContext.cta);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="flex-1 gap-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 py-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-colors"
                              aria-label="Retry this generation"
                            >
                              <RefreshCw className="h-3 w-3" /> Retry Poster
                            </Button>
                          )}

                          <Button
                            onClick={() => {
                              if (confirm('Delete this poster from history?')) {
                                deleteMutation.mutate(job.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-slate-950 border border-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-slate-500 px-3 py-2 rounded-lg transition-colors shrink-0"
                            title="Delete Job"
                          >
                            {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Right Sidebar (4 cols) ──────────────────────────────────────── */}
        <div className="lg:col-span-4 self-start sticky top-6 space-y-6">

          {/* Brand Context Panel */}
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Palette className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {selectedBrand ? `${selectedBrand.name} — Brand Context` : 'Brand Context'}
              </h3>
            </div>

            {!selectedBrandId ? (
              <div className="text-xs text-slate-500 text-center py-6">
                Select a brand to preview the visual identity that will be applied to your poster.
              </div>
            ) : selectedBrand ? (
              <div className="space-y-4 text-xs leading-relaxed">
                {/* Colors */}
                {brandColors.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Brand Colors</span>
                    <div className="flex flex-wrap gap-1.5">
                      {brandColors.map((color, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-md py-1 px-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: color }} />
                          <span className="text-[9px] text-slate-300 font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industry */}
                {selectedBrand.industry && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Industry</span>
                    <span className="inline-block rounded bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                      {selectedBrand.industry}
                    </span>
                  </div>
                )}

                {/* Tone */}
                {brandTone.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Brand Tone</span>
                    <div className="flex flex-wrap gap-1">
                      {brandTone.map(t => (
                        <span key={t} className="text-[9px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Positioning */}
                {selectedBrand.positioning && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Visual Direction</span>
                    <p className="text-slate-400 font-medium leading-relaxed text-[10px]">{selectedBrand.positioning}</p>
                  </div>
                )}

                {/* Confirmation */}
                <div className="pt-1 border-t border-slate-800 space-y-1.5">
                  {[
                    '✓ Brand colors applied to poster palette',
                    '✓ Brand tone shapes visual language',
                    '✓ Logo zone reserved in composition',
                    '✓ Industry-relevant visual concepts',
                  ].map(item => (
                    <div key={item} className="text-[9px] font-bold text-emerald-400">{item}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">Loading brand context...</div>
            )}
          </Card>

          {/* Poster Content Preview Panel */}
          {(headlineText || subheadlineText || ctaText) && selectedBrandId && (
            <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-800 p-4 pb-3">
                <ImageIcon className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Poster Preview</h3>
                <span className="ml-auto text-[8px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Live</span>
              </div>
              {/* Mock-up of the generated image with text overlay */}
              <div
                className="relative w-full overflow-hidden flex items-end"
                style={{
                  aspectRatio: selectedPlatform?.includes('story') || selectedPlatform?.includes('reel') ? '9/16' : '1/1',
                  maxHeight: '220px',
                  background: brandColors.length > 0
                    ? `linear-gradient(135deg, ${brandColors[0] || '#1e293b'} 0%, ${brandColors[1] || brandColors[0] || '#0f172a'} 100%)`
                    : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                }}
              >
                {/* Geometric accent */}
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20"
                  style={{ background: brandColors[2] || brandColors[0] || '#6366f1', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-14 h-14 rounded-full opacity-15"
                  style={{ background: brandColors[1] || '#818cf8', transform: 'translate(-30%, 30%)' }} />

                {/* Brand name top */}
                {selectedBrand?.name && (
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">
                      {selectedBrand.name}
                    </span>
                  </div>
                )}

                {/* Text overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative px-3 pb-3 pt-8 space-y-1 w-full">
                  {headlineText && (
                    <p className="text-white font-black text-xs leading-tight drop-shadow-lg"
                       style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                      {headlineText.slice(0, 60)}{headlineText.length > 60 ? '...' : ''}
                    </p>
                  )}
                  {subheadlineText && (
                    <p className="text-white/80 text-[8px] font-semibold leading-snug"
                       style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                      {subheadlineText.slice(0, 80)}{subheadlineText.length > 80 ? '...' : ''}
                    </p>
                  )}
                  {ctaText && (
                    <div className="mt-1.5 inline-block">
                      <span className="text-[7px] font-black uppercase tracking-wider bg-white text-black px-2.5 py-0.5 rounded-full shadow">
                        {ctaText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-800">
                <p className="text-[9px] text-slate-500 text-center">
                  Text overlay applied on AI-generated background
                </p>
              </div>
            </Card>
          )}

          {/* Platform Preview Panel */}
          {selectedPlatform && (
            <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <Monitor className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Platform Spec</h3>
              </div>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span className="font-bold text-slate-300">{platformSpec.label}</span>
                  <span className="text-indigo-400 font-mono font-bold">{platformSpec.aspectRatio}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dimensions</span>
                  <span className="font-mono text-slate-400">{platformSpec.width} × {platformSpec.height}px</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Orientation</span>
                  <span className="capitalize text-slate-400">{platformSpec.orientation}</span>
                </div>
                {/* Visual representation */}
                <div className="flex justify-center pt-2">
                  <div
                    className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded"
                    style={{
                      width:  platformSpec.orientation === 'landscape' ? '80px' : platformSpec.orientation === 'portrait' ? '32px' : '56px',
                      height: platformSpec.orientation === 'landscape' ? '28px' : platformSpec.orientation === 'portrait' ? '56px' : '56px',
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Billing Info */}
          <Card className="p-4 border-slate-800 bg-slate-950 text-xs text-slate-500 space-y-2.5">
            <div className="flex items-center gap-2 font-black text-slate-400 uppercase tracking-wider text-[10px]">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Provider Cost
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-[10.5px] text-slate-400 font-bold space-y-1">
              {[
                ['DALL-E 3 Standard', '~$0.04'],
                ['DALL-E 3 HD', '~$0.08'],
                ['FLUX.1-dev', '~$0.035'],
                ['Stability SDXL', '~$0.03'],
              ].map(([name, price]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}:</span>
                  <span className="text-foreground">{price}</span>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between text-indigo-400">
                <span>Your selection:</span>
                <span className="font-black">~${(estimatedCost / 100).toFixed(2)}</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
