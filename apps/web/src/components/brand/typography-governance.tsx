'use client';

import * as React from 'react';
import { 
  Type, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Maximize2,
  Plus
} from 'lucide-react';
import { Button, cn, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brandflow/ui';

interface TypographySettings {
  id: string;
  label: string;
  fontFamily: string;
  weight: string;
  sizeScale: string;
  lineHeight: string;
}

interface TypographyScale {
  id: string;
  label: string;
  size: string;
  spacing: string;
}

interface TypographyGovernanceProps {
  settings: TypographySettings[];
  scales: TypographyScale[];
  onChange: (settings: TypographySettings[]) => void;
  onScaleChange: (scales: TypographyScale[]) => void;
}

export function TypographyGovernance({ 
  settings = [], 
  scales = [], 
  onChange, 
  onScaleChange 
}: TypographyGovernanceProps) {
  const headingFont = settings.find((setting) => setting.id === 'h')?.fontFamily;
  const bodyFont = settings.find((setting) => setting.id === 'b')?.fontFamily;
  const supportingFont = settings.find((setting) => setting.id === 's')?.fontFamily;
  const backupFont = settings.find((setting) => setting.id === 'bs')?.fontFamily;
  const hasDetectedPairing = Boolean(headingFont || bodyFont || supportingFont || backupFont);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="space-y-3 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600">
                    <Type className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{setting.label}</h3>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black h-5 px-2">READABLE</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Select value={setting.fontFamily} onValueChange={(val) => onChange(settings.map(s => s.id === setting.id ? { ...s, fontFamily: val } : s))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-brand-200">
                       <div className="flex flex-col items-start leading-none">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Font Family</span>
                        <SelectValue placeholder="Select Font" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Sans)</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display (Serif)</SelectItem>
                      <SelectItem value="JetBrains Mono">JetBrains Mono (Monospace)</SelectItem>
                      <SelectItem value="Outfit">Outfit (Geometric)</SelectItem>
                      <SelectItem value="Satoshi">Satoshi (Modern)</SelectItem>
                      <SelectItem value="Clash Display">Clash Display (Bold)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Select value={setting.weight} onValueChange={(val) => onChange(settings.map(s => s.id === setting.id ? { ...s, weight: val } : s))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-brand-200">
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Weight</span>
                        <SelectValue placeholder="Weight" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">300 - Light</SelectItem>
                      <SelectItem value="400">400 - Regular</SelectItem>
                      <SelectItem value="500">500 - Medium</SelectItem>
                      <SelectItem value="600">600 - SemiBold</SelectItem>
                      <SelectItem value="700">700 - Bold</SelectItem>
                      <SelectItem value="900">900 - Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 mt-4 overflow-hidden relative min-h-[100px] flex items-center justify-center">
                <p 
                  className="text-center transition-all duration-500"
                  style={{ 
                    fontFamily: setting.fontFamily, 
                    fontWeight: setting.weight,
                    fontSize: '1.25rem',
                    lineHeight: '1.5'
                  }}
                >
                  The quick brown fox jumps over the lazy dog.
                </p>
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black text-gray-400 uppercase">Live Rendering</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-100 dark:shadow-none space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Typography Signal</h3>
            </div>
            <p className="text-xs font-medium text-brand-50 leading-relaxed opacity-90">
              {hasDetectedPairing
                ? <>Detected typography from your brand data: <span className="font-bold underline">{headingFont || 'Not set'}</span> (Headings), <span className="font-bold underline">{bodyFont || 'Not set'}</span> (Body), <span className="font-bold underline">{supportingFont || 'Not set'}</span> (Supporting), and <span className="font-bold underline">{backupFont || 'Not set'}</span> (Backup).</>
                : 'No typography was confidently detected from the analysed brand sources yet. Add or adjust fonts manually if needed.'}
            </p>
            <Button className="w-full bg-white text-brand-600 hover:bg-brand-50 rounded-xl text-[10px] font-black uppercase tracking-widest h-10 shadow-lg" disabled={!hasDetectedPairing}>
              {hasDetectedPairing ? 'Keep Current Pairing' : 'Await Source Signals'}
            </Button>
          </div>

          <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scale Governance</h3>
            <div className="space-y-4">
              {scales.map((item, i) => (
                <div key={item.id} className="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <Input 
                        value={item.label} 
                        onChange={(e) => onScaleChange(scales.map(s => s.id === item.id ? { ...s, label: e.target.value } : s))}
                        className="h-6 text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight bg-transparent border-none p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black h-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity">EDITABLE</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400 uppercase">Size</div>
                      <Input 
                        value={item.size} 
                        onChange={(e) => onScaleChange(scales.map(s => s.id === item.id ? { ...s, size: e.target.value } : s))}
                        className="h-8 text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-lg pl-8 text-gray-900 dark:text-white"
                        placeholder="Size"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400 uppercase">LS</div>
                      <Input 
                        value={item.spacing} 
                        onChange={(e) => onScaleChange(scales.map(s => s.id === item.id ? { ...s, spacing: e.target.value } : s))}
                        className="h-8 text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-lg pl-8 text-gray-900 dark:text-white"
                        placeholder="Spacing"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
             <div className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-9 border-dashed border-gray-200 dark:border-gray-700 hover:bg-brand-50 hover:text-brand-600"
                  onClick={() => onScaleChange([...scales, { id: Math.random().toString(), label: 'Custom Scale', size: '16px', spacing: '0' }])}
                >
                   <Plus className="w-3 h-3 mr-1" /> Add custom scale
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
