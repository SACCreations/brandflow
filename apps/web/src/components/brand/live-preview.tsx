'use client';

import * as React from 'react';
import { 
  Smartphone, 
  Monitor, 
  Sparkles
} from 'lucide-react';
import { 
  Badge, 
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn
} from '@brandflow/ui';

import { QualityAnalysis } from '../quality/quality-analysis';
import type { QualityCheckResult } from '@brandflow/shared';

interface LivePreviewProps {
  data: any;
  qualityCheck?: QualityCheckResult | null;
  isLoadingQuality?: boolean;
}

export function LivePreview({ data, qualityCheck, isLoadingQuality }: LivePreviewProps) {
  const [device, setDevice] = React.useState<'mobile' | 'desktop'>('desktop');
  
  const primaryColor = data.visualRules?.primaryColor || '#4f6ef7';
  const secondaryColor = data.visualRules?.secondaryColor || '#a855f7';
  const headingFont = data.visualRules?.headingFont || data.visualRules?.fontFamily || 'Inter';
  const bodyFont = data.visualRules?.bodyFont || data.visualRules?.fontFamily || 'Inter';

  return (
    <div className="h-full flex flex-col bg-surface-1/30 dark:bg-gray-950/30 backdrop-blur-3xl border-l border-white/20 dark:border-white/5 relative z-20 shadow-2xl">
      <div className="h-20 px-6 border-b border-white/20 dark:border-white/5 flex items-center justify-between bg-background/40 bg-background/40 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Live Preview
        </h2>
        <div className="flex bg-background/50 bg-background/50 backdrop-blur-md p-1 rounded-xl shadow-inner border border-white/20 dark:border-white/10">
          <button 
            onClick={() => setDevice('mobile')}
            className={cn(
              "p-2 rounded-lg transition-all",
              device === 'mobile' ? "bg-background bg-surface-3 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('desktop')}
            className={cn(
              "p-2 rounded-lg transition-all",
              device === 'desktop' ? "bg-background bg-surface-3 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
        <Tabs defaultValue="web" className="w-full flex flex-col items-center">
          <TabsList className="mb-8 bg-background/40 bg-background/40 p-1.5 rounded-2xl border border-white/20 dark:border-white/5 shadow-inner backdrop-blur-xl">
            <TabsTrigger value="web" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:text-white transition-all">Web</TabsTrigger>
            <TabsTrigger value="social" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:text-white transition-all">Social</TabsTrigger>
            <TabsTrigger value="ads" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:text-white transition-all">Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="web" className="w-full mt-0 focus-visible:ring-0 flex justify-center">
            <div className={cn(
              "bg-background shadow-2xl transition-all duration-500 overflow-hidden relative border",
              device === 'mobile' ? "w-[320px] h-[600px] rounded-[3rem] border-8 border-border/60 ring-4 ring-gray-200/50 dark:ring-gray-900/50" : "w-full max-w-[600px] min-h-[400px] rounded-2xl border-white/20 dark:border-white/5 shadow-2xl ring-1 ring-gray-900/5"
            )}>
              {/* Fake Browser/Phone Header */}
              <div className="h-6 bg-surface-2/80 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-1.5">
                {device === 'desktop' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </>
                ) : (
                   <div className="w-16 h-4 bg-black rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2" />
                )}
              </div>

              <div className="h-full overflow-y-auto custom-scrollbar pb-10">
                <div className="p-4 border-b border-border/60 flex items-center justify-between sticky top-0 bg-background/90 dark:bg-gray-950/90 backdrop-blur-md z-10" style={{ fontFamily: headingFont }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-background shadow-sm border border-border/60">
                      {data.visualRules?.logoUrls?.[0]?.url ? (
                        <img src={data.visualRules.logoUrls[0].url} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-foreground font-black text-xs"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                          {data.name?.[0] || 'B'}
                        </div>
                      )}
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight truncate max-w-[120px] text-foreground">{data.name || 'Brand'}</span>
                  </div>
                </div>

                <div className="p-8 space-y-8 bg-background flex flex-col items-center justify-center text-center mt-4">
                  <Badge 
                    variant="outline" 
                    className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest border-2"
                    style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
                  >
                    {data.industry || 'Industry'}
                  </Badge>
                  <h1 
                    className="text-3xl font-black leading-tight tracking-tighter text-foreground"
                    style={{ fontFamily: headingFont }}
                  >
                    {data.tagline || 'Your tagline appears here.'}
                  </h1>
                  <p 
                    className="text-muted-foreground leading-relaxed text-sm max-w-sm mx-auto"
                    style={{ fontFamily: bodyFont }}
                  >
                    {data.description || 'This is a sample description of your brand to show how the typography scales look in context.'}
                  </p>
                  <Button 
                    className="rounded-2xl shadow-xl shadow-brand-500/30 h-12 px-8 font-black text-[10px] uppercase tracking-widest text-foreground border-none mt-4 transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {data.strategy?.ctaPreference || 'Get Started'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="w-full mt-0 focus-visible:ring-0 flex justify-center">
             <div className="w-[320px] bg-background rounded-[3rem] border-8 border-border/60 ring-4 ring-gray-200/50 dark:ring-gray-900/50 overflow-hidden shadow-2xl relative">
                <div className="h-6 bg-surface-2/80 bg-background/80 backdrop-blur-md flex items-center justify-center relative z-20">
                    <div className="w-16 h-4 bg-black rounded-b-xl absolute top-0" />
                </div>
                <div className="p-4 flex items-center gap-3 border-b border-border/60 bg-background">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center font-bold text-xs overflow-hidden border-2 border-transparent shadow-inner" style={{ borderColor: `${primaryColor}30`}}>
                    {data.visualRules?.logoUrls?.[0]?.url ? <img src={data.visualRules.logoUrls[0].url} alt="Brand Logo" className="w-full h-full object-cover" /> : <span className="text-primary font-black">{data.name?.[0] || 'B'}</span>}
                  </div>
                  <span className="text-xs font-black uppercase text-foreground tracking-widest">{data.name || 'Brand'}</span>
                </div>
                <div className="aspect-[4/5] bg-surface-1 bg-background flex items-center justify-center p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
                  <div 
                    className="w-full h-full rounded-3xl flex flex-col items-center justify-center p-8 text-center text-foreground relative z-10 shadow-2xl backdrop-blur-sm border border-white/20"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <h3 className="text-2xl font-black uppercase leading-tight mb-4 tracking-tighter" style={{ fontFamily: headingFont }}>{data.tagline || 'Post Title'}</h3>
                    <div className="w-16 h-1 bg-background/50 rounded-full mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90" style={{ fontFamily: bodyFont }}>{data.designPreferences?.preferredStyle || 'Modern'} Aesthetic</p>
                  </div>
                </div>
                <div className="p-5 space-y-3 bg-background">
                   <p className="text-xs leading-relaxed text-foreground">
                     <span className="font-black text-foreground mr-2">{data.name || 'Brand'}</span>
                     {data.description || 'Sample caption text goes here.'}
                   </p>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="ads" className="w-full mt-0 focus-visible:ring-0 flex justify-center">
             <div className="w-full max-w-[500px] aspect-[16/9] bg-gray-950 rounded-3xl overflow-hidden relative shadow-2xl border border-white/20 dark:border-white/5 ring-1 ring-gray-900/5 group">
               <div className="absolute inset-0 opacity-60">
                 <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-purple-600" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
               </div>
               <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">
                 <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center p-2 shadow-2xl border border-white/20">
                    {data.visualRules?.logoUrls?.[1]?.url ? <img src={data.visualRules.logoUrls[1].url} alt="Brand Logo" className="w-full h-full object-contain" /> : (data.visualRules?.logoUrls?.[0]?.url ? <img src={data.visualRules.logoUrls[0].url} alt="Brand Logo" className="w-full h-full object-contain" /> : <span className="font-black text-foreground text-xl">{data.name?.[0] || 'B'}</span>)}
                 </div>
                 <div className="space-y-4 max-w-[80%]">
                   <h3 className="text-3xl font-black text-foreground leading-none uppercase tracking-tighter" style={{ fontFamily: headingFont }}>{data.tagline || 'Ad Headline'}</h3>
                   <Button className="h-10 px-8 bg-background text-foreground hover:bg-surface-2 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl">{data.strategy?.ctaPreference || 'Click Here'}</Button>
                 </div>
               </div>
             </div>
          </TabsContent>
        </Tabs>
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
