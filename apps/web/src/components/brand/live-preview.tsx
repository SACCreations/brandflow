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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800 backdrop-blur-xl relative z-20">
      <div className="h-20 px-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-brand-600" />
          Live Preview
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl shadow-inner border border-gray-200 dark:border-gray-800/50 dark:border-gray-700/50">
          <button 
            onClick={() => setDevice('mobile')}
            className={cn(
              "p-2 rounded-lg transition-all",
              device === 'mobile' ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600" : "text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-white"
            )}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('desktop')}
            className={cn(
              "p-2 rounded-lg transition-all",
              device === 'desktop' ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600" : "text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-white"
            )}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
        <Tabs defaultValue="web" className="w-full flex flex-col items-center">
          <TabsList className="mb-8 bg-white dark:bg-gray-900/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner backdrop-blur-sm">
            <TabsTrigger value="web" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-brand-600 data-[state=active]:shadow-lg data-[state=active]:text-white transition-all">Web</TabsTrigger>
            <TabsTrigger value="social" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-brand-600 data-[state=active]:shadow-lg data-[state=active]:text-white transition-all">Social</TabsTrigger>
            <TabsTrigger value="ads" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-brand-600 data-[state=active]:shadow-lg data-[state=active]:text-white transition-all">Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="web" className="w-full mt-0 focus-visible:ring-0 flex justify-center">
            <div className={cn(
              "bg-white dark:bg-gray-950 shadow-2xl rounded-[2rem] border-8 border-gray-200 dark:border-gray-800 transition-all duration-500 overflow-hidden relative",
              device === 'mobile' ? "w-[320px] h-[600px] rounded-[3rem]" : "w-full max-w-[600px] min-h-[400px] rounded-2xl border-4"
            )}>
              {/* Fake Browser/Phone Header */}
              <div className="h-6 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-1.5">
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
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900/90 dark:bg-gray-950/90 backdrop-blur-md z-10" style={{ fontFamily: headingFont }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                      {data.visualRules?.logoUrls?.[0]?.url ? (
                        <img src={data.visualRules.logoUrls[0].url} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-white font-black text-xs"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                          {data.name?.[0] || 'B'}
                        </div>
                      )}
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight truncate max-w-[120px] text-gray-900 dark:text-white">{data.name || 'Brand'}</span>
                  </div>
                </div>

                <div className="p-8 space-y-8 bg-white dark:bg-gray-950 flex flex-col items-center justify-center text-center mt-4">
                  <Badge 
                    variant="outline" 
                    className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest border-2"
                    style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
                  >
                    {data.industry || 'Industry'}
                  </Badge>
                  <h1 
                    className="text-3xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white"
                    style={{ fontFamily: headingFont }}
                  >
                    {data.tagline || 'Your tagline appears here.'}
                  </h1>
                  <p 
                    className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm max-w-sm mx-auto"
                    style={{ fontFamily: bodyFont }}
                  >
                    {data.description || 'This is a sample description of your brand to show how the typography scales look in context.'}
                  </p>
                  <Button 
                    className="rounded-2xl shadow-xl shadow-brand-500/30 h-12 px-8 font-black text-[10px] uppercase tracking-widest text-white border-none mt-4 transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {data.strategy?.ctaPreference || 'Get Started'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="w-full mt-0 focus-visible:ring-0 flex justify-center">
             <div className="w-[320px] bg-white dark:bg-gray-950 rounded-[3rem] border-8 border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl relative">
                <div className="h-6 bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative z-20">
                    <div className="w-16 h-4 bg-black rounded-b-xl absolute top-0" />
                </div>
                <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center font-bold text-xs overflow-hidden border-2 border-transparent shadow-inner" style={{ borderColor: `${primaryColor}30`}}>
                    {data.visualRules?.logoUrls?.[0]?.url ? <img src={data.visualRules.logoUrls[0].url} alt="Brand Logo" className="w-full h-full object-cover" /> : <span className="text-brand-600 font-black">{data.name?.[0] || 'B'}</span>}
                  </div>
                  <span className="text-xs font-black uppercase text-gray-900 dark:text-white tracking-widest">{data.name || 'Brand'}</span>
                </div>
                <div className="aspect-[4/5] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
                  <div 
                    className="w-full h-full rounded-3xl flex flex-col items-center justify-center p-8 text-center text-white relative z-10 shadow-2xl backdrop-blur-sm border border-white/20"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <h3 className="text-2xl font-black uppercase leading-tight mb-4 tracking-tighter" style={{ fontFamily: headingFont }}>{data.tagline || 'Post Title'}</h3>
                    <div className="w-16 h-1 bg-white dark:bg-gray-900/50 rounded-full mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90" style={{ fontFamily: bodyFont }}>{data.designPreferences?.preferredStyle || 'Modern'} Aesthetic</p>
                  </div>
                </div>
                <div className="p-5 space-y-3 bg-white dark:bg-gray-950">
                   <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                     <span className="font-black text-gray-900 dark:text-white mr-2">{data.name || 'Brand'}</span>
                     {data.description || 'Sample caption text goes here.'}
                   </p>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="ads" className="w-full mt-0 focus-visible:ring-0 flex justify-center">
             <div className="w-full max-w-[500px] aspect-[16/9] bg-gray-950 rounded-3xl overflow-hidden relative shadow-2xl border border-gray-200 dark:border-gray-800 group">
               <div className="absolute inset-0 opacity-60">
                 <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-purple-600" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
               </div>
               <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">
                 <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center p-2 shadow-2xl border border-white/20">
                    {data.visualRules?.logoUrls?.[1]?.url ? <img src={data.visualRules.logoUrls[1].url} alt="Brand Logo" className="w-full h-full object-contain" /> : (data.visualRules?.logoUrls?.[0]?.url ? <img src={data.visualRules.logoUrls[0].url} alt="Brand Logo" className="w-full h-full object-contain" /> : <span className="font-black text-gray-900 dark:text-white text-xl">{data.name?.[0] || 'B'}</span>)}
                 </div>
                 <div className="space-y-4 max-w-[80%]">
                   <h3 className="text-3xl font-black text-white leading-none uppercase tracking-tighter" style={{ fontFamily: headingFont }}>{data.tagline || 'Ad Headline'}</h3>
                   <Button className="h-10 px-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl">{data.strategy?.ctaPreference || 'Click Here'}</Button>
                 </div>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 dark:bg-gray-950/80 backdrop-blur-md sticky bottom-0 z-10">
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
