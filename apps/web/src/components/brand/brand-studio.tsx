'use client';

import * as React from 'react';
import { 
  Building2, 
  Palette, 
  MessageSquare, 
  ShieldCheck, 
  Globe, 
  Users, 
  Layout, 
  Settings,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, Badge, useToast } from '@brandflow/ui';
import Link from 'next/link';
import { BrandForm } from './brand-form';
import { LivePreview } from './live-preview';
import { CommandPalette } from './command-palette';
import { useDraft } from '@/hooks/use-draft';
import { AICopilot } from './ai-copilot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@brandflow/ui';

interface BrandStudioProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
  title: string;
  onSuccess?: () => void;
}

const GROUPS = [
  {
    id: 'basics',
    label: '01. Brand Foundation',
    sections: [
      { id: 'basics', label: 'Company Basics', icon: Building2 },
    ]
  },
  {
    id: 'visuals',
    label: '02. Visual Identity',
    sections: [
      { id: 'visuals', label: 'Logo & Identity', icon: Globe },
      { id: 'logos', label: 'Logo Library', icon: Globe },
      { id: 'documents', label: 'Documents', icon: Globe },
      { id: 'typography', label: 'Typography', icon: Layout },
      { id: 'colors', label: 'Color System', icon: Palette },
    ]
  },
  {
    id: 'voice',
    label: '03. Intelligence & Voice',
    sections: [
      { id: 'voice', label: 'Tone & Voice', icon: MessageSquare },
      { id: 'knowledge', label: 'Knowledge Base', icon: Globe },
    ]
  },
  {
    id: 'strategy',
    label: '04. Market Strategy',
    sections: [
      { id: 'audience', label: 'Audience Deep-Dive', icon: Users },
      { id: 'competitors', label: 'Competitors', icon: Users },
      { id: 'content-strategy', label: 'Content Strategy', icon: MessageSquare },
    ]
  },
  {
    id: 'design-prefs',
    label: '05. Brand Expression',
    sections: [
      { id: 'design-prefs', label: 'Design Preferences', icon: Palette },
    ]
  },
  {
    id: 'rules',
    label: '06. Governance',
    sections: [
      { id: 'rules', label: 'Approval Workflow', icon: ShieldCheck },
      { id: 'compliance', label: 'Compliance Rules', icon: ShieldCheck },
    ]
  },
  {
    id: 'social',
    label: '07. Social Presence',
    sections: [
      { id: 'social', label: 'Social Media', icon: Globe },
      { id: 'media', label: 'Media Library', icon: Globe },
      { id: 'campaigns', label: 'Campaign Defaults', icon: Settings },
      { id: 'automation', label: 'Automation', icon: Settings },
    ]
  },
  {
    id: 'analytics',
    label: '08. Health & Growth',
    sections: [
      { id: 'health', label: 'Brand Health', icon: ShieldCheck },
      { id: 'performance', label: 'Performance ROI', icon: ShieldCheck },
      { id: 'analytics', label: 'Reporting Config', icon: Settings },
    ]
  }
];

const SECTIONS = GROUPS.flatMap(g => g.sections);

