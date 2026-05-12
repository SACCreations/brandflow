'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Sparkles, 
  History, 
  Settings,
  MoreVertical,
  Type,
  Layout,
  Share2,
  Trash2
} from 'lucide-react';
import QualityChecksWidget from '@/components/editor/quality-checks-widget';

export default function ContentEditorPage() {
  const [content, setContent] = useState(`## Elevate Your SaaS Growth with Brandflow AI

In today's fast-paced digital landscape, consistency is everything. But for growing SaaS brands, maintaining a unified voice across social, ads, and blogs is a constant struggle.

Brandflow AI is the first enterprise-grade operating system designed to automate your brand intelligence. By connecting your whitepapers, sales decks, and website, we build a living "brain" that ensures every piece of content you generate is 100% accurate.

**Key Benefits:**
* **Fact-Checked Accuracy:** Never worry about hallucinations again.
* **Scale with Soul:** Maintain your unique tone at 10x the volume.
* **Multichannel Ready:** One-click publishing to LinkedIn, Twitter, and more.

Join the 500+ founders who have already transformed their marketing workflow. Brandflow increases marketing productivity by 40%.`);

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white pb-6 dark:border-gray-800 dark:bg-transparent">
        <div className="flex items-center gap-4">
          <button className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Q4 SaaS Growth Campaign</h1>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              Draft • Last saved 2m ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
            <Save className="h-4 w-4" /> Save
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
            <Send className="h-4 w-4" /> Review & Publish
          </button>
          <button className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid h-full gap-6 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Toolbar */}
        <div className="hidden lg:flex flex-col gap-4 lg:col-span-1 border-r border-gray-100 pr-4 dark:border-gray-800">
          <ToolbarButton icon={<Type className="h-5 w-5" />} active />
          <ToolbarButton icon={<Layout className="h-5 w-5" />} />
          <ToolbarButton icon={<Sparkles className="h-5 w-5" />} />
          <ToolbarButton icon={<History className="h-5 w-5" />} />
          <div className="mt-auto">
            <ToolbarButton icon={<Settings className="h-5 w-5" />} />
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {/* Rich Text Toolbar Mockup */}
          <div className="flex items-center gap-2 border-b border-gray-100 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
            <select className="rounded-md border-gray-200 bg-white px-2 py-1 text-xs font-bold dark:border-gray-700 dark:bg-gray-800">
              <option>Heading 2</option>
              <option>Body Text</option>
            </select>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <button className="p-1.5 hover:bg-white rounded transition-colors font-serif font-bold">B</button>
            <button className="p-1.5 hover:bg-white rounded transition-colors italic">I</button>
            <button className="p-1.5 hover:bg-white rounded transition-colors underline">U</button>
          </div>
          
          <textarea 
            className="flex-1 w-full p-8 text-lg bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 font-medium leading-relaxed resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between dark:border-gray-800">
            <div className="flex gap-4 text-xs font-bold text-gray-400">
              <span>Words: {content.split(' ').length}</span>
              <span>Reading time: 1m 20s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform:</span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10">LinkedIn</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Quality Guard) */}
        <div className="lg:col-span-3 h-full">
          <QualityChecksWidget 
            score={78} 
            passed={false} 
            violations={[
              { type: 'factual_error', severity: 'high', detail: 'Marketing productivity claim (40%) contradicts Knowledge Hub (25%).' },
              { type: 'tone_mismatch', severity: 'medium', detail: 'Content tone is more casual than defined brand voice.' },
              { type: 'banned_phrase', severity: 'low', detail: 'Avoid using "Transform your workflow" as it is overused in SaaS.' }
            ]}
            remediation="Update productivity statistics to match validated whitepaper facts and refine the tone to be more authoritative."
          />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, active }: any) {
  return (
    <button className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
      active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800'
    }`}>
      {icon}
    </button>
  );
}
