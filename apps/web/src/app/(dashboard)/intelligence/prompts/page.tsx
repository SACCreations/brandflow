'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  History, 
  RotateCcw, 
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe,
  Settings,
  MoreVertical,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function PromptManagementPage() {
  const [activeTab, setActiveTab] = useState('active');

  const prompts = [
    { 
      id: 'p1', 
      name: 'Social Media Base', 
      layer: 'platform', 
      module: 'social', 
      version: 12, 
      score: 92, 
      status: 'active',
      template: "Act as a professional marketing manager. Tone: {{tone}}. Goal: {{campaign_objective}}."
    },
    { 
      id: 'p2', 
      name: 'B2B Brand Voice', 
      layer: 'brand', 
      module: 'all', 
      version: 4, 
      score: 88, 
      status: 'active',
      template: "Focus on authority and data-driven insights. Avoid superlatives like 'world-class'."
    },
    { 
      id: 'p3', 
      name: 'Q4 Promotion Lead-gen', 
      layer: 'campaign', 
      module: 'ads', 
      version: 2, 
      score: 75, 
      status: 'testing',
      template: "Highlight the 20% discount. CTA: {{cta_preferences}}."
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Prompt Engine</h1>
          <p className="mt-2 text-muted-foreground">Manage, version, and route the intelligence layer of your brand brain.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700">
          <Plus className="h-5 w-5" /> New Prompt Template
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Active Prompts" value="24" icon={<Zap className="h-5 w-5 text-amber-500" />} change="+2 this month" />
        <StatCard title="Avg. Quality Score" value="89.4" icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} change="+4.2% improvement" />
        <StatCard title="A/B Tests Running" value="3" icon={<Layers className="h-5 w-5 text-blue-500" />} change="Focus: High CTR" />
      </div>

      {/* Content Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Prompt List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search prompt templates..." 
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 border-border bg-background"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-1 bg-background border-border text-muted-foreground dark:hover:bg-surface-1">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          {prompts.map((prompt) => (
            <div key={prompt.id} className="group relative rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary hover:shadow-md border-border bg-background">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${
                    prompt.layer === 'platform' ? 'bg-surface-2 text-muted-foreground bg-surface-2' :
                    prompt.layer === 'brand' ? 'bg-primary/10 text-primary dark:bg-primary/100/10' :
                    'bg-purple-50 text-purple-600 dark:bg-purple-500/10'
                  }`}>
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{prompt.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                      <span>{prompt.layer} Layer</span>
                      <span>•</span>
                      <span>{prompt.module} Module</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{prompt.score}%</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Perf Score</div>
                  </div>
                  <button className="rounded-lg p-2 text-muted-foreground hover:bg-surface-2 dark:hover:bg-surface-1">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-surface-1 bg-background p-4 font-mono text-xs text-muted-foreground bg-surface-2/50 text-muted-foreground line-clamp-2">
                {prompt.template}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 border-border">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <History className="h-3.5 w-3.5" /> v{prompt.version}
                  </span>
                  {prompt.status === 'testing' && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10">A/B Testing</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                    History
                  </button>
                  <button className="rounded-lg bg-background px-4 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-black dark:bg-primary">
                    Edit Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Resolution Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-primary/10 bg-brand-50/20 p-6 dark:border-primary/20 dark:bg-primary/100/5">
            <h3 className="text-sm font-bold text-brand-900 text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              Resolution Preview
            </h3>
            <p className="text-xs text-brand-700/70 dark:text-brand-400/70 mb-6 leading-relaxed">
              See how the platform, business, and brand layers merge for the <span className="font-bold">Social</span> module.
            </p>

            <div className="space-y-4">
              <ResolutionStep label="Platform Base" template="Act as a marketing manager..." color="gray" />
              <div className="flex justify-center"><ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" /></div>
              <ResolutionStep label="Brand Voice" template="Focus on authority. No superlatives." color="brand" />
              <div className="flex justify-center"><ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" /></div>
              <ResolutionStep label="Campaign Context" template="Highlight 20% discount lead-gen." color="purple" />
            </div>

            <div className="mt-8 rounded-xl bg-background p-4 border border-primary/20 shadow-sm bg-background border-border">
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Final System Prompt</div>
              <div className="text-[11px] text-muted-foreground font-mono leading-relaxed italic">
                "Act as a professional marketing manager. Focus on authority. Avoid superlatives like 'world-class'. Highlight the 20% discount..."
              </div>
            </div>
          </div>

          {/* Governance Rules */}
          <div className="rounded-2xl border border-border bg-background p-6 border-border bg-background">
            <h3 className="text-sm font-bold text-foreground mb-4">Safety & Governance</h3>
            <div className="space-y-3">
              <RuleItem label="PII Sanitization" active />
              <RuleItem label="Competitor Blocking" active />
              <RuleItem label="Regulatory Claims" active />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, change }: any) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm border-border bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-xl bg-surface-1 bg-background p-2.5 bg-surface-2">{icon}</div>
        <span className="text-[10px] font-bold text-emerald-600 uppercase">{change}</span>
      </div>
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{title}</div>
    </div>
  );
}

function ResolutionStep({ label, template, color }: any) {
  return (
    <div className={`rounded-xl border p-3 ${
      color === 'brand' ? 'border-primary/20 bg-brand-50/50' : 
      color === 'purple' ? 'border-purple-200 bg-purple-50/50' : 
      'border-border bg-surface-1 bg-background'
    } bg-surface-2 border-border`}>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="text-[11px] text-muted-foreground text-foreground truncate">{template}</div>
    </div>
  );
}

function RuleItem({ label, active }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className={`h-2 w-8 rounded-full ${active ? 'bg-emerald-500' : 'bg-surface-3'}`}></div>
    </div>
  );
}
