'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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
  Send,
  Sliders,
  Eye,
  Undo2,
  Redo2,
  Trash2,
  Layers3,
  Copy,
  Lock,
  Unlock,
  Check,
  Scale,
  MessageSquare,
  Shield,
  Clock,
  ExternalLink,
  Share2,
  HelpCircle
} from 'lucide-react';

// Define TS Types for our Premium Studio
interface CanvasLayer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'logo';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  src?: string;
  isLocked?: boolean;
}

interface CommentAnnotation {
  id: string;
  user: string;
  avatar: string;
  role: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stage: string;
  time: string;
}

export default function CreativeBuilderPage() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId');

  const { data: assets } = useQuery({
    queryKey: ['workspace-assets'],
    queryFn: async () => {
      const res = await apiClient.get('/images');
      return res.data as { id: string; cdnUrl: string; fileName: string; type: string }[];
    },
  });

  const activeAsset = assets?.find(a => a.id === assetId);

  // --- Content Source Selection (Step 1) ---
  const [contentSource, setContentSource] = useState<'approved' | 'manual' | 'campaign' | 'library'>('manual');
  const [marketingText, setMarketingText] = useState('');
  
  // --- Brand Context Picker (Step 2) ---
  const [selectedBrand, setSelectedBrand] = useState('BrandFlow Corporate');
  const brandColors = ['#6366f1', '#06b6d4', '#0f172a', '#f8fafc'];
  const brandLogos = [
    { name: 'Primary Dark logo', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60' },
    { name: 'White Contrast logo', url: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=150&auto=format&fit=crop&q=60' }
  ];

  // --- Image Category (Step 3) ---
  const [selectedCategory, setSelectedCategory] = useState('SMO_POSTER');
  const categories = [
    { id: 'SMO_POSTER', name: 'Social Media Poster', desc: 'Optimized for high-engagement viral grids' },
    { id: 'FESTIVAL_POSTER', name: 'Festival & Event Poster', desc: 'Vibrant event-aligned templates' },
    { id: 'PROMO_OFFER', name: 'Promotional Offer Creative', desc: 'Bold discount banners with prominent CTAs' },
    { id: 'CAROUSEL_DESIGN', name: 'Carousel Card Slide', desc: 'Sequential multi-frame layouts' },
    { id: 'REEL_THUMBNAIL', name: 'Reel/Short Thumbnail', desc: 'Visual hooks with high-contrast text layers' },
    { id: 'WEBSITE_HERO', name: 'Website Hero banner', desc: 'Wide-angle, high-fidelity landscape assets' },
    { id: 'FLYER_A4', name: 'Flyer/Banner (A4)', desc: 'High-density structured layouts for printing' },
    { id: 'STANDEE_DESIGN', name: 'Standee Design', desc: 'Tall vertical aspect ratios (1:3)' }
  ];

  // --- Image Generation Settings (Step 4) ---
  const [selectedFormat, setSelectedFormat] = useState('square');
  const [styleMood, setStyleMood] = useState('modern'); // modern, minimal, cyberpunk, luxury, futuristic
  const [creativityLevel, setCreativityLevel] = useState(80);
  const [safeMode, setSafeMode] = useState(true);
  const [imageCount, setImageCount] = useState(4);
  const [ctaPosition, setCtaPosition] = useState('bottom');
  const [logoPosition, setLogoPosition] = useState('top-left');

  const formats = [
    { id: 'square', name: 'Instagram Square', ratio: '1:1', width: 1080, height: 1080, icon: <Smartphone className="h-4 w-4" /> },
    { id: 'portrait', name: 'LinkedIn Portrait', ratio: '4:5', width: 1080, height: 1350, icon: <Layers className="h-4 w-4" /> },
    { id: 'landscape', name: 'YouTube / Blog', ratio: '16:9', width: 1920, height: 1080, icon: <Monitor className="h-4 w-4" /> },
    { id: 'standee', name: 'Rollup Standee', ratio: '1:3', width: 800, height: 2400, icon: <Sliders className="h-4 w-4" /> }
  ];

  // --- Image Generation Pipeline Queue (Step 5) ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStage, setJobStage] = useState('');
  const [generatedCount, setGeneratedCount] = useState(0);

  // --- Generated Image & Variants State (Step 6) ---
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [favoriteVariants, setFavoriteVariants] = useState<boolean[]>([false, false, false, false]);

  const simulatedVariants: any[] = [];

  // --- CANVAS EDITOR STATE (Step 7) ---
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-text');
  const [layersHistory, setLayersHistory] = useState<CanvasLayer[][]>([
    []
  ]);

  // Hydrate actual image background once assets load
  useEffect(() => {
    if (activeAsset) {
      setLayersHistory(prev => {
        const history = [...prev];
        const lastLayers = history[history.length - 1];
        if (!lastLayers) return prev;
        const latestLayers = [...lastLayers];
        const bgLayerIndex = latestLayers.findIndex(l => l.id === 'layer-bg');
        if (bgLayerIndex >= 0) {
          const bgLayer = latestLayers[bgLayerIndex];
          if (bgLayer) {
            latestLayers[bgLayerIndex] = { ...bgLayer, src: activeAsset.cdnUrl, name: activeAsset.fileName };
          }
        }
        history[history.length - 1] = latestLayers;
        return history;
      });
    }
  }, [activeAsset]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const [snappingGuides, setSnappingGuides] = useState(true);

  const currentLayers = layersHistory[historyPointer] || [];

  // --- DRAG AND DROP STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, layer: CanvasLayer) => {
    if (layer.isLocked || layer.id === 'layer-bg') return;
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedLayerId) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !selectedLayerId) return;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    
    // Commit final position to history once
    updateCurrentLayers(prev => prev.map(l => {
      if (l.id === selectedLayerId && !l.isLocked) {
        return { ...l, x: Math.max(0, l.x + dx), y: Math.max(0, l.y + dy) };
      }
      return l;
    }));
    
    setDragOffset({ x: 0, y: 0 });
  };

  // Canvas Actions
  const updateCurrentLayers = (updater: (prev: CanvasLayer[]) => CanvasLayer[]) => {
    const nextLayers = updater(currentLayers);
    const newHistory = layersHistory.slice(0, historyPointer + 1);
    setLayersHistory([...newHistory, nextLayers]);
    setHistoryPointer(newHistory.length);
  };

  const handleLayerMove = (id: string, dx: number, dy: number) => {
    updateCurrentLayers(prev => prev.map(l => {
      if (l.id === id && !l.isLocked) {
        return { ...l, x: Math.max(0, l.x + dx), y: Math.max(0, l.y + dy) };
      }
      return l;
    }));
  };

  const handleLayerContentChange = (id: string, newContent: string) => {
    updateCurrentLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, content: newContent };
      return l;
    }));
  };

  const handleLayerColorChange = (id: string, newColor: string) => {
    updateCurrentLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, fill: newColor };
      return l;
    }));
  };

  const handleAddText = () => {
    updateCurrentLayers(prev => [
      ...prev,
      {
        id: `layer-${Date.now()}`,
        type: 'text',
        name: 'New Custom Text',
        x: 80,
        y: 180,
        width: 240,
        height: 40,
        content: 'DOUBLE CLICK TO EDIT',
        fontFamily: 'Inter',
        fontSize: 16,
        fill: '#ffffff'
      }
    ]);
  };

  const handleDeleteLayer = (id: string) => {
    if (id === 'layer-bg') return; // Cannot delete background
    updateCurrentLayers(prev => prev.filter(l => l.id !== id));
    setSelectedLayerId(null);
  };

  const handleLockToggle = (id: string) => {
    updateCurrentLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, isLocked: !l.isLocked };
      return l;
    }));
  };

  const handleUndo = () => {
    if (historyPointer > 0) setHistoryPointer(historyPointer - 1);
  };

  const handleRedo = () => {
    if (historyPointer < layersHistory.length - 1) setHistoryPointer(historyPointer + 1);
  };

  // --- APPROVAL WORKFLOW STATE (Step 8) ---
  const [isApprovalEnabled, setIsApprovalEnabled] = useState(true);
  const [approvalStage, setApprovalStage] = useState<'CREATIVE' | 'BRAND' | 'CLIENT' | 'APPROVED'>('CREATIVE');
  const [activeCommentId, setActiveCommentId] = useState<string | null>('c1');

  const simulatedComments: CommentAnnotation[] = [];

  // --- TRIGGER MOCK QUEUE ENGINE GENERATION (Step 5 simulation) ---
  const triggerImageGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'PROMPT_BUILDER': return 'Prompt Augmentation';
      case 'IMAGE_PROMPT_ENGINE': return 'Structuring Prompt Engine';
      case 'AI_IMAGE_GENERATION': return 'Painting Image (Stability API)';
      case 'BRAND_COMPLIANCE_CHECK': return 'Running Identity Audit';
      case 'ASSET_OPTIMIZATION': return 'Running Optimization Pipeline';
      case 'COMPLETED': return 'Completed Successfully';
      default: return 'Starting Pipeline...';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-16">
      
      {/* ────────────────── TOP CONTROL BAR ────────────────── */}
      <div className="glass-premium rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md uppercase">
                Enterprise AI Studio
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Tenant
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">BrandFlow Creative Studio</h1>
            <p className="mt-1.5 text-muted-foreground text-xs font-medium max-w-xl">
              Construct high-fidelity layouts, inject dynamic brand tokens, run identity compliance vision gates, and manage collaboration review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest mb-1.5">Brand Identity</label>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-surface-1/50 border border-border/50 text-foreground/80 text-xs font-bold rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer outline-none transition-all"
              >
                <option value="BrandFlow Corporate">BrandFlow Corporate</option>
                <option value="SaaSify Global">SaaSify Global Pro</option>
                <option value="Fintech Labs">Fintech Labs USA</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest mb-1.5">Status Workflow</label>
              <div className="flex items-center gap-1 bg-surface-1/50 border border-border/50 rounded-xl px-3 py-2 text-foreground/80 text-xs font-bold">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="uppercase text-[10px] tracking-wider font-extrabold text-primary">DRAFT STAGE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* ────────────────── LEFT SIDEBAR: CREATION PANEL ────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* STEP 1: CONTENT SOURCE SELECTION */}
          <div className="glass-panel border-border/50 rounded-[2rem] p-6 shadow-lg">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="h-5 w-5 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-[10px]">1</span>
              Content Source Selection
            </h3>
            
            <div className="grid grid-cols-4 gap-1.5 bg-surface-1/50 border border-border/50 p-1 rounded-xl mb-4">
              {[
                { id: 'manual', label: 'Manual' },
                { id: 'approved', label: 'Approved' },
                { id: 'campaign', label: 'Campaign' },
                { id: 'library', label: 'Library' }
              ].map(src => (
                <button
                  key={src.id}
                  onClick={() => setContentSource(src.id as any)}
                  className={`text-[10px] font-black py-2 rounded-lg transition-all uppercase tracking-wider ${
                    contentSource === src.id 
                      ? 'bg-surface-3 text-primary shadow-md border border-slate-700/50' 
                      : 'text-muted-foreground/80 hover:text-foreground/80'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {contentSource === 'manual' && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">Manual Marketing Copy</label>
                  <textarea 
                    className="w-full rounded-xl border border-border/50 bg-surface-1/50 p-3 text-xs text-foreground/80 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    rows={3}
                    placeholder="Type customized promotional text blocks..."
                    value={marketingText}
                    onChange={(e) => {
                      setMarketingText(e.target.value);
                      handleLayerContentChange('layer-text', e.target.value.toUpperCase().slice(0, 48) + '...');
                    }}
                  />
                </div>
              )}

              {contentSource === 'approved' && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 space-y-2">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">✓ Fetching from Content Hub</span>
                  <p className="text-foreground/80 text-xs font-medium leading-relaxed italic">
                    [No Approved Content Found]
                  </p>
                  <button 
                    onClick={() => {
                      setMarketingText('');
                      handleLayerContentChange('layer-text', '');
                    }}
                    className="text-[10px] font-black text-primary hover:text-brand-300 flex items-center gap-1"
                  >
                    Select this approved block <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {contentSource === 'campaign' && (
                <div className="space-y-2 bg-surface-1/50 border border-border/50 p-3 rounded-xl">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Linked Campaign Brief</span>
                  <div className="border-l-2 border-primary pl-3">
                    <h5 className="text-xs font-bold text-foreground">No Linked Campaign</h5>
                    <p className="text-[11px] text-muted-foreground mt-1">Select a campaign to import briefs.</p>
                  </div>
                </div>
              )}

              {contentSource === 'library' && (
                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                  {['Custom Tagline 1', 'Custom Tagline 2'].map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMarketingText(t.toUpperCase());
                        handleLayerContentChange('layer-text', t.toUpperCase());
                      }}
                      className="border border-border/50 hover:border-slate-700 bg-surface-1/50 text-muted-foreground hover:text-white rounded-lg p-2 text-left text-[10px] font-bold"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: BRAND CONTEXT CONNECTION SWATCHES */}
          <div className="glass-panel border-border/50 rounded-[2rem] p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="h-5 w-5 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-[10px]">2</span>
                Brand Visual Swatches
              </h3>
              <span className="text-[9px] text-muted-foreground uppercase font-black">Connected</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block mb-2">Palette swatches</span>
                <div className="flex items-center gap-1.5">
                  {brandColors.map((color, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (selectedLayerId) handleLayerColorChange(selectedLayerId, color);
                      }}
                      className="h-6 w-6 rounded-md border border-slate-700 transition-transform hover:scale-110 relative group"
                      style={{ backgroundColor: color }}
                      title={`Inject ${color}`}
                    >
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-surface-1/50 text-[8px] text-foreground px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none mb-1">
                        {color}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block mb-2">Brand Logos</span>
                <div className="flex items-center gap-2">
                  {brandLogos.map((logo, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        updateCurrentLayers(prev => prev.map(l => {
                          if (l.type === 'logo') return { ...l, src: logo.url };
                          return l;
                        }));
                      }}
                      className="h-7 w-12 border border-border/50 rounded-md bg-surface-1/50 p-1 flex items-center justify-center hover:border-primary transition-all overflow-hidden"
                    >
                      <img src={logo.url} alt={logo.name} className="h-full object-contain filter brightness-150" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-[10px] text-emerald-400/80 font-bold leading-normal">
                Visual alignment engine initialized. Design tokens, fonts and safety parameters connected to <span className="text-foreground font-extrabold">{selectedBrand}</span>.
              </div>
            </div>
          </div>

          {/* STEP 3 & 4: IMAGE CATEGORY & GENERATION SETTINGS */}
          <div className="glass-panel border-border/50 rounded-[2rem] p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <span className="h-5 w-5 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-[10px]">3</span>
              Image Settings & Category
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">Image Category Structure</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-surface-1/50 border border-border/50 text-foreground/80 text-xs font-bold rounded-xl px-3 py-2.5 focus:border-primary outline-none cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="text-[9px] text-muted-foreground font-bold block pl-1">
                  {categories.find(c => c.id === selectedCategory)?.desc}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">Aspect Ratio / Layout Sizes</label>
                <div className="grid grid-cols-2 gap-2">
                  {formats.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`flex items-center justify-between border rounded-xl p-2.5 transition-all text-left ${
                        selectedFormat === f.id 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20 text-foreground' 
                          : 'border-border/50 bg-surface-1/50 hover:border-slate-700 text-muted-foreground hover:text-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {f.icon}
                        <div>
                          <p className="text-[10px] font-black tracking-wide leading-none">{f.name}</p>
                          <p className="text-[8px] text-muted-foreground/80 mt-1 font-bold">{f.width} × {f.height} px</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black font-mono bg-surface-2/50 border border-border/50 px-1.5 py-0.5 rounded text-primary">
                        {f.ratio}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">Visual Mood & Style</label>
                  <span className="text-[9px] text-primary font-extrabold uppercase">{styleMood}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'modern', label: 'Modern' },
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'cyberpunk', label: 'Cyber' },
                    { id: 'luxury', label: 'Luxury' },
                    { id: 'futuristic', label: 'Future' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setStyleMood(m.id)}
                      className={`text-[9px] font-black py-2 rounded-lg border text-center transition-all ${
                        styleMood === m.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border/50 glass-premium text-muted-foreground/80 hover:text-slate-350'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground/80">AI Creativity Strength</span>
                  <span className="text-primary font-mono">{creativityLevel}%</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="100" 
                  value={creativityLevel}
                  onChange={(e) => setCreativityLevel(Number(e.target.value))}
                  className="w-full accent-brand-500 h-1.5 bg-surface-1/50 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-surface-1/50 border border-border/50 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Safe Gen Mode</span>
                  <button 
                    onClick={() => setSafeMode(!safeMode)}
                    className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors ${safeMode ? 'bg-primary' : 'bg-surface-3'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-background transition-transform ${safeMode ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-l border-border/50 pl-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Image Count</span>
                  <select 
                    value={imageCount} 
                    onChange={(e) => setImageCount(Number(e.target.value))}
                    className="bg-transparent text-foreground/80 font-extrabold text-[10px] outline-none cursor-pointer border-none p-0"
                  >
                    <option value="1" className="bg-surface-2/50">1</option>
                    <option value="2" className="bg-surface-2/50">2</option>
                    <option value="4" className="bg-surface-2/50">4</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={triggerImageGeneration}
                disabled={!marketingText || isGenerating}
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 py-3 text-xs font-bold text-foreground shadow-lg shadow-brand-500/10 disabled:opacity-40 transition-all flex items-center justify-center gap-2 group"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Creative Queue...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-yellow-400 animate-pulse group-hover:scale-110 transition-transform" />
                    <span>Generate Brand-Aware Asset</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </div>

        {/* ────────────────── CENTER WORKSPACE: LAYERS CANVAS & TIMELINE ────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* MOCK QUEUE ENGINE PIPELINE PROGRESS STATE */}
          {isGenerating && (
            <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 shadow-md animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black text-slate-200 uppercase tracking-widest">
                    Image Generation Pipeline
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {jobStage}
                </span>
              </div>
              
              <div className="h-2 w-full bg-surface-1/50 rounded-full overflow-hidden border border-border/50 mb-3">
                <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${jobProgress}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-extrabold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-ping" />
                  {getStageLabel(jobStage)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">{jobProgress}%</span>
              </div>
            </div>
          )}

          {/* MAIN SIMULATED CANVAS EDITOR (Canva style) */}
          <div className="rounded-2xl border border-border/50 bg-surface-1/50 flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Editor Top Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-border/50 px-5 py-3.5 bg-surface-2/50/60 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <Layout className="h-3.5 w-3.5 text-muted-foreground" /> Creative Canvas Studio
                </span>
                <div className="flex items-center gap-1 bg-surface-1/50 border border-border/50 px-2.5 py-1 rounded-lg text-[9px] font-bold text-muted-foreground">
                  <span>SCALE:</span>
                  <span className="text-foreground">100% (Render downscale)</span>
                </div>
              </div>

              {/* Canvas Toolbar Elements */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleUndo} 
                  disabled={historyPointer === 0}
                  className="p-2 text-muted-foreground hover:text-white disabled:opacity-30 hover:bg-surface-2 rounded-lg transition-all"
                  title="Undo"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={historyPointer === layersHistory.length - 1}
                  className="p-2 text-muted-foreground hover:text-white disabled:opacity-30 hover:bg-surface-2 rounded-lg transition-all"
                  title="Redo"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
                <div className="h-4 w-px bg-surface-3 mx-1" />
                
                <button 
                  onClick={handleAddText} 
                  className="flex items-center gap-1 text-[10px] font-black text-muted-foreground hover:text-white bg-surface-1/50 border border-border/50 px-2.5 py-1.5 rounded-lg hover:border-slate-700 transition-all uppercase tracking-wider"
                >
                  <Type className="h-3 w-3 text-primary" /> Add Text
                </button>

                <button 
                  onClick={() => {
                    updateCurrentLayers(prev => [
                      ...prev,
                      {
                        id: `layer-${Date.now()}`,
                        type: 'shape',
                        name: 'Accent Rectangle',
                        x: 100,
                        y: 100,
                        width: 150,
                        height: 50,
                        fill: brandColors[0]
                      }
                    ]);
                  }}
                  className="flex items-center gap-1 text-[10px] font-black text-muted-foreground hover:text-white bg-surface-1/50 border border-border/50 px-2.5 py-1.5 rounded-lg hover:border-slate-700 transition-all uppercase tracking-wider"
                >
                  <Sliders className="h-3 w-3 text-indigo-400" /> Add Accent Shape
                </button>

                <div className="h-4 w-px bg-surface-3 mx-1" />

                <button 
                  onClick={() => setSnappingGuides(!snappingGuides)}
                  className={`p-1.5 rounded-lg border transition-all text-[9px] font-bold ${
                    snappingGuides 
                      ? 'border-primary/20 bg-primary/10 text-primary' 
                      : 'border-border/50 bg-surface-1/50 text-muted-foreground/80'
                  }`}
                  title="Toggle Snap Guides"
                >
                  Guides
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-[460px]">
              
              {/* LAYERS MANAGER SIDEBAR */}
              <div className="w-full md:w-56 border-r border-border/50 p-4 bg-surface-2/50/20 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5" /> Layer List</span>
                  <span>{currentLayers.length} total</span>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {currentLayers.map((layer) => (
                    <div 
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedLayerId === layer.id
                          ? 'border-primary bg-primary/100/5 text-foreground'
                          : 'border-border/50 hover:border-border/50 bg-surface-1/50/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: layer.type === 'text' ? '#6366f1' : layer.type === 'image' ? '#06b6d4' : '#e2e8f0' }} />
                        <span className="truncate max-w-[100px]">{layer.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLockToggle(layer.id);
                          }}
                          className={`p-1 rounded text-[10px] ${layer.isLocked ? 'text-primary' : 'text-slate-600 hover:text-muted-foreground'}`}
                        >
                          {layer.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        </button>
                        {layer.id !== 'layer-bg' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLayer(layer.id);
                            }}
                            className="p-1 rounded text-slate-650 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* LAYER PROPERTIES INSPECTOR */}
                {selectedLayerId && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block">Layer Inspector</span>
                    
                    {currentLayers.find(l => l.id === selectedLayerId)?.type === 'text' && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-wider block">Content Editor</label>
                        <input 
                          type="text"
                          className="w-full bg-surface-1/50 border border-border/50 rounded-lg p-2 text-xs text-foreground outline-none"
                          value={currentLayers.find(l => l.id === selectedLayerId)?.content ?? ''}
                          onChange={(e) => handleLayerContentChange(selectedLayerId, e.target.value)}
                        />
                      </div>
                    )}

                    {currentLayers.find(l => l.id === selectedLayerId)?.type === 'shape' && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-wider block">Accent Color Swatches</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {brandColors.map(c => (
                            <button
                              key={c}
                              onClick={() => handleLayerColorChange(selectedLayerId, c)}
                              className="h-5 w-full rounded border border-slate-700 hover:scale-105"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-bold text-muted-foreground/80 block uppercase mb-1">Position (X, Y)</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleLayerMove(selectedLayerId, -10, 0)} 
                            className="bg-surface-1/50 border border-border/50 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-white"
                          >
                            ←
                          </button>
                          <button 
                            onClick={() => handleLayerMove(selectedLayerId, 10, 0)} 
                            className="bg-surface-1/50 border border-border/50 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-white"
                          >
                            →
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-muted-foreground/80 block uppercase mb-1">Shift (Up, Down)</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleLayerMove(selectedLayerId, 0, -10)} 
                            className="bg-surface-1/50 border border-border/50 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-white"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => handleLayerMove(selectedLayerId, 0, 10)} 
                            className="bg-surface-1/50 border border-border/50 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-white"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CANVAS WORKSPACE VIEW */}
              <div className="flex-1 bg-surface-1/50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
                
                {/* ACTIVE DESIGN CANVAS BODY */}
                <div 
                  className={`relative bg-surface-2/50 border border-border/50 shadow-2xl rounded-xl overflow-hidden select-none transition-all duration-300 ${
                    selectedFormat === 'square' ? 'aspect-square w-[340px]' : 
                    selectedFormat === 'portrait' ? 'aspect-[4/5] h-[400px]' : 
                    selectedFormat === 'landscape' ? 'aspect-[16/9] w-[420px]' : 
                    'aspect-[1/3] h-[420px]'
                  }`}
                >
                  
                  {/* CANVAS RENDER LAYERS */}
                  {currentLayers.map((layer) => {
                    if (layer.type === 'image') {
                      return (
                        <div 
                          key={layer.id}
                          className={`absolute inset-0 z-0 transition-opacity ${
                            selectedLayerId === layer.id ? 'ring-2 ring-primary/20/50' : ''
                          }`}
                        >
                          <img src={layer.src} alt={layer.name} className="h-full w-full object-cover filter brightness-[0.75]" />
                        </div>
                      );
                    }

                    if (layer.type === 'logo') {
                      const isCurrDrag = selectedLayerId === layer.id && isDragging;
                      const x = isCurrDrag ? Math.max(0, layer.x + dragOffset.x) : layer.x;
                      const y = isCurrDrag ? Math.max(0, layer.y + dragOffset.y) : layer.y;
                      return (
                        <div
                          key={layer.id}
                          onPointerDown={(e) => handlePointerDown(e, layer)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                          style={{ left: `${x}px`, top: `${y}px` }}
                          className={`absolute z-20 cursor-move transition-shadow ${
                            selectedLayerId === layer.id ? 'ring-2 ring-primary/20 p-0.5 bg-surface-1/50/20' : ''
                          }`}
                        >
                          <img src={layer.src} alt={layer.name} className="h-8 object-contain filter brightness-125 pointer-events-none" />
                        </div>
                      );
                    }

                    if (layer.type === 'text') {
                      const isCurrDrag = selectedLayerId === layer.id && isDragging;
                      const x = isCurrDrag ? Math.max(0, layer.x + dragOffset.x) : layer.x;
                      const y = isCurrDrag ? Math.max(0, layer.y + dragOffset.y) : layer.y;
                      return (
                        <div
                          key={layer.id}
                          onPointerDown={(e) => handlePointerDown(e, layer)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                          style={{ left: `${x}px`, top: `${y}px`, width: `${layer.width}px` }}
                          className={`absolute z-30 cursor-move p-1 transition-shadow ${
                            selectedLayerId === layer.id ? 'ring-2 ring-primary/20 bg-surface-1/50/30 backdrop-blur-[1px]' : ''
                          }`}
                        >
                          <h4 
                            className="font-extrabold leading-tight text-foreground select-none whitespace-normal tracking-wide"
                            style={{ fontFamily: layer.fontFamily, fontSize: `${layer.fontSize}px`, color: layer.fill }}
                          >
                            {layer.content}
                          </h4>
                        </div>
                      );
                    }

                    if (layer.type === 'shape') {
                      const isCurrDrag = selectedLayerId === layer.id && isDragging;
                      const x = isCurrDrag ? Math.max(0, layer.x + dragOffset.x) : layer.x;
                      const y = isCurrDrag ? Math.max(0, layer.y + dragOffset.y) : layer.y;
                      return (
                        <div
                          key={layer.id}
                          onPointerDown={(e) => handlePointerDown(e, layer)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                          style={{ left: `${x}px`, top: `${y}px`, width: `${layer.width}px`, height: `${layer.height}px`, backgroundColor: layer.fill }}
                          className={`absolute z-10 cursor-move rounded-md transition-shadow ${
                            selectedLayerId === layer.id ? 'ring-2 ring-primary/20' : ''
                          } flex items-center justify-center`}
                        >
                          <span className="text-[8px] font-black text-white/50 tracking-wider select-none">CTA BANNER BLOCK</span>
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* ACTIVE COMMENT REGION BOUNDING BOX */}
                  {isApprovalEnabled && activeCommentId && (
                    (() => {
                      const comm = simulatedComments.find(c => c.id === activeCommentId);
                      if (comm) {
                        return (
                          <div 
                            style={{ left: `${comm.x}px`, top: `${comm.y}px`, width: `${comm.width}px`, height: `${comm.height}px` }}
                            className="absolute border-2 border-red-500 bg-red-500/10 z-40 animate-pulse pointer-events-none rounded"
                          >
                            <span className="absolute -top-5 left-0 bg-red-500 text-[8px] font-extrabold text-foreground px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Review Annotation Box
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}

                  {/* SMART SNAPPING GUIDE LINES */}
                  {snappingGuides && selectedLayerId && selectedLayerId !== 'layer-bg' && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                      <div className="absolute left-1/2 top-0 bottom-0 border-r border-dashed border-cyan-500/50" />
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-cyan-500/50" />
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ────────────────── COMPARATIVE VARIANTS PANEL (Step 6) ────────────────── */}
            <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Compare Generated Variants
                </h3>
                <span className="text-[9px] text-primary font-extrabold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {4 + generatedCount} variants
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {simulatedVariants.map((variant, i) => (
                  <button 
                    key={variant.id} 
                    onClick={() => {
                      setActiveVariantIndex(i);
                      // Update canvas background
                      updateCurrentLayers(prev => prev.map(l => {
                        if (l.id === 'layer-bg') return { ...l, src: variant.url };
                        return l;
                      }));
                    }}
                    className={`group relative aspect-square rounded-xl border-2 overflow-hidden transition-all text-left ${
                      activeVariantIndex === i 
                        ? 'border-primary ring-2 ring-primary/20/25 scale-[1.02]' 
                        : 'border-border/50 hover:border-slate-750 hover:scale-[1.01]'
                    }`}
                  >
                    <img src={variant.url} alt={variant.version} className="absolute inset-0 h-full w-full object-cover filter brightness-[0.75] group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-foreground">{variant.version}</span>
                        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-black">{variant.cost}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-surface-1/50 border border-border/50 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground leading-none">
                  <span>Variant Metadata Log</span>
                  <span className="text-primary">Telemetry logs active</span>
                </div>
                <p className="text-[10.5px] text-muted-foreground leading-relaxed font-bold">
                  {simulatedVariants[activeVariantIndex]?.desc}
                </p>
                <div className="text-[9px] text-muted-foreground/80 font-mono select-all truncate mt-1 bg-surface-2/50 p-1.5 rounded border border-border/50">
                  PROMPT: {simulatedVariants[activeVariantIndex]?.prompt}
                </div>
              </div>
            </div>

            {/* ────────────────── APPROVAL & ANNOTATIONS PANEL (Step 8) ────────────────── */}
            <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" /> Review & Approvals Hub
                </h3>
                <button 
                  onClick={() => setIsApprovalEnabled(!isApprovalEnabled)}
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all ${
                    isApprovalEnabled 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                      : 'bg-surface-3 border border-slate-700 text-muted-foreground/80'
                  }`}
                >
                  {isApprovalEnabled ? 'Enabled' : 'Bypassed'}
                </button>
              </div>

              {isApprovalEnabled ? (
                <div className="space-y-4">
                  {/* Stages timeline */}
                  <div className="flex items-center justify-between bg-surface-1/50 p-2.5 rounded-xl border border-border/50 overflow-x-auto">
                    {[
                      { id: 'CREATIVE', label: 'Creative' },
                      { id: 'BRAND', label: 'Brand' },
                      { id: 'CLIENT', label: 'Client' },
                      { id: 'APPROVED', label: 'Approved' }
                    ].map((st, idx) => (
                      <button
                        key={st.id}
                        onClick={() => setApprovalStage(st.id as any)}
                        className={`flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition-all uppercase ${
                          approvalStage === st.id
                            ? 'border-primary bg-primary/10 text-primary font-extrabold'
                            : 'border-transparent text-muted-foreground/80 hover:text-slate-350'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Comment List */}
                  <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                    {simulatedComments.map((comm) => (
                      <div 
                        key={comm.id}
                        onClick={() => setActiveCommentId(activeCommentId === comm.id ? null : comm.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          activeCommentId === comm.id 
                            ? 'border-red-500 bg-red-500/5' 
                            : 'border-border/50 bg-surface-1/50/40 hover:border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img src={comm.avatar} alt={comm.user} className="h-5 w-5 rounded-full object-cover" />
                          <div>
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="text-[10px] font-black text-foreground">{comm.user}</span>
                              <span className="bg-surface-2/50 border border-border/50 text-[8px] font-bold text-muted-foreground px-1 py-0.25 rounded uppercase">
                                {comm.role}
                              </span>
                            </div>
                            <span className="text-[8px] text-muted-foreground/80 mt-1 font-bold block">{comm.time}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-350 font-bold leading-relaxed">
                          {comm.body}
                        </p>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-900/50">
                          <span className="text-[8px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="h-2.5 w-2.5 text-red-500" /> Bounding Box Annotation
                          </span>
                          <span className="text-[8px] text-muted-foreground/80 font-extrabold uppercase bg-surface-2/50 px-1.5 py-0.5 rounded border border-border/50">
                            {comm.stage} stage
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-surface-1/50 border border-border/50 p-6 rounded-xl text-center text-muted-foreground/80">
                  <Shield className="h-8 w-8 mx-auto text-slate-650 mb-2" />
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Approval workflow bypassed</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 leading-normal max-w-xs mx-auto">
                    Approved contents will generate images directly saving as completed deliverables into asset library workspace.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ────────────────── EXPORT, CDN & PUBLISHING SUITE ────────────────── */}
          <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border/50 pb-4">
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary animate-bounce" /> Export Deliverable Pipeline
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">
                  Compile flat canvas layers, apply high resolution, upscale if requested, and register to CDNs.
                </p>
              </div>
              <div className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider bg-surface-1/50 border border-border/50 px-3 py-1.5 rounded-lg mt-2 md:mt-0">
                Storage: <span className="text-foreground font-extrabold">2.4 GB / 10 GB limit</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => alert('Compiling layers into 1080x1080 high-fidelity WebP format... Uploading to Cloudflare R2... CDN caching activated!')}
                className="flex items-center justify-center gap-2 bg-surface-1/50 hover:bg-surface-2/50 border border-border/50 hover:border-slate-700 text-slate-200 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
              >
                <Download className="h-3.5 w-3.5 text-primary" /> Export High-Res WebP
              </button>

              <button 
                onClick={() => alert('Launching AI Super-Resolution pipeline... Upscaling vector layer shapes and generating 4x print-ready PNG...') }
                className="flex items-center justify-center gap-2 bg-surface-1/50 hover:bg-surface-2/50 border border-border/50 hover:border-slate-700 text-slate-200 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
              >
                <Scale className="h-3.5 w-3.5 text-indigo-400" /> Upscale 4x PNG (Print)
              </button>

              <button 
                onClick={() => alert('CDN Shareable short-lived link generated: https://cdn.brandflow.ai/tenants/123/exports/creative_studio_webp_preview.webp') }
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-foreground py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10"
              >
                <Share2 className="h-3.5 w-3.5 text-foreground" /> Get CDN Shareable Link
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[10px] text-muted-foreground/80 font-bold bg-surface-1/50 border border-border/50 p-3 rounded-xl leading-relaxed">
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-400" /> Isolation checks passed. Signed URL filters active.</span>
              <a href="#" className="text-primary hover:text-brand-300 font-extrabold flex items-center gap-0.5">
                Audit Trail Logs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

