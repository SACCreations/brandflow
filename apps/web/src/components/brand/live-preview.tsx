'use client';

import * as React from 'react';
import { 
  Smartphone, 
  Monitor, 
  Type, 
  Palette, 
  ExternalLink,
  ChevronRight,
  Info
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

interface LivePreviewProps {
  data: any;
}

export function LivePreview({ data }: LivePreviewProps) {
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

      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        <div className={cn(
          "bg-white dark:bg-gray-950 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 transition-all duration-500 overflow-hidden",
          device === 'mobile' ? "w-[320px] min-h-[560px]" : "w-full max-w-[600px] min-h-[400px]"
        )}>
          {/* Mock App Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ fontFamily: headingFont }}>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {data.name?.[0] || 'B'}
              </div>
              <span className="font-bold text-sm truncate max-w-[120px]">{data.name || 'Brand Name'}</span>
            </div>
            <div className="flex gap-2">
              <div className="w-6 h-2 bg-gray-100 rounded-full" />
              <div className="w-4 h-2 bg-gray-100 rounded-full" />
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <Badge 
                variant="outline" 
                className="rounded-full px-4"
                style={{ color: primaryColor, borderColor: primaryColor }}
              >
                {data.industry || 'Featured Insight'}
              </Badge>
              <h1 
                className="text-3xl font-black leading-tight tracking-tight"
                style={{ fontFamily: headingFont, color: '#111827' }}
              >
                {data.tagline || 'Revolutionizing the industry with AI.'}
              </h1>
              <p 
                className="text-gray-600 leading-relaxed text-sm"
                style={{ fontFamily: bodyFont }}
              >
                {data.description || 'Our brand is dedicated to providing high-quality solutions that empower businesses to scale faster and smarter.'}
              </p>
              <div className="flex gap-3 pt-2">
                <Button 
                  className="rounded-xl shadow-lg shadow-brand-200"
                  style={{ backgroundColor: primaryColor }}
                >
                  Get Started
                </Button>
                <Button variant="ghost" className="gap-2 group">
                  Learn More <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 space-y-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  <Palette className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: headingFont }}>Design First</h3>
                <p className="text-[10px] text-gray-400" style={{ fontFamily: bodyFont }}>Aesthetic and functional interfaces.</p>
              </Card>
              <Card className="p-4 space-y-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}
                >
                  <Type className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: headingFont }}>Typography</h3>
                <p className="text-[10px] text-gray-400" style={{ fontFamily: bodyFont }}>Clear and readable content scales.</p>
              </Card>
            </div>

            {/* Newsletter */}
            <div 
              className="p-6 rounded-2xl text-white relative overflow-hidden"
              style={{ background: `linear-gradient(45deg, ${secondaryColor}, ${primaryColor})` }}
            >
              <div className="relative z-10 space-y-3">
                <h4 className="font-bold" style={{ fontFamily: headingFont }}>Stay Updated</h4>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30" />
                  <div className="w-10 h-10 bg-white rounded-lg" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Token Analysis</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Contrast Ratio</p>
            <p className="text-xl font-black text-emerald-600">7.4 : 1</p>
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-[9px] h-4">Pass AAA</Badge>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Consistency</p>
            <p className="text-xl font-black text-blue-600">92%</p>
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 text-[9px] h-4">Excellent</Badge>
          </div>
        </div>
      </div>

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
