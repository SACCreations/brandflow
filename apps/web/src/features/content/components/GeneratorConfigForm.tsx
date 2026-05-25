import React from 'react';
import { Layers, Calendar } from 'lucide-react';

interface BrandOption {
  id: string;
  name: string;
}

interface CampaignOption {
  id: string;
  name: string;
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

interface GeneratorConfigFormProps {
  briefId: string | null;
  brands: BrandOption[];
  campaigns: CampaignOption[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (plat: string) => void;
  contentCount: number;
  setContentCount: (count: number) => void;
  validationErrors: Record<string, string>;
}

export function GeneratorConfigForm({
  briefId,
  brands,
  campaigns,
  selectedBrandId,
  setSelectedBrandId,
  selectedCampaignId,
  setSelectedCampaignId,
  selectedCategory,
  setSelectedCategory,
  selectedPlatform,
  setSelectedPlatform,
  contentCount,
  setContentCount,
  validationErrors,
}: GeneratorConfigFormProps) {
  return (
    <>
      {/* Step 1: Identity & Target mapping */}
      <div className="glass-panel p-6 space-y-5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="rounded-lg bg-brand-500/10 p-2">
            <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">1. Core Identity & Campaign Mapping</h2>
        </div>
        
        <div className="relative z-10 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Brand Selector *</span>
            <select
              disabled={!!briefId}
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 backdrop-blur-sm"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
            >
              <option value="" disabled>-- Choose Brand --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {briefId && <span className="text-[10px] text-gray-400 font-medium">Locked to brief's designated brand.</span>}
            {validationErrors['brand'] && <span className="text-[10px] font-semibold text-red-500">{validationErrors['brand']}</span>}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Link Campaign</span>
            <select
              disabled={!!briefId}
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 backdrop-blur-sm"
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
      </div>

      {/* Step 2: Formats and Batch configuration */}
      <div className="glass-panel p-6 space-y-5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="rounded-lg bg-brand-500/10 p-2">
            <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">2. Format Rules & Output Batching</h2>
        </div>

        <div className="relative z-10 space-y-4">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">Content Category</span>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-start p-3 text-left rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'border-brand-500/50 bg-brand-50/50 text-brand-900 ring-4 ring-brand-500/10 dark:bg-brand-500/20 dark:text-brand-100 shadow-inner'
                    : 'border-border/50 text-gray-700 hover:bg-gray-50/80 dark:bg-gray-900/40 dark:text-gray-400 dark:hover:bg-gray-800/60 hover:-translate-y-0.5 shadow-sm'
                }`}
              >
                <span className="text-xs font-bold">{cat.label}</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400/80 mt-1 line-clamp-1">{cat.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid gap-6 md:grid-cols-2 pt-2">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target Social Platform</span>
            <select
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 backdrop-blur-sm"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              {PLATFORMS.map((plat) => (
                <option key={plat.id} value={plat.id}>{plat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>Batch Copy Count</span>
              {contentCount > 3 && (
                <span className="text-[9px] text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider dark:text-amber-400 border border-amber-500/20">Queue Process</span>
              )}
            </span>
            <select
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 backdrop-blur-sm"
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
      </div>
    </>
  );
}
