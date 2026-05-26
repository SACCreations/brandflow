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
          <div className="rounded-lg bg-primary/100/10 p-2">
            <SlidersHorizontal className="h-5 w-5 text-primary dark:text-brand-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">4. Advanced Model Parameters</h2>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="relative z-10 grid gap-6 md:grid-cols-2 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Creativity Slider</span>
              <span className="font-bold text-primary dark:text-brand-400 bg-primary/100/10 px-2 py-0.5 rounded">{creativity}</span>
            </span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              className="w-full h-1.5 bg-surface-3 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-brand-500"
              value={creativity}
              onChange={(e) => setCreativity(Number(e.target.value))}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
              <span>Deterministic</span>
              <span>Highly Creative</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Target Language</span>
            <select
              className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20/20 backdrop-blur-sm"
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
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Call-to-Action (CTA) Focus</span>
            <input
              className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20/20 backdrop-blur-sm"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="E.g. Visit Website, Order Now"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Strict Quality Compliance</span>
            <select
              className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20/20 backdrop-blur-sm"
              value={complianceStrictness}
              onChange={(e) => setComplianceStrictness(e.target.value)}
            >
              <option value="low">Standard QC checks</option>
              <option value="medium">Medium alignment gate</option>
              <option value="high">Strict compliance audit</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between p-4 bg-background/50 bg-background/50 rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">SEO Optimization Module</div>
              <div className="text-[10px] text-muted-foreground font-medium">Embed keyword indexing and search metadata in headers.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={seoOptimized}
                onChange={(e) => setSeoOptimized(e.target.checked)}
              />
              <div className="w-10 h-5 bg-surface-3 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
