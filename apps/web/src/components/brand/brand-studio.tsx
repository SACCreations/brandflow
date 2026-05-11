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
  ChevronLeft
} from 'lucide-react';
import { cn } from '@brandflow/ui';
import Link from 'next/link';
import { BrandForm } from './brand-form';
import { LivePreview } from './live-preview';
import { CommandPalette } from './command-palette';
import { useDraft } from '@/hooks/use-draft';

interface BrandStudioProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
  title: string;
  onSuccess?: () => void;
}

const SECTIONS = [
  { id: 'basics', label: 'Brand Basics', icon: Building2 },
  { id: 'visuals', label: 'Visual Identity', icon: Palette },
  { id: 'identity', label: 'Tone & Personality', icon: MessageSquare },
  { id: 'assets', label: 'Assets & Documents', icon: Globe },
  { id: 'governance', label: 'Governance', icon: ShieldCheck },
  { id: 'competitors', label: 'Competitors', icon: Users },
];

export function BrandStudio({ initialData, onSubmit, isLoading, title, onSuccess }: BrandStudioProps) {
  const { draft, saveDraft, clearDraft, lastSaved } = useDraft(initialData?.id || 'new', initialData);
  const [activeSection, setActiveSection] = React.useState('basics');
  const [previewData, setPreviewData] = React.useState(draft || initialData || {});

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
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

  return (
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 print:relative print:overflow-visible">
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
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 mb-4 mt-2">Structure</p>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
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
        </nav>
        
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
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <Settings className="w-3.5 h-3.5" />
            Studio Settings
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
      <main className="flex-1 lg:pl-64 xl:pr-96 h-screen overflow-y-auto scroll-smooth print:pl-0 print:pr-0 print:overflow-visible print:h-auto">
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

      {/* 3. Right Preview Panel (Responsive) */}
      <aside className={cn(
        "w-96 fixed right-0 top-0 bottom-0 h-screen z-40 bg-white dark:bg-gray-950 shadow-2xl xl:shadow-none transition-transform duration-300 ease-in-out border-l border-gray-100 dark:border-gray-800 print:hidden",
        showMobilePreview ? "translate-x-0" : "translate-x-full xl:translate-x-0"
      )}>
        <LivePreview data={previewData} />
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