export function BrandStudio({ initialData, onSubmit, isLoading, title, onSuccess }: BrandStudioProps) {
  const { draft, saveDraft, clearDraft, lastSaved } = useDraft(initialData?.id || 'new', initialData);
  const [activeSection, setActiveSection] = React.useState('basics');
  const [previewData, setPreviewData] = React.useState(draft || initialData || {});
  const [rightPanelMode, setRightPanelMode] = React.useState('preview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { 
        root: mainContainer,
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '-10% 0px -70% 0px' 
      }
    );

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const [showMobilePreview, setShowMobilePreview] = React.useState(false);

  const handleDataChange = React.useCallback((data: any) => {
    setPreviewData(data);
    saveDraft(data);
  }, [saveDraft]);

  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  // Command palette listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 print:relative print:overflow-visible">
      {/* 1. Left Navigation Sidebar (Fixed) */}
      <aside className="w-64 border-r border-gray-100 dark:border-gray-800 hidden lg:flex flex-col fixed h-screen bg-white dark:bg-gray-900/50 dark:bg-gray-950/50 backdrop-blur-xl z-20 print:hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-950">
          <Link href="/intelligence/brands">
            <button className="p-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-all border border-gray-100 dark:border-gray-800 active:scale-95 shadow-sm group">
              <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
            </button>
          </Link>
          <div className="flex flex-col overflow-hidden">
            <h1 className="font-black text-sm uppercase tracking-tighter truncate text-gray-900 dark:text-white leading-tight">{title}</h1>
            <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Identity Studio
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          {GROUPS.map((group, groupIdx) => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between px-3 mb-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{group.label}</p>
              </div>
              <div className="space-y-1">
                {group.sections.map((section, sectionIdx) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  // Calculate absolute step number across all groups
                  const absoluteStep = GROUPS.slice(0, groupIdx).reduce((acc, g) => acc + g.sections.length, 0) + sectionIdx + 1;
                  
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all group",
                        isActive 
                          ? "bg-gray-900 text-white shadow-xl shadow-gray-900/20 dark:bg-white dark:bg-gray-900 dark:text-gray-900 dark:text-white" 
                          : "text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:text-white dark:hover:text-gray-100"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] transition-all duration-300",
                        isActive ? "bg-white dark:bg-gray-900/10 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      )}>
                        {absoluteStep}
                      </div>
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="truncate">{section.label}</span>
                      </div>
                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="ml-auto w-1 h-4 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        <div className="p-6">
          <div className="p-5 rounded-3xl bg-gray-900 dark:bg-white dark:bg-gray-900 shadow-2xl space-y-4 overflow-hidden relative group">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-300 transition-colors">Identity Score</span>
                <span className="text-xl font-black text-white dark:text-gray-900 dark:text-white tracking-tighter">
                  {Math.round((SECTIONS.indexOf(SECTIONS.find(s => s.id === activeSection)!) + 1) / SECTIONS.length * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-800 dark:bg-gray-200 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(SECTIONS.indexOf(SECTIONS.find(s => s.id === activeSection)!) + 1) / SECTIONS.length * 100}%` }}
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold leading-tight">Optimizing brand robustness for AI generation.</p>
            </div>
            {/* Decorative background for strength card */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full" />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <button 
            type="button"
            onClick={() => setOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-all border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Command Palette <span className="ml-auto opacity-30">⌘K</span>
          </button>
        </div>
      </aside>

      {/* Mobile Preview Toggle */}
      <button 
        onClick={() => setShowMobilePreview(!showMobilePreview)}
        className="xl:hidden fixed right-6 top-6 z-50 p-3 bg-brand-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all print:hidden"
      >
        <Layout className="w-5 h-5" />
      </button>

      {/* 2. Main Content Area (Scrollable) */}
      <main className="flex-1 lg:pl-64 xl:pr-96 h-screen overflow-y-auto scroll-smooth print:pl-0 print:pr-0 print:overflow-visible print:h-auto custom-scrollbar">
        {/* Top Workflow Bar */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900/50 dark:bg-gray-950/50 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-800/50 dark:border-gray-800/50 shadow-inner">
              <button 
                type="button"
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
                  "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-700"
                )}
              >
                <Layout className="w-3.5 h-3.5 text-brand-600" />
                Identity Studio
              </button>
              <button 
                type="button"
                onClick={() => toast({ title: 'Content Lab', description: 'Redirecting to generation engine...' })}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
                  "text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-gray-100"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Content Lab
              </button>
            </div>
            
            <div className="h-6 w-px bg-gray-100 dark:bg-gray-800" />
            
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[9px] font-black px-2.5 h-6 rounded-full flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                DRAFT MODE
              </Badge>
              <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest hidden sm:block">V2.4.0 • PRODUCTION GRADE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => toast({ title: 'Collaboration', description: 'Invite your team members to this brand.' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all active:scale-95 shadow-sm"
            >
              <Users className="w-4 h-4" />
              Collaborators
            </button>
            <button 
              type="button"
              onClick={() => toast({ title: 'Review Requested', description: 'Your brand identity has been sent for approval.' })}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-700 active:scale-95 transition-all"
            >
              Request Approval
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-8 pt-12 pb-32 print:p-0 print:pb-0">
          <BrandForm 
            key={initialData?.updatedAt || initialData?.id || 'new'}
            initialData={draft || initialData} 
            onSubmit={async (data) => {
              console.log('BrandForm submitting payload:', JSON.stringify(data, null, 2));
              await onSubmit(data);
            }} 
            isLoading={isLoading} 
            onDataChange={handleDataChange}
            lastSaved={lastSaved}
          />
        </div>
      </main>

      {/* Overlay for mobile preview */}
      {showMobilePreview && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 xl:hidden backdrop-blur-sm"
          onClick={() => setShowMobilePreview(false)}
        />
      )}

      {/* 3. Right Panel (Responsive) */}
      <aside className={cn(
        "w-96 fixed right-0 top-0 bottom-0 h-screen z-40 bg-white dark:bg-gray-950 shadow-2xl xl:shadow-none transition-transform duration-300 ease-in-out border-l border-gray-100 dark:border-gray-800 print:hidden",
        showMobilePreview ? "translate-x-0" : "translate-x-full xl:translate-x-0"
      )}>
        <Tabs defaultValue="preview" className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
              <TabsTrigger value="preview" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white dark:bg-gray-900 data-[state=active]:shadow-sm">Preview</TabsTrigger>
              <TabsTrigger value="copilot" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white dark:bg-gray-900 data-[state=active]:shadow-sm">Co-pilot</TabsTrigger>
            </TabsList>
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black">Sync On</Badge>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="preview" className="h-full mt-0 focus-visible:ring-0">
              <LivePreview data={previewData} />
            </TabsContent>
            <TabsContent value="copilot" className="h-full mt-0 focus-visible:ring-0">
              <AICopilot brandData={previewData} />
            </TabsContent>
          </div>
        </Tabs>
      </aside>

      <CommandPalette 
        open={open}
        setOpen={setOpen}
        onJump={scrollToSection} 
        onSave={async () => {
          const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitBtn) {
            submitBtn.click();
          }
        }} 
      />
    </div>
  );
}
