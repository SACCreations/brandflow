import React from 'react';
import { SlidersHorizontal, ChevronRight } from 'lucide-react';

interface AdvancedTuningPanelProps {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  creativity: number;
  setCreativity: (val: number) => void;
  language: string;
  setLanguage: (val: string) => void;
  cta: string;
  setCta: (val: string) => void;
  complianceStrictness: string;
  setComplianceStrictness: (val: string) => void;
  seoOptimized: boolean;
  setSeoOptimized: (val: boolean) => void;
}

export function AdvancedTuningPanel({
  showAdvanced,
  setShowAdvanced,
  creativity,
  setCreativity,
  language,
  setLanguage,
  cta,
  setCta,
  complianceStrictness,
  setComplianceStrictness,
  seoOptimized,
  setSeoOptimized,
}: AdvancedTuningPanelProps) {
  return (
    <div className="glass-panel p-6 space-y-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="relative z-10 flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-500/10 p-2">
            <SlidersHorizontal className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">4. Advanced Model Parameters</h2>
        </div>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="relative z-10 grid gap-6 md:grid-cols-2 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>Creativity Slider</span>
              <span className="font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{creativity}</span>
            </span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-brand-500"
              value={creativity}
              onChange={(e) => setCreativity(Number(e.target.value))}
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
              <span>Deterministic</span>
              <span>Highly Creative</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target Language</span>
            <select
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 backdrop-blur-sm"
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
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Call-to-Action (CTA) Focus</span>
            <input
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 backdrop-blur-sm"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="E.g. Visit Website, Order Now"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Strict Quality Compliance</span>
            <select
              className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 backdrop-blur-sm"
              value={complianceStrictness}
              onChange={(e) => setComplianceStrictness(e.target.value)}
            >
              <option value="low">Standard QC checks</option>
              <option value="medium">Medium alignment gate</option>
              <option value="high">Strict compliance audit</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">SEO Optimization Module</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Embed keyword indexing and search metadata in headers.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={seoOptimized}
                onChange={(e) => setSeoOptimized(e.target.checked)}
              />
              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600 dark:peer-checked:bg-brand-500"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
