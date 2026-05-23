'use client';

import * as React from 'react';
import { 
  Smartphone, 
  Monitor, 
  Type, 
  Palette, 
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { 
  Card, 
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
  
  const primaryColor = data.visualRules?.primaryColor || '#6366f1';
  const secondaryColor = data.visualRules?.secondaryColor || '#a855f7';
  const accentColor = data.visualRules?.accentColor || '#f59e0b';
  const headingFont = data.visualRules?.headingFont || data.visualRules?.fontFamily || 'Inter';
  const bodyFont = data.visualRules?.bodyFont || data.visualRules?.fontFamily || 'Inter';

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50 border-l border-gray-100 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-brand-600" />
          Live Preview
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button 
            onClick={() => setDevice('mobile')}
            className={cn(
              "p-1.5 rounded-md transition-all",
              device === 'mobile' ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600" : "text-gray-500"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setDevice('desktop')}
            className={cn(
              "p-1.5 rounded-md transition-all",
              device === 'desktop' ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600" : "text-gray-500"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start custom-scrollbar">
        <Tabs defaultValue="web" className="w-full flex flex-col items-center">
          <TabsList className="mb-8 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
            <TabsTrigger value="web" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-brand-600 transition-all">Web</TabsTrigger>
            <TabsTrigger value="social" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-brand-600 transition-all">Social</TabsTrigger>
            <TabsTrigger value="post" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-brand-600 transition-all">Sample Post</TabsTrigger>
            <TabsTrigger value="ads" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-brand-600 transition-all">Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="web" className="w-full mt-0 focus-visible:ring-0">
            <div className={cn(
              "bg-white dark:bg-gray-950 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 transition-all duration-500 overflow-hidden mx-auto",
              device === 'mobile' ? "w-[320px] min-h-[560px]" : "w-full max-w-[600px] min-h-[400px]"
            )}>
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950" style={{ fontFamily: headingFont }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-sm border border-gray-100 dark:border-gray-800">
                    {data.visualRules?.logoUrls?.[0]?.url ? (
                      <img src={data.visualRules.logoUrls[0].url} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-bold"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        {data.name?.[0] || 'B'}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-sm truncate max-w-[120px] text-gray-900 dark:text-white">{data.name || 'Brand Name'}</span>
                </div>
              </div>

              <div className="p-8 space-y-8 bg-white dark:bg-gray-950">
                <div className="space-y-4 text-center">
                  <Badge 
                    variant="outline" 
                    className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest"
                    style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}05` }}
                  >
                    {data.industry || 'Featured Insight'}
                  </Badge>
                  <h1 
                    className="text-3xl font-black leading-tight tracking-tight text-gray-900 dark:text-white"
                    style={{ fontFamily: headingFont }}
                  >
                    {data.tagline || 'Revolutionizing the industry with AI.'}
                  </h1>
                  <p 
                    className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm max-w-sm mx-auto"
                    style={{ fontFamily: bodyFont }}
                  >
                    {data.description || 'Our brand is dedicated to providing high-quality solutions that empower businesses.'}
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button 
                      className="rounded-xl shadow-lg shadow-brand-500/20 h-10 px-6 font-bold text-white border-none transition-transform active:scale-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {data.strategy?.ctaPreference || 'Get Started'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="w-full mt-0 focus-visible:ring-0">
             <div className="w-[320px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl mx-auto">
                <div className="p-3 flex items-center gap-2 border-b border-gray-50 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center font-bold text-xs overflow-hidden border border-gray-100 dark:border-gray-800 shadow-inner">
                    {data.visualRules?.logoUrls?.[0]?.url ? <img src={data.visualRules.logoUrls[0].url} className="w-full h-full object-cover" /> : <span className="text-brand-600">{data.name?.[0]}</span>}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-900 dark:text-white tracking-widest">{data.name || 'Brand'}</span>
                </div>
                <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
                  <div 
                    className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <h3 className="text-xl font-black uppercase mb-4" style={{ fontFamily: headingFont }}>{data.tagline || 'The Future'}</h3>
                    <div className="w-12 h-1 bg-white/30 rounded-full mb-4" />
                    <p className="text-[10px] font-medium opacity-80" style={{ fontFamily: bodyFont }}>Empowered by Brand Intelligence</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                   <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                     <span className="font-bold text-gray-900 dark:text-white mr-2">{data.name || 'Brand'}</span>
                     {data.strategy?.contentLanguage === 'tamil' ? 'எங்கள் புதிய அடையாளம் இங்கே! #Branding' : 'Our new identity is live! #Branding'}
                   </p>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="post" className="w-full mt-0 focus-visible:ring-0">
             <div className="w-[320px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl mx-auto">
                <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">AI Content Engine</h4>
                      <p className="text-[8px] font-bold text-brand-600">SAMPLE REEL / POST</p>
                   </div>
                </div>
                <div className="p-6 space-y-4">
                   <div className="space-y-2">
                      <div className="w-full h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden group">
                         <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                         <div className="relative z-10 text-center px-4">
                            <h5 className="text-xs font-black text-white uppercase tracking-tight mb-1" style={{ fontFamily: headingFont }}>
                               {data.strategy?.contentLanguage === 'tamil' ? 'வணக்கம்! புதிய அறிவிப்பு.' : 'Exciting News!'}
                            </h5>
                            <p className="text-[8px] text-white/80" style={{ fontFamily: bodyFont }}>{data.designPreferences?.imageStyle || 'Minimal'} Aesthetic Applied</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium italic">
                         "{data.strategy?.contentLanguage === 'tamil' ? 'உங்கள் பிராண்டை அடுத்த நிலைக்கு கொண்டு செல்லுங்கள்.' : 'Take your brand to the next level with our AI-driven strategies.'}"
                      </p>
                      <Button className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg" style={{ backgroundColor: primaryColor }}>
                         {data.strategy?.ctaPreference || 'Click Here'}
                      </Button>
                   </div>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 mt-2">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800" />)}
                   </div>
                   <span className="text-[8px] font-bold text-gray-400">LIKED BY 1.2K OTHERS</span>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="ads" className="w-full mt-0 focus-visible:ring-0">
             <div className="w-full max-w-[400px] aspect-[16/9] bg-gray-950 rounded-2xl overflow-hidden relative group mx-auto">
               <div className="absolute inset-0 opacity-40">
                 <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-purple-600" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
               </div>
               <div className="absolute inset-0 p-8 flex flex-col justify-between">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl border border-gray-100">
                    {data.visualRules?.logoUrls?.[0]?.url ? <img src={data.visualRules.logoUrls[0].url} className="w-full h-full object-contain" /> : <span className="font-black text-gray-900">{data.name?.[0] || 'B'}</span>}
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white leading-tight uppercase" style={{ fontFamily: headingFont }}>{data.tagline || 'Redefine Everything'}</h3>
                   <Button className="h-8 px-6 bg-white text-gray-900 font-bold text-[10px] uppercase rounded-lg">{data.strategy?.ctaPreference || 'Get Started'}</Button>
                 </div>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>


      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
        <QualityAnalysis checkResult={qualityCheck || null} isLoading={isLoadingQuality} />
      </div>

      {/* Font loaders for preview */}


      {/* Font loaders for preview */}
      {headingFont && (
        <link href={`https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@900&display=swap`} rel="stylesheet" />
      )}
      {bodyFont && bodyFont !== headingFont && (
        <link href={`https://fonts.googleapis.com/css2?family=${bodyFont.replace(/ /g, '+')}:wght@400;700&display=swap`} rel="stylesheet" />
      )}
    </div>
  );
}
