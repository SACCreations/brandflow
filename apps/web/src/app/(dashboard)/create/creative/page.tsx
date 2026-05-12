'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ImageIcon, 
  Layout, 
  ChevronRight, 
  Maximize2, 
  Download, 
  RotateCcw,
  Palette,
  Type,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
  Monitor,
  Smartphone,
  SmartphoneIcon
} from 'lucide-react';

export default function CreativeBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('square');
  const [useBrandRules, setUseBrandRules] = useState(true);

  const formats = [
    { id: 'square', name: 'Instagram / Square', icon: <Smartphone className="h-4 w-4" />, ratio: '1:1' },
    { id: 'portrait', name: 'LinkedIn / Portrait', icon: <Layers className="h-4 w-4" />, ratio: '4:5' },
    { id: 'landscape', name: 'Twitter / Landscape', icon: <Monitor className="h-4 w-4" />, ratio: '16:9' }
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">AI Creative Studio</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Generate high-fidelity assets that never break your brand rules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            <Layout className="h-4 w-4" /> Templates
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all">
            <ImageIcon className="h-4 w-4" /> Asset Library
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Creation Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              Creative Concept
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Prompt</label>
                <div className="relative">
                  <textarea 
                    className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    rows={4}
                    placeholder="e.g. A futuristic office with clean glass surfaces and lush green plants..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button className="absolute right-3 bottom-3 text-brand-600 hover:text-brand-700">
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Apply Brand Identity</span>
                </div>
                <button 
                  onClick={() => setUseBrandRules(!useBrandRules)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${useBrandRules ? 'bg-brand-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useBrandRules ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((f) => (
                    <button 
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                        selectedFormat === f.id ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {f.icon}
                      <span className="text-[10px] font-bold">{f.ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <><RotateCcw className="h-4 w-4 animate-spin" /> Enhancing & Generating...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Generate Asset</>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 dark:border-emerald-500/10 dark:bg-emerald-500/5">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Identity Check
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-[11px] font-medium text-emerald-700 dark:text-emerald-400/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Color Palette Injection Active
              </li>
              <li className="flex items-center gap-3 text-[11px] font-medium text-emerald-700 dark:text-emerald-400/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Logo Overlays Ready
              </li>
            </ul>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-900 dark:text-white">Live Preview</span>
                <span className="text-[10px] text-gray-400 uppercase font-black">{selectedFormat}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"><Maximize2 className="h-4 w-4" /></button>
                <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"><Download className="h-4 w-4" /></button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-12">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
                  <span className="text-xs font-bold text-gray-400 animate-pulse uppercase tracking-widest">AI Painting...</span>
                </div>
              ) : (
                <div className={`relative bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-500 ${
                  selectedFormat === 'square' ? 'aspect-square w-80' : 
                  selectedFormat === 'portrait' ? 'aspect-[4/5] h-[450px]' : 
                  'aspect-[16/9] w-full'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <span className="text-[10px] font-bold uppercase">Awaiting Concept</span>
                  </div>
                  {/* Mock Brand Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <div className="h-2 w-24 bg-white/40 rounded mb-2" />
                    <div className="h-4 w-48 bg-white/60 rounded" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <button key={i} className="aspect-square rounded-xl bg-white border border-gray-200 hover:border-brand-500 transition-all flex flex-col items-center justify-center text-gray-300">
                <ImageIcon className="h-6 w-6" />
                <span className="text-[8px] font-bold mt-1 uppercase">v0.{i}</span>
              </button>
            ))}
            <button className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-500 hover:text-brand-500">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
