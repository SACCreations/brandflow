'use client';

import * as React from 'react';
import { X, Upload, Eye, CheckCircle2, AlertCircle, Info, Maximize2, Globe } from 'lucide-react';
import { Button, cn, Progress } from '@brandflow/ui';

interface LogoAssetCardProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  required?: boolean;
}

export function LogoAssetCard({ 
  label, 
  description, 
  value, 
  onChange, 
  onRemove,
  required 
}: LogoAssetCardProps) {
  const [bg, setBg] = React.useState<'light' | 'dark' | 'grid'>('light');
  const [showSafeZone, setShowSafeZone] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [metrics, setMetrics] = React.useState<{ width: number; height: number; contrast: string; transparency: boolean } | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      onChange(url);
      setMetrics(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="group space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-foreground">{label}</span>
            {required && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Required</span>}
          </div>
          {description && <p className="text-[10px] text-muted-foreground font-medium">{description}</p>}
        </div>
        
        {value && (
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={cn(
                "p-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter transition-all",
                showSafeZone ? "bg-primary text-foreground border-brand-600" : "bg-background bg-surface-2 text-muted-foreground border-border"
              )}
            >
              Safe Zone
            </button>
            <div className="flex items-center bg-surface-3 p-0.5 rounded-lg border border-border shadow-inner scale-90">
              <button 
                type="button"
                onClick={() => setBg('light')}
                className={cn("p-1 rounded transition-all", bg === 'light' ? "bg-background bg-surface-3 shadow-sm" : "opacity-40")}
              >
                <div className="w-3 h-3 bg-background border border-border rounded-sm" />
              </button>
              <button 
                type="button"
                onClick={() => setBg('dark')}
                className={cn("p-1 rounded transition-all", bg === 'dark' ? "bg-background bg-surface-3 shadow-sm" : "opacity-40")}
              >
                <div className="w-3 h-3 bg-background rounded-sm" />
              </button>
              <button 
                type="button"
                onClick={() => setBg('grid')}
                className={cn("p-1 rounded transition-all", bg === 'grid' ? "bg-background bg-surface-3 shadow-sm" : "opacity-40")}
              >
                <div className="w-3 h-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:4px_4px] rounded-sm" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "relative aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center gap-4 text-center",
        !value ? "border-border/60 hover:border-primary/20 bg-surface-1 dark:bg-gray-950/50 bg-background/30" : "border-transparent shadow-xl",
        bg === 'dark' && value ? "bg-gray-950" : bg === 'grid' && value ? "bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" : "bg-background"
      )}>
        {isUploading ? (
          <div className="w-full max-w-[140px] space-y-3">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-primary">
              <span>Uploading</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-brand-100" />
          </div>
        ) : value ? (
          <>
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <img src={value} alt={label} className="max-w-full max-h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105 z-10" />
              
              {showSafeZone && (
                <div className="absolute inset-0 border-4 border-primary/20 border-dashed m-8 pointer-events-none z-20">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[8px] font-black text-foreground px-1.5 py-0.5 rounded uppercase">Clearance</div>
                </div>
              )}
            </div>
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center gap-2 z-30">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest bg-background text-foreground hover:bg-surface-2"
                asChild
              >
                <a href={value} target="_blank" rel="noopener noreferrer">
                  <Maximize2 className="w-3 h-3 mr-1.5" /> View
                </a>
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                size="sm" 
                onClick={onRemove}
                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-700"
              >
                <X className="w-3 h-3 mr-1.5" /> Remove
              </Button>
            </div>
          </>
        ) : (
          <div 
            className="cursor-pointer group/upload"
            onClick={() => document.getElementById(`logo-upload-${label}`)?.click()}
          >
            <div className="w-12 h-12 rounded-2xl bg-background bg-surface-2 shadow-sm border border-border/60 border-border flex items-center justify-center text-muted-foreground group-hover/upload:scale-110 group-hover/upload:text-primary transition-all mx-auto mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover/upload:text-gray-600 transition-colors">Select Asset</p>
          </div>
        )}
        
        <input 
          id={`logo-upload-${label}`}
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload}
        />
      </div>

      {value && metrics && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase">
              <CheckCircle2 className="w-3 h-3" />
              Contrast {metrics.contrast}
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase">
              <Globe className="w-3 h-3" />
              SVG Ready
            </div>
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
            {metrics.width}x{metrics.height} • Transparent
          </div>
        </div>
      )}
    </div>
  );
}
