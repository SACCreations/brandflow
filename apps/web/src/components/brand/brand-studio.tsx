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
    id: 'foundation',
    label: 'Foundation',
    sections: [
      { id: 'basics', label: 'Brand Basics', icon: Building2 },
      { id: 'visuals', label: 'Visual Identity', icon: Palette },
      { id: 'typography', label: 'Typography', icon: Layout },
      { id: 'colors', label: 'Color System', icon: Palette },
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    sections: [
      { id: 'voice', label: 'Brand Voice', icon: MessageSquare },
      { id: 'audience', label: 'Audience', icon: Users },
      { id: 'competitors', label: 'Competitors', icon: Users },
      { id: 'knowledge', label: 'Knowledge Base', icon: Globe },
    ]
  },
  {
    id: 'governance',
    label: 'Governance',
    sections: [
      { id: 'rules', label: 'Brand Rules', icon: ShieldCheck },
      { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    ]
  },
  {
    id: 'assets',
    label: 'Assets & DAM',
    sections: [
      { id: 'logos', label: 'Logo Library', icon: Globe },
      { id: 'documents', label: 'Documents', icon:Globe },
      { id: 'media', label: 'Media Library', icon: Globe },
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    sections: [
      { id: 'social', label: 'Social Accounts', icon: Globe },
      { id: 'automation', label: 'Automation', icon: Settings },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    sections: [
      { id: 'health', label: 'Brand Health', icon: ShieldCheck },
      { id: 'performance', label: 'Performance', icon: ShieldCheck },
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
      <CommandPalette open={open} setOpen={setOpen} />
      {/* 1. Left Navigation Sidebar (Fixed) */}
      <aside className="w-64 border-r border-gray-100 dark:border-gray-800 hidden lg:flex flex-col fixed h-screen bg-white dark:bg-gray-950 z-20 print:hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Link href="/intelligence/brands">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all border border-gray-100 dark:border-gray-800 active:scale-95 shadow-sm">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          </Link>
          <div className="flex flex-col overflow-hidden">
            <h1 className="font-black text-sm uppercase tracking-tighter truncate text-gray-900 dark:text-white leading-tight">{title}</h1>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Live Studio
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          {GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 mb-2">{group.label}</p>
              <div className="space-y-1">
                {group.sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all group",
                        activeSection === section.id 
                          ? "bg-brand-50 text-brand-700 shadow-sm shadow-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:shadow-none" 
                          : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        activeSection === section.id ? "bg-white dark:bg-gray-800 shadow-sm scale-110" : "bg-gray-100 dark:bg-gray-800 group-hover:scale-105"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        <div className="p-6 mt-4">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Strength</span>
              <Badge className="bg-brand-500 text-white text-[9px] h-4 px-1.5 font-black uppercase border-none">
                {Math.round((SECTIONS.indexOf(SECTIONS.find(s => s.id === activeSection)!) + 1) / SECTIONS.length * 100)}%
              </Badge>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-500" 
                style={{ width: `${(SECTIONS.indexOf(SECTIONS.find(s => s.id === activeSection)!) + 1) / SECTIONS.length * 100}%` }} 
              />
            </div>
            <p className="text-[9px] text-gray-500 font-medium leading-tight">Complete all sections to unlock full AI potential.</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="px-3 space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Persistence</p>
            <p className="text-[10px] text-gray-500 font-medium">
              {lastSaved 
                ? `Saved ${lastSaved.toLocaleTimeString()}` 
                : initialData?.updatedAt 
                  ? `Published ${new Date(initialData.updatedAt).toLocaleDateString()}` 
                  : 'Unsaved Draft'}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Command Palette <span className="ml-auto text-[8px] font-black opacity-50">⌘K</span>
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
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-800">
              <button 
                type="button"
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  "bg-white dark:bg-gray-800 text-brand-600 shadow-sm border border-gray-100 dark:border-gray-700"
                )}
              >
                <Layout className="w-3.5 h-3.5" />
                Identity Studio
              </button>
              <button 
                type="button"
                onClick={() => toast({ title: 'Content Lab', description: 'Redirecting to generation engine...' })}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Content Lab
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-100 dark:bg-gray-800" />
            
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] font-black px-2 h-5">DRAFT</Badge>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">V2.4.0 • Updated 2h ago</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => toast({ title: 'Collaboration', description: 'Invite your team members to this brand.' })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              Collaborators
            </button>
            <button 
              type="button"
              onClick={() => toast({ title: 'Review Requested', description: 'Your brand identity has been sent for approval.' })}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Request Review
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
              <TabsTrigger value="preview" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Preview</TabsTrigger>
              <TabsTrigger value="copilot" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Co-pilot</TabsTrigger>
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
