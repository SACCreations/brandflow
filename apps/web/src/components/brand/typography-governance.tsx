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
  Plus,
  Search,
  Info
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

const COMMON_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Oswald', 'Source Sans Pro', 'Playfair Display', 
  'Merriweather', 'Nunito', 'Raleway', 'Ubuntu', 'PT Sans', 'Lora', 'Work Sans', 'Fira Sans', 'Quicksand', 'Outfit',
  'Satoshi', 'Clash Display', 'JetBrains Mono', 'Space Grotesk', 'DM Sans', 'Syne', 'Manrope'
];

function getFallbackStack(font: string) {
  const sansFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Outfit', 'Satoshi', 'DM Sans', 'Manrope'];
  const serifFonts = ['Playfair Display', 'Merriweather', 'Lora'];
  const monoFonts = ['JetBrains Mono', 'Fira Code', 'Space Mono'];
  
  if (serifFonts.includes(font)) return `"${font}", Georgia, serif`;
  if (monoFonts.includes(font)) return `"${font}", monospace`;
  return `"${font}", system-ui, -apple-system, sans-serif`;
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
  
  const activeFonts = Array.from(new Set(settings.map(s => s.fontFamily).filter(Boolean)));

  // Dynamically load selected fonts from Google Fonts
  React.useEffect(() => {
    activeFonts.forEach(font => {
      if (!font || font.includes('system-ui') || font === 'sans-serif' || font === 'serif') return;
      const linkId = `google-font-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [activeFonts]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="space-y-4 p-6 rounded-3xl bg-background/40 border border-transparent shadow-2xl shadow-gray-200/40 dark:shadow-none hover:shadow-lg transition-all group ring-1 ring-gray-200/50 dark:ring-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-brand-900/40 text-primary">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground leading-none">{setting.label}</h3>
                    <p className="text-[9px] font-medium text-muted-foreground mt-1">Google Font or System Font</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black h-5 px-2">98% CONFIDENCE</Badge>
                  <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
                    <Info className="w-3 h-3" /> Auto-detected
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 relative">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Font Family</span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input 
                      value={setting.fontFamily || ''}
                      onChange={(e) => onChange(settings.map(s => s.id === setting.id ? { ...s, fontFamily: e.target.value } : s))}
                      list={`fonts-${setting.id}`}
                      placeholder="Search 1000+ fonts..."
                      className="h-12 pl-10 rounded-2xl bg-surface-1 dark:bg-gray-950/50 bg-surface-2/30 border-border/60 dark:border-gray-700/50 shadow-inner font-bold text-sm"
                    />
                    <datalist id={`fonts-${setting.id}`}>
                      {COMMON_FONTS.map(font => <option key={font} value={font} />)}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Weight</span>
                  <Select value={setting.weight || '400'} onValueChange={(val) => onChange(settings.map(s => s.id === setting.id ? { ...s, weight: val } : s))}>
                    <SelectTrigger className="h-12 rounded-2xl bg-surface-1 dark:bg-gray-950/50 bg-surface-2/30 border-border/60 dark:border-gray-700/50 shadow-inner">
                      <SelectValue placeholder="Weight" />
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

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2 ml-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">CSS Fallback Stack</span>
                </div>
                <code className="block w-full p-3 rounded-xl bg-background text-muted-foreground text-[10px] font-mono whitespace-nowrap overflow-x-auto shadow-inner">
                   font-family: {getFallbackStack(setting.fontFamily || 'sans-serif')};
                </code>
              </div>

              <div className="p-6 rounded-2xl bg-surface-1 dark:bg-gray-950/50 bg-surface-2/20 border border-border/60/50 mt-4 overflow-hidden relative min-h-[120px] flex items-center justify-center shadow-inner">
                <p 
                  className="text-center transition-all duration-500 max-w-[80%]"
                  style={{ 
                    fontFamily: setting.fontFamily ? getFallbackStack(setting.fontFamily) : 'sans-serif', 
                    fontWeight: setting.weight,
                    fontSize: setting.id === 'h' ? '1.75rem' : '1.125rem',
                    lineHeight: '1.4'
                  }}
                >
                  {setting.id === 'h' ? 'The Quick Brown Fox' : 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.'}
                </p>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 bg-background/80 backdrop-blur-md shadow-sm border border-border/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Live</span>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full rounded-3xl text-[10px] font-black uppercase tracking-widest h-14 border-2 border-dashed border-border/60 hover:border-primary/50 bg-background/50 hover:bg-surface-1 transition-all"
              onClick={() => onChange([...settings, { id: Math.random().toString(), label: 'Custom Font', fontFamily: 'Inter', weight: '400', sizeScale: '1rem', lineHeight: '1.5' }])}
            >
               <Plus className="w-5 h-5 mr-2 text-primary" /> Add Font
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-brand-500/20 dark:shadow-none space-y-4 ring-1 ring-brand-400/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
              <Type className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <Sparkles className="w-5 h-5 text-brand-200" />
              <h3 className="text-sm font-black uppercase tracking-widest text-primary-foreground">Typography Signal</h3>
            </div>
            <p className="text-sm font-medium text-primary-foreground/90 leading-relaxed opacity-90 relative z-10">
              {hasDetectedPairing
                ? <>Detected typography from your brand data: <span className="font-bold underline text-white">{headingFont || 'Not set'}</span> (Headings), <span className="font-bold underline text-white">{bodyFont || 'Not set'}</span> (Body), <span className="font-bold underline text-white">{supportingFont || 'Not set'}</span> (Supporting), and <span className="font-bold underline text-white">{backupFont || 'Not set'}</span> (Backup).</>
                : 'No typography was confidently detected from the analysed brand sources yet. Add or adjust fonts manually if needed.'}
            </p>
            <div className="relative z-10 pt-4">
              <Button className="w-full bg-background text-primary hover:bg-primary/10 rounded-2xl text-[10px] font-black uppercase tracking-widest h-12 shadow-lg" disabled={!hasDetectedPairing}>
                {hasDetectedPairing ? 'Keep Detected Typography' : 'Await Source Signals'}
              </Button>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-transparent dark:border-transparent bg-background/40 shadow-2xl shadow-gray-200/40 dark:shadow-none space-y-6 ring-1 ring-gray-200/50 dark:ring-white/10 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scale Governance</h3>
            <div className="space-y-4">
              {scales.map((item, i) => (
                <div key={item.id} className="group p-4 rounded-2xl hover:bg-surface-1 dark:bg-gray-950/50 dark:hover:bg-surface-1/30 transition-all border border-transparent hover:border-border/60 dark:hover:border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col flex-1 mr-4">
                      <Input 
                        value={item.label} 
                        onChange={(e) => onScaleChange(scales.map(s => s.id === item.id ? { ...s, label: e.target.value } : s))}
                        className="h-8 text-[11px] font-black text-foreground uppercase tracking-tight bg-transparent border-none p-0 focus-visible:ring-0 placeholder:text-gray-300"
                        placeholder="Scale Name"
                      />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black h-5 px-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background">EDITABLE</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground uppercase">Size</div>
                      <Input 
                        value={item.size} 
                        onChange={(e) => onScaleChange(scales.map(s => s.id === item.id ? { ...s, size: e.target.value } : s))}
                        className="h-10 text-[11px] font-bold bg-surface-1 dark:bg-gray-950/50 bg-surface-2/30 border-border/60 dark:border-gray-700/50 rounded-xl pl-10 text-foreground shadow-inner"
                        placeholder="e.g. 16px"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground uppercase">LS</div>
                      <Input 
                        value={item.spacing} 
                        onChange={(e) => onScaleChange(scales.map(s => s.id === item.id ? { ...s, spacing: e.target.value } : s))}
                        className="h-10 text-[11px] font-bold bg-surface-1 dark:bg-gray-950/50 bg-surface-2/30 border-border/60 dark:border-gray-700/50 rounded-xl pl-10 text-foreground shadow-inner"
                        placeholder="e.g. -0.02em"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
             <div className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-2xl text-[10px] font-black uppercase tracking-widest h-12 border-2 border-dashed border-primary/30 hover:border-primary/50 bg-background text-foreground hover:bg-surface-1 transition-all"
                  onClick={() => onScaleChange([...scales, { id: Math.random().toString(), label: 'Custom Scale', size: '16px', spacing: '0' }])}
                >
                   <Plus className="w-4 h-4 mr-2 text-primary" /> Add custom scale
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
