'use client';

import * as React from 'react';
import { 
  CheckCircle2, 
  Circle,
  AlertCircle,
  Sparkles,
  LayoutTemplate
} from 'lucide-react';
import { cn } from '@brandflow/ui';
import { QualityAnalysis } from '../quality/quality-analysis';
import type { QualityCheckResult } from '@brandflow/shared';

interface LivePreviewProps {
  data: any;
  qualityCheck?: QualityCheckResult | null;
  isLoadingQuality?: boolean;
  currentStepIdx?: number;
}

export function LivePreview({ data, qualityCheck, isLoadingQuality, currentStepIdx = 0 }: LivePreviewProps) {
  const primaryColor = data.visualRules?.primaryColor || '#4f6ef7';
  const secondaryColor = data.visualRules?.secondaryColor || '#a855f7';
  const headingFont = data.visualRules?.headingFont || data.visualRules?.fontFamily || 'Inter';
  const bodyFont = data.visualRules?.bodyFont || data.visualRules?.fontFamily || 'Inter';

  // Simplified Validation checks for Mini Navigator
  const validationStatus = {
    basics: !!data.name && !!data.industry,
    visuals: !!data.visualRules?.logoUrls?.[0]?.url,
    typography: !!(data.visualRules?.headingFont || data.visualRules?.bodyFont || data.visualRules?.fontFamily),
    colors: !!data.visualRules?.colorTokens?.length || !!data.visualRules?.primaryColor,
  };

  return (
    <div className="h-full flex flex-col bg-surface-1/30 dark:bg-gray-950/30 backdrop-blur-3xl border-l border-white/20 dark:border-white/5 relative z-20 shadow-2xl">
      <div className="h-20 px-6 border-b border-white/20 dark:border-white/5 flex items-center justify-between bg-background/40 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Mini Navigator
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        {/* Quick Validation Status */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Validation Status</h3>
          <div className="space-y-2 bg-background/50 p-4 rounded-2xl border border-white/10 shadow-inner">
             <ValidationItem label="Core Basics" isValid={validationStatus.basics} isCurrent={currentStepIdx === 0} />
             <ValidationItem label="Identity (Logo)" isValid={validationStatus.visuals} isCurrent={currentStepIdx === 1} />
             <ValidationItem label="Typography" isValid={validationStatus.typography} isCurrent={currentStepIdx === 1} />
             <ValidationItem label="Colors" isValid={validationStatus.colors} isCurrent={currentStepIdx === 1} />
          </div>
        </div>

        {/* Compact Brand Snippet */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><LayoutTemplate className="w-3 h-3"/> Brand Snippet</h3>
          <div className="bg-background border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
             <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-background shadow-sm border border-border/60 mb-3">
               {data.visualRules?.logoUrls?.[0]?.url ? (
                 <img
                   src={data.visualRules.logoUrls[0].url}
                   alt="Logo"
                   crossOrigin="anonymous"
                   className="w-full h-full object-contain p-1"
                   onError={(e) => {
                     const target = e.currentTarget;
                     target.style.display = 'none';
                     const fallback = target.nextElementSibling as HTMLElement | null;
                     if (fallback) fallback.style.display = 'flex';
                   }}
                 />
               ) : null}
               <div
                 className="w-full h-full items-center justify-center text-foreground font-black text-xs"
                 style={{
                   display: data.visualRules?.logoUrls?.[0]?.url ? 'none' : 'flex',
                   background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                 }}
               >
                 {data.name?.[0] || 'B'}
               </div>
             </div>
             <span className="font-black text-sm uppercase tracking-tight text-foreground" style={{ fontFamily: headingFont }}>{data.name || 'Brand Name'}</span>
             {data.industry && <span className="text-[10px] font-bold text-muted-foreground mt-1 px-2 py-0.5 rounded-full border border-border/50">{data.industry}</span>}
             <p className="text-xs text-muted-foreground mt-3 line-clamp-2" style={{ fontFamily: bodyFont }}>{data.description || 'Description snippet appears here.'}</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border bg-background/80 dark:bg-gray-950/80 backdrop-blur-md sticky bottom-0 z-10">
        <QualityAnalysis checkResult={qualityCheck || null} isLoading={isLoadingQuality} />
      </div>

      {/* Font loaders for preview */}
      {headingFont && !headingFont.includes('system-ui') && headingFont !== 'sans-serif' && (
        <link href={`https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@900&display=swap`} rel="stylesheet" />
      )}
      {bodyFont && bodyFont !== headingFont && !bodyFont.includes('system-ui') && bodyFont !== 'sans-serif' && (
        <link href={`https://fonts.googleapis.com/css2?family=${bodyFont.replace(/ /g, '+')}:wght@400;700&display=swap`} rel="stylesheet" />
      )}
    </div>
  );
}

function ValidationItem({ label, isValid, isCurrent }: { label: string; isValid: boolean; isCurrent: boolean }) {
  return (
    <div className={cn("flex items-center justify-between p-2 rounded-xl text-xs transition-all", isCurrent ? "bg-surface-2 dark:bg-gray-800/50" : "")}>
      <span className={cn("font-bold", isCurrent ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      {isValid ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        isCurrent ? <Circle className="w-4 h-4 text-primary animate-pulse" /> : <AlertCircle className="w-4 h-4 text-amber-500" />
      )}
    </div>
  )
}
